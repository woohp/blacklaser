import { mount } from "svelte";
import App from "./App.svelte";
import "./style.css";

const target = document.querySelector("#app");

if (!(target instanceof HTMLElement)) {
    throw new Error("Could not find app mount point.");
}

mount(App, {
    target,
});
