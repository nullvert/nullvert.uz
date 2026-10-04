import { defineConfig } from "astro/config";
import shirones from "shirones";

// Site-level settings (site URL, base, title, theme colour, fonts, …) live in
// `shirones/config/` so they stay typed and version-controlled with your
// content. This file only wires the theme in.
export default defineConfig({
  integrations: [
    shirones({
      // Override individual components by mirroring the theme's structure in
      // `src/components/`, or point at them explicitly:
      excludeRoutes: ["/archive"],
      components: {
        "organisms/Profile": "./src/components/organisms/Profile.astro",
        "organisms/DisplaySettings": "./src/components/organisms/DisplaySettings.svelte",
        "organisms/ArchivePanel": "./src/components/organisms/ArchivePanel.svelte",
        "layouts/MainGridLayout": "./src/layouts/MainGridLayout.astro",
      },
    }),
  ],
  vite: {
    optimizeDeps: {
      exclude: [
        "@i18n/translation",
        "@i18n/i18nKey",
        "@components/atoms/blog/ArchiveList.svelte",
        "@components/atoms/display/Card.svelte",
        "@utils/content-date",
        "@utils/url-utils",
        "shirones",
      ],
    },
  },
});
