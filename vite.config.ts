import { defineConfig } from "vite";
import path from "node:path";
import electron from "vite-plugin-electron/simple";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const dockerWebOnly = process.env.TANAW_DOCKER_WEB_ONLY === "true";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ...(
      dockerWebOnly
        ? []
        : [
            electron({
              main: {
                // Shortcut of `build.lib.entry`.
                entry: "electron/main.ts",
              },
              preload: {
                // Shortcut of `build.rollupOptions.input`.
                // Preload scripts may contain web assets, so use `build.rollupOptions.input` instead of `build.lib.entry`.
                input: path.join(__dirname, "electron/preload.ts"),
              },
              // Polyfill the Electron and Node.js API for the renderer process.
              // See https://github.com/electron-vite/vite-plugin-electron-renderer
              renderer: process.env.NODE_ENV === "test" ? undefined : {},
            }),
          ]
    ),
  ],
});
