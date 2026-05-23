import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite-plus";

export default defineConfig({
    fmt: {
        ignorePatterns: ["docs/**", "src/vendor/**"],
        tabWidth: 4,
    },
    lint: {
        ignorePatterns: ["docs/**", "src/vendor/**"],
        jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
        options: {
            typeAware: true,
            typeCheck: true,
        },
        rules: {
            "no-unassigned-vars": "off",
            "vite-plus/prefer-vite-plus-imports": "error",
        },
    },
    base: "/blacklaser/",
    root: "src",
    publicDir: "vendor",
    plugins: [svelte({ configFile: false })],
    build: {
        outDir: "../docs",
        emptyOutDir: false,
    },
});
