import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "autoUpdate" swaps in the new service worker + assets as soon as
      // they're downloaded, no user prompt needed for a simple internal
      // tool like this — see PWAUpdateToast.jsx for the one exception
      // (a page reload IS needed to actually run the new JS, so we still
      // show a small "versi baru tersedia" toast rather than silently
      // reloading mid-session and losing unsaved form state).
      registerType: "autoUpdate",
      // We register the service worker ourselves via useRegisterSW in
      // PWAUpdateToast.jsx (needed to show the update/offline-ready
      // toast) — injectRegister must be false so the plugin doesn't
      // ALSO auto-inject its own <script> that calls register(),
      // which would register the service worker twice.
      injectRegister: false,
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icon.svg"],
      manifest: {
        name: "LinkHub",
        short_name: "LinkHub",
        description: "Direktori link tim — folder, tag, dan pencarian untuk semua link kerja.",
        start_url: "/",
        display: "standalone",
        // Matches --background/--foreground in index.css (near-white,
        // near-black) so the splash screen doesn't flash a mismatched
        // color before the app's own CSS loads.
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Precache the built app shell (JS/CSS/HTML/icons) so the app
        // still loads with no network at all.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        // SPA client-side routing: any navigation Workbox can't find in
        // the precache (i.e. every route except "/") falls back to the
        // shell, same reason nginx.conf has try_files ... /index.html.
        navigateFallback: "/index.html",
        // API prefix comes from perancangan-sistem-linkhub.md section 6.
        // Only GET is ever cached — Workbox's urlPattern + method match
        // means POST/PATCH/DELETE requests always hit the network
        // directly and are never intercepted, so writes can't silently
        // "succeed" against a stale cache.
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith("/api/") && request.method === "GET",
            handler: "NetworkFirst",
            options: {
              cacheName: "linkhub-api-cache",
              // Network is tried first with this timeout; only on
              // failure/timeout does the last-known response (if any)
              // get served — so a logged-in user with a flaky
              // connection still sees their last-seen folders/items
              // instead of a blank error page.
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google-service icons in src/assets — content-hashed by
            // Vite's build already, so CacheFirst is safe: a changed
            // file gets a new hashed URL, never reuses a stale cache key.
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "linkhub-image-cache",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        // Lets you test the service worker with `npm run dev` instead of
        // only in a production build — off by default since it adds
        // overhead you don't want during normal day-to-day dev work.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
  },
})