// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://tandem-software-management.github.io",
  base: "/landing-verifactu",
  vite: {
    plugins: [tailwindcss()],
  },
});
