import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

export default defineConfig({
    base: "/blacklaser/",
    root: "src",
    publicDir: "vendor",
    plugins: [svelte({ configFile: false })],
    build: {
        outDir: "../docs",
        emptyOutDir: false,
    },
});
