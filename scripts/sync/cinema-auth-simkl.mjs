import {
	getSetting,
	loadEnvFile,
	fetchJson,
	delay,
	updateEnvFile,
} from "./sync-common.mjs";

const env = loadEnvFile();
const CLIENT_ID = getSetting("SIMKL_CLIENT_ID", { env });

if (!CLIENT_ID) {
	console.error("[Simkl Auth] Error: SIMKL_CLIENT_ID is not configured in .env!");
	process.exit(1);
}

async function startDeviceFlow() {
	console.log("[Simkl Auth] Запрос кода авторизации (OAuth 2.0 Device Flow)...");

	try {
		const deviceData = await fetchJson("https://api.simkl.com/oauth2/device", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ client_id: CLIENT_ID }),
		}, { label: "Simkl Device Init" });

		const { device_code, user_code, verification_uri_complete, interval = 5, expires_in = 900 } = deviceData;

		console.log("\n============================================================");
		console.log("             АВТОРИЗАЦИЯ SIMKL (OAUTH 2.0)");
		console.log("============================================================");
		console.log(`1. Откройте прямую ссылку:  ${verification_uri_complete}`);
		console.log(`   (или перейдите на https://simkl.com/pin и введите код: ${user_code})`);
		console.log(`2. Нажмите "Approve / Подтвердить"`);
		console.log(`(Код действителен ${Math.round(expires_in / 60)} минут)`);
		console.log("============================================================\n");
		console.log("Ожидание подтверждения в браузере...");

		const startTime = Date.now();
		const maxWaitMs = expires_in * 1000;
		const pollIntervalMs = Math.max(5, interval) * 1000;

		while (Date.now() - startTime < maxWaitMs) {
			await delay(pollIntervalMs);

			try {
				const tokenResponse = await fetch("https://api.simkl.com/oauth2/token", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						grant_type: "urn:ietf:params:oauth:grant-type:device_code",
						client_id: CLIENT_ID,
						device_code,
					}),
				});

				const json = await tokenResponse.json();

				if (tokenResponse.ok && json.access_token) {
					console.log("\n✔ Успешно авторизовано!");
					console.log(`Новый access_token: ${json.access_token.slice(0, 15)}...`);

					const updates = {
						SIMKL_ACCESS_TOKEN: json.access_token,
					};

					if (json.refresh_token) {
						updates.SIMKL_REFRESH_TOKEN = json.refresh_token;
						console.log(`Получен refresh_token: ${json.refresh_token.slice(0, 15)}... (действителен 180 дней)`);
					}

					updateEnvFile(updates);
					console.log("✔ Файл .env успешно обновлен!");
					console.log("\nЗапуск синхронизации: pnpm cinema:sync");
					return;
				}

				if (json.error === "authorization_pending") {
					// Пользователь ещё не нажал кнопку, продолжаем опрос
					continue;
				}

				if (json.error === "slow_down") {
					await delay(5000);
					continue;
				}

				if (json.error) {
					console.warn(`[Simkl Auth] Статус: ${json.error_description || json.error}`);
				}
			} catch (pollErr) {
				// Ошибки сети во время опроса
			}
		}

		console.error("\n❌ Время ожидания истекло. Пожалуйста, запустите команду снова.");
		process.exit(1);
	} catch (err) {
		console.error("\n❌ Ошибка запуска авторизации Simkl:", err.message);
		process.exit(1);
	}
}

startDeviceFlow();
