import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// PWA instalável + offline shell. O service worker (Workbox) faz cache do app;
// o estado do diário é guardado no IndexedDB (ver src/lib/db.ts) e sincroniza
// com a API quando há rede.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Ponte Visual",
        short_name: "Ponte",
        description: "Diário comportamental — Hack Tech Farm",
        theme_color: "#111111",
        background_color: "#F4F2EE",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Não pré-cacheia os MP3 (grandes); eles entram no cache ao tocar.
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,jpeg,woff2}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/audio\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith("/audio/"),
            handler: "CacheFirst",
            options: {
              cacheName: "audiolivro",
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
});
