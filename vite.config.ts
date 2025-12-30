import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["smart-nfe-hub.onrender.com"],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: mode === "development" },
      includeAssets: ["pwa-icon.svg", "favicon.ico", "robots.txt"],
      manifest: {
        name: "Gestão NFe",
        short_name: "Gestão NFe",
        description: "Consulta de preços e gestão de NF-e",
        start_url: "/",
        display: "standalone",
        theme_color: "#0ea5e9",
        background_color: "#0b1220",
        icons: [
          {
            src: "/pwa-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

