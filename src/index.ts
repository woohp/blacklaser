import { Buffer } from "node:buffer";

async function main() {
    const App = await import("./App.svelte");
    console.debug("App", App);

    const appEl = document.querySelector("#app") as HTMLDivElement;
    appEl.classList.remove("hidden");

    const app = new App.default({
        target: appEl,
    });
}

main();
