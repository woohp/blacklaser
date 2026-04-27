<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { humanElapsed, humanFileSize } from "./format";
    import { getTorrent, searchMovies, type Movie } from "./yts";
    import {
        createWebTorrentClient,
        getTorrentInfo,
        type TorrentInfo,
        type WebTorrentClient,
        type WebTorrentTorrent,
    } from "./webtorrent";

    const announce = ["wss://tracker.btorrent.xyz", "wss://tracker.fastcast.nz", "wss://tracker.openwebtorrent.com"];

    let queryTerm = $state("");
    let movies = $state<Movie[]>([]);
    let movieInfoHash = $state<string | null>(null);
    let movieTitle = $state<string | null>(null);
    let loading = $state(false);
    let errorMessage = $state<string | null>(null);
    let torrentInfo = $state<TorrentInfo | null>(null);
    let videoEl = $state<HTMLVideoElement>();

    let client: WebTorrentClient | null = null;
    let statsInterval: ReturnType<typeof setInterval> | null = null;

    onMount(() => {
        void boot();
    });

    onDestroy(() => {
        if (statsInterval) {
            clearInterval(statsInterval);
        }
        client?.destroy();
    });

    async function boot() {
        const urlParams = new URLSearchParams(window.location.search);
        queryTerm = urlParams.get("q") ?? "";

        if (queryTerm.startsWith("magnet:?")) {
            redirectMagnetSearch(queryTerm);
            return;
        }

        movieInfoHash = urlParams.get("m");
        movieTitle = urlParams.get("n");

        if (movieInfoHash) {
            await playMovie(movieInfoHash, urlParams.get("magnet"));
            return;
        }

        await loadMovies(queryTerm);
    }

    function redirectMagnetSearch(magnet: string) {
        const magnetParams = new URL(magnet).searchParams;
        const infoHash = magnetParams
            .getAll("xt")
            .find((value) => value.startsWith("urn:btih:"))
            ?.slice("urn:btih:".length)
            .toUpperCase();

        if (!infoHash) {
            errorMessage = "That magnet link does not include a BitTorrent info hash.";
            return;
        }

        const params = new URLSearchParams({
            m: infoHash,
            n: magnetParams.get("dn") ?? "",
            magnet,
        });
        location.replace(`${location.pathname}?${params.toString()}`);
    }

    async function loadMovies(searchTerm: string) {
        loading = true;
        errorMessage = null;

        try {
            movies = await searchMovies(searchTerm);
        } catch (error) {
            errorMessage = error instanceof Error ? error.message : "Movie search failed.";
            movies = [];
        } finally {
            loading = false;
        }
    }

    async function playMovie(infoHash: string, magnet: string | null) {
        loading = true;
        errorMessage = null;

        try {
            const webTorrentClient = createWebTorrentClient();
            webTorrentClient.on("error", setTorrentError);
            client = webTorrentClient;
            await createWebTorrentServer();

            webTorrentClient.add(magnet ?? (await getTorrent(infoHash)), { announce }, (torrent) => streamTorrent(torrent));
        } catch (error) {
            loading = false;
            errorMessage = error instanceof Error ? error.message : "Could not start WebTorrent.";
        }
    }

    async function createWebTorrentServer() {
        if (!("serviceWorker" in navigator) || !client) {
            return;
        }

        const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.min.js`, {
            scope: import.meta.env.BASE_URL,
        });
        const worker = registration.active ?? registration.waiting ?? registration.installing;

        if (!worker) {
            return;
        }

        if (worker.state === "activated") {
            client.createServer({ controller: registration });
            return;
        }

        await new Promise<void>((resolve) => {
            worker.addEventListener("statechange", () => {
                if (worker.state === "activated") {
                    client?.createServer({ controller: registration });
                    resolve();
                }
            });
        });
    }

    function streamTorrent(torrent: WebTorrentTorrent) {
        torrent.on("error", setTorrentError);

        const file = [...torrent.files]
            .sort((a, b) => b.length - a.length)
            .find((torrentFile) => /\.(mp4|m4v|webm|mkv)$/i.test(torrentFile.name));

        if (!file) {
            loading = false;
            errorMessage = "No playable video file was found in this torrent.";
            return;
        }

        if (!videoEl) {
            loading = false;
            errorMessage = "The video player is not ready yet.";
            return;
        }

        file.streamTo(videoEl);
        loading = false;
        updateTorrentInfo(torrent);
        statsInterval = setInterval(() => updateTorrentInfo(torrent), 1000);
    }

    function updateTorrentInfo(torrent: WebTorrentTorrent) {
        torrentInfo = getTorrentInfo(torrent);
    }

    function setTorrentError(error: Error) {
        loading = false;
        errorMessage = error.message;
    }

    function movieUrl(movie: Movie) {
        const params = new URLSearchParams({
            m: movie.torrents[0].hash,
            n: movie.title,
        });
        return `${location.pathname}?${params.toString()}`;
    }
</script>

<svelte:head>
    <title>{movieTitle || "BlackLaser"}</title>
</svelte:head>

<nav class="topbar">
    <a class="brand" href={import.meta.env.BASE_URL}>BlackLaser</a>
    <form action="." method="GET" class="search-form">
        <input name="q" type="search" bind:value={queryTerm} placeholder="Search YTS or paste a magnet link" />
    </form>
</nav>

<main>
    {#if errorMessage}
        <div class="notice error">{errorMessage}</div>
    {/if}

    {#if movieInfoHash}
        <section class="player-shell">
            <video bind:this={videoEl} controls playsinline></video>
            {#if loading}
                <div class="notice">Connecting to peers...</div>
            {/if}
        </section>
    {:else}
        {#if loading}
            <div class="notice">Searching movies...</div>
        {/if}

        {#if movies.length > 0}
            <ul class="movie-grid">
                {#each movies as movie (movie.id)}
                    <li title={movie.synopsis || movie.summary}>
                        <a class="movie-card" href={movieUrl(movie)}>
                            <img src={movie.medium_cover_image} alt={`${movie.title} cover`} loading="lazy" />
                            <span class="movie-title">{movie.title}</span>
                            <span class="movie-meta">{movie.year} · {movie.rating}/10 · {movie.torrents[0].size}</span>
                        </a>
                    </li>
                {/each}
            </ul>
        {:else if !loading && queryTerm}
            <div class="notice">No 1080p YTS results found for “{queryTerm}”.</div>
        {/if}
    {/if}

    {#if movieTitle}
        <h1>{movieTitle}</h1>
    {/if}

    {#if torrentInfo}
        <dl class="stats">
            <dt>Download Speed</dt>
            <dd>{humanFileSize(torrentInfo.downloadSpeed)}/s</dd>
            <dt>Upload Speed</dt>
            <dd>{humanFileSize(torrentInfo.uploadSpeed)}/s</dd>
            <dt>Progress</dt>
            <dd>{(torrentInfo.progress * 100).toFixed(1)}%</dd>
            <dt>Peers</dt>
            <dd>{torrentInfo.numPeers}</dd>
            <dt>Downloaded</dt>
            <dd>{humanFileSize(torrentInfo.downloaded)}</dd>
            <dt>Total Size</dt>
            <dd>{humanFileSize(torrentInfo.length)}</dd>
            <dt>ETA</dt>
            <dd>{humanElapsed((torrentInfo.length - torrentInfo.downloaded) / torrentInfo.downloadSpeed) || "TBD"}</dd>
        </dl>
    {/if}
</main>

<style>
    :global(*) {
        box-sizing: border-box;
    }

    :global(body) {
        margin: 0;
        min-width: 320px;
        background: #080b11;
        color: #ecf2ff;
        font-family:
            Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    :global(a) {
        color: inherit;
    }

    .topbar {
        position: sticky;
        top: 0;
        z-index: 1;
        display: flex;
        gap: 1rem;
        align-items: center;
        padding: 0.85rem clamp(1rem, 4vw, 2.5rem);
        background: rgba(8, 11, 17, 0.88);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(18px);
    }

    .brand {
        flex: 0 0 auto;
        font-weight: 800;
        letter-spacing: -0.04em;
        text-decoration: none;
    }

    .search-form {
        flex: 1;
    }

    input {
        width: 100%;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 999px;
        padding: 0.75rem 1rem;
        background: rgba(255, 255, 255, 0.08);
        color: inherit;
        font: inherit;
        outline: none;
    }

    input:focus {
        border-color: #66e3ff;
        box-shadow: 0 0 0 3px rgba(102, 227, 255, 0.16);
    }

    main {
        width: min(1180px, 100%);
        margin: 0 auto;
        padding: clamp(1rem, 3vw, 2rem);
    }

    .movie-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: clamp(0.85rem, 2vw, 1.4rem);
        padding: 0;
        margin: 0;
        list-style: none;
    }

    .movie-card {
        display: grid;
        gap: 0.45rem;
        min-height: 100%;
        padding: 0.55rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 1rem;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
        text-decoration: none;
        transition:
            transform 160ms ease,
            border-color 160ms ease;
    }

    .movie-card:hover {
        transform: translateY(-3px);
        border-color: rgba(102, 227, 255, 0.45);
    }

    .movie-card img {
        width: 100%;
        aspect-ratio: 2 / 3;
        border-radius: 0.7rem;
        object-fit: cover;
        background: rgba(255, 255, 255, 0.08);
    }

    .movie-title {
        overflow: hidden;
        font-weight: 700;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .movie-meta {
        color: #a8b3c7;
        font-size: 0.82rem;
    }

    .player-shell {
        display: grid;
        justify-items: center;
        gap: 1rem;
    }

    video {
        width: min(100%, 1080px);
        max-height: 72vh;
        border-radius: 1rem;
        background: #000;
    }

    h1 {
        margin: 1.25rem 0;
        font-size: clamp(1.4rem, 4vw, 2.5rem);
        letter-spacing: -0.04em;
    }

    .notice {
        margin: 1rem 0;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.9rem;
        background: rgba(255, 255, 255, 0.07);
        color: #cbd6ea;
    }

    .error {
        border-color: rgba(255, 113, 113, 0.38);
        background: rgba(255, 113, 113, 0.12);
        color: #ffd7d7;
    }

    .stats {
        display: grid;
        grid-template-columns: minmax(8rem, max-content) 1fr;
        gap: 0.45rem 1rem;
        width: min(100%, 34rem);
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.06);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 0.92rem;
    }

    dt {
        color: #a8b3c7;
    }

    dd {
        margin: 0;
    }

    @media (max-width: 600px) {
        .topbar {
            align-items: stretch;
            flex-direction: column;
        }

        .movie-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }
</style>
