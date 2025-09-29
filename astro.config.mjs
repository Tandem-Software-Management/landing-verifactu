// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://verifactu-tandem.github.io",
  base: "/landing-varifactu",
  vite: {
    plugins: [tailwindcss()],
  },
});
