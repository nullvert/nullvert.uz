import type { APIRoute } from "astro";

const siteUrl = import.meta.env.SITE ? new URL("sitemap-index.xml", import.meta.env.SITE).href : "/sitemap-index.xml";

const robotsTxt = `
User-agent: *
Disallow: /_astro/
Disallow: /assets/music/

Sitemap: ${siteUrl}
`.trim();

export const GET: APIRoute = () => {
	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
