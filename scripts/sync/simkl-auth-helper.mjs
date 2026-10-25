import {
	loadEnvFile,
	getSetting,
	fetchJson,
	updateEnvFile,
} from "./sync-common.mjs";

/**
 * Manages Simkl Auth credentials and transparently refreshes expired access tokens.
 */
export class SimklAuthManager {
	constructor(env = loadEnvFile()) {
		this.clientId = getSetting("SIMKL_CLIENT_ID", { env });
		this.accessToken = getSetting("SIMKL_ACCESS_TOKEN", { env });
		this.refreshToken = getSetting("SIMKL_REFRESH_TOKEN", { env });
		this.clientSecret = getSetting("SIMKL_CLIENT_SECRET", { env });
	}

	validate() {
		if (!this.clientId || (!this.accessToken && !this.refreshToken)) {
			console.error("[Simkl] Error: SIMKL_CLIENT_ID and SIMKL_ACCESS_TOKEN are missing in .env!");
			console.error("[Simkl] Run: pnpm cinema:auth to link your Simkl account.\n");
			process.exit(1);
		}
	}

	/**
	 * Attempt to exchange refresh_token for a new access_token.
	 */
	async refresh() {
		if (!this.refreshToken) return false;

		console.log("[Simkl] Attempting to refresh expired access token using refresh_token...");
		try {
			const payload = {
				grant_type: "refresh_token",
				refresh_token: this.refreshToken,
				client_id: this.clientId,
				...(this.clientSecret ? { client_secret: this.clientSecret } : {}),
			};

			const res = await fetchJson("https://api.simkl.com/oauth/token", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			}, { label: "Simkl Token Refresh" });

			if (res?.access_token) {
				this.accessToken = res.access_token;
				const updates = { SIMKL_ACCESS_TOKEN: res.access_token };
				if (res.refresh_token) {
					this.refreshToken = res.refresh_token;
					updates.SIMKL_REFRESH_TOKEN = res.refresh_token;
				}
				updateEnvFile(updates);
				console.log("[Simkl] ✔ Access token refreshed successfully and saved to .env!");
				return true;
			}
		} catch (err) {
			console.warn(`[Simkl] Refresh token exchange failed: ${err.message}`);
		}
		return false;
	}

	/**
	 * Executes an authenticated API call against Simkl, automatically refreshing token on 401.
	 */
	async fetchWithAuth(url, options = {}, label = "Simkl") {
		const makeRequest = () => {
			const headers = {
				...(options.headers || {}),
				Authorization: `Bearer ${this.accessToken}`,
				"simkl-api-key": this.clientId,
			};
			return fetchJson(url, { ...options, headers }, { label });
		};

		try {
			return await makeRequest();
		} catch (err) {
			const isAuthError = err.message && (
				err.message.includes("401") ||
				err.message.includes("Unauthorized") ||
				err.message.includes("invalid_token")
			);

			if (isAuthError) {
				console.warn("[Simkl] Access token is invalid or expired.");
				const refreshed = await this.refresh();
				if (refreshed) {
					return await makeRequest();
				}
				console.error("\n[Simkl] Не удалось автоматически обновить токен.");
				console.error("[Simkl] Пожалуйста, запустите:  pnpm cinema:auth  чтобы обновить авторизацию за 10 секунд.\n");
			}
			throw err;
		}
	}
}
