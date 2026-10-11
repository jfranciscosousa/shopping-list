import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { config } from "dotenv";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: Number(process.env.PORT ?? 3000),
    strictPort: true,
    allowedHosts: process.env.ALLOWED_DEV_ORIGINS?.split(",")
      .map((host) => host.trim())
      .filter(Boolean),
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      routeRules: {
        "/**": {
          headers: {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "strict-origin-when-cross-origin",
          },
        },
      },
    }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
});
