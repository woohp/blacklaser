# Agent Notes

## Commands

- Use Bun for dependency/script commands; `bun.lock` is the committed lockfile.
- Install deps with `bun install` if `node_modules` is absent.
- Dev server: `bun run dev` runs `scripts/vendor-assets.sh` first, then Vite with host `0.0.0.0`.
- Production build: `bun run build` runs `scripts/build-assets.sh`, which vendors WebTorrent's service worker and clears top-level `docs/` before `vite build`.
- Static preview: `bun run preview`.
- Verification: `bun run lint` and `bun run check`; there is no test script in `package.json`.
- Format TS/Svelte/Vite files with `bun run format`; lint only covers `src/**/*.ts` and `vite.config.ts`, so check `.svelte` changes with `bun run check`.

## App Structure

- Vite is configured with `root: "src"`, so `src/index.html` and `src/index.ts` are the app entrypoints.
- Build output is `docs/` with `base: "/blacklaser/"`; this appears intended for GitHub Pages-style deployment, not the default Vite `dist/`.
- `src/App.svelte` is the main UI and uses Svelte 5 runes (`$state`) with `configFile: false` in the Svelte Vite plugin.
- `src/yts.ts` talks directly to `https://yts.bz`; `src/webtorrent.ts` imports `webtorrent/dist/webtorrent.min.js` through `src/types/webtorrent-browser-bundle.d.ts`.
- WebTorrent streaming depends on `sw.min.js` being present under Vite's public dir (`src/vendor/sw.min.js`), generated from `node_modules/webtorrent/dist/sw.min.js` by `scripts/vendor-assets.sh`.

## Generated And Ignored Files

- Do not hand-edit `src/vendor/` or `src/sw.min.js`; they are ignored/generated assets.
- Treat `docs/` as build output; `bun run build` deletes its top-level contents before rebuilding.
- `scripts/geolite2-to-sqlite.py` is a standalone legacy utility with Python formatting config in `setup.cfg`; it is not wired into npm/Bun scripts.
