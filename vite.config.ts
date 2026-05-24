import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
// Base path is "/playbook2/" when building for GitHub Pages (set via env var by
// the deploy workflow). Local dev / preview use "./".
const isPagesBuild = process.env.GITHUB_PAGES === "true";

export default defineConfig({
    base: isPagesBuild ? "/playbook2/" : "./",
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules")) {
                        return id.toString().split("node_modules/")[1].split("/")[0].toString();
                    }
                }
            }
        }
    },
    resolve: {
        alias: {
            vue: "vue/dist/vue.esm-bundler.js"
        }
    },
    plugins: [
        vue(),
        vueJsx({
            // options are passed on to @vue/babel-plugin-jsx
        }),
        tailwindcss(),
        tsconfigPaths(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.svg", "icons/*.svg"],
            manifest: {
                name: "Playbook: A History of Disinformation",
                short_name: "Playbook",
                description: "An incremental game about the history of disinformation.",
                theme_color: "#212121",
                background_color: "#000000",
                display: "standalone",
                orientation: "portrait",
                scope: "./",
                start_url: "./",
                icons: [
                    { src: "icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
                    { src: "icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
                    {
                        src: "icons/icon-maskable-512.svg",
                        sizes: "512x512",
                        type: "image/svg+xml",
                        purpose: "maskable"
                    }
                ]
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,svg,png,woff2,json,md,mp3,ogg}"],
                // Background music is ~2.8 MB; default precache size limit
                // is 2 MB which would exclude it. Bump to 6 MB so the
                // music caches for offline play too.
                maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-stylesheets",
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-webfonts",
                            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
                        }
                    }
                ]
            }
        })
    ]
});
