# Agent Notes

## Commands

- Use npm for dependency/script commands; `package-lock.json` is the committed lockfile.
- Install deps with `npm install` if `node_modules` is absent.
- Dev server: `npm run dev` runs `scripts/vendor-assets.sh` first, then Vite with host `0.0.0.0`.
- Production build: `npm run build` runs `scripts/build-assets.sh`, which vendors WebTorrent's service worker and clears top-level `docs/` before `vite build`.
- Static preview: `npm run preview`.
- Verification: `npm run lint` and `npm run check`; there is no test script in `package.json`.
- Format TS/Svelte/Vite files with `npm run format`; lint only covers `src/**/*.ts` and `vite.config.ts`, so check `.svelte` changes with `npm run check`.

## App Structure

- Vite is configured with `root: "src"`, so `src/index.html` and `src/index.ts` are the app entrypoints.
- Build output is `docs/` with `base: "/blacklaser/"`; this appears intended for GitHub Pages-style deployment, not the default Vite `dist/`.
- `src/App.svelte` is the main UI and uses Svelte 5 runes (`$state`) with `configFile: false` in the Svelte Vite plugin.
- `src/yts.ts` talks directly to `https://yts.bz`; `src/webtorrent.ts` imports `webtorrent/dist/webtorrent.min.js` through `src/types/webtorrent-browser-bundle.d.ts`.
- WebTorrent streaming depends on `sw.min.js` being present under Vite's public dir (`src/vendor/sw.min.js`), generated from `node_modules/webtorrent/dist/sw.min.js` by `scripts/vendor-assets.sh`.

## Generated And Ignored Files

- Do not hand-edit `src/vendor/` or `src/sw.min.js`; they are ignored/generated assets.
- Treat `docs/` as build output; `npm run build` deletes its top-level contents before rebuilding.
- `scripts/geolite2-to-sqlite.py` is a standalone legacy utility with Python formatting config in `setup.cfg`; it is not wired into npm scripts.
