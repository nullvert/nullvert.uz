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
      excludeRoutes: ["/archive", "/robots.txt", "/games", "/anime", "/cinema", "/compass", "/books", "/posts", "/posts/[...slug]", "/credits-and-licenses"],
      components: {
        "atoms/display/AccentBar": "./src/components/atoms/display/AccentBar.svelte",
        "atoms/blog/ArchiveList": "./src/components/atoms/blog/ArchiveList.svelte",
        "organisms/Profile": "./src/components/organisms/Profile.astro",
        "organisms/DisplaySettings": "./src/components/organisms/DisplaySettings.svelte",
        "organisms/ArchivePanel": "./src/components/organisms/ArchivePanel.svelte",
        "organisms/SiteNavigationDrawer": "./src/components/organisms/SiteNavigationDrawer.svelte",
        "organisms/TopAppBar": "./src/components/organisms/TopAppBar.astro",
        "molecules/SeriesCard": "./src/components/molecules/SeriesCard.astro",
        "organisms/CompassSection": "./src/components/organisms/CompassSection.svelte",
        "molecules/CompassTile": "./src/components/molecules/CompassTile.svelte",
        "molecules/CatalogFilterItem": "./src/components/molecules/CatalogFilterItem.svelte",
        "layouts/MainGridLayout": "./src/layouts/MainGridLayout.astro",
      },
    }),
  ],
  vite: {
    server: {
      // Hot reloading отключён: он вызывал частичные перерисовки и «битые» страницы.
      // Для обновления — обычный F5.
      // hmr: false,
    },
    optimizeDeps: {
      holdUntilCrawlEnd: true,
      exclude: [
        "@i18n/translation",
        "@i18n/i18nKey",
        "@components/atoms/action/Button.svelte",
        "@components/atoms/action/IconButton.svelte",
        "@components/atoms/blog/ArchiveList.svelte",
        "@components/atoms/display/Card.svelte",
        "@components/atoms/feedback/LoadingIndicator.svelte",
        "@components/atoms/feedback/ProgressIndicator.svelte",
        "@components/atoms/input/TextField.svelte",
        "@components/atoms/overlay/Dialog.svelte",
        "@components/atoms/selection/Slider.svelte",
        "@components/atoms/selection/Switch.svelte",
        "@components/molecules/SectionTitle.svelte",
        "@utils/content-date",
        "@utils/url-utils",
        "@utils/share-poster",
        "shirones",
      ],
    },
  },
});
