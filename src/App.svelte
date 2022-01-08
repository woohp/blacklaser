<script lang="ts">
    import { Buffer } from 'buffer';
    import { onMount } from 'svelte';
    import type * as WebTorrent from 'webtorrent';

    interface Movie {
        background_image: string;
        background_image_original: string;
        date_uploaded: string;
        date_uploaded_unix: number;
        description_full: string;
        genres: string[];
        id: number;
        imdb_code: string;
        language: string;
        large_cover_image: string;
        medium_cover_image: string;
        mpa_rating: string;
        rating: number;
        runtime: number;
        slug: string;
        small_cover_image: string;
        state: string;
        summary: string;
        synopsis: string;
        title: string;
        title_english: string;
        title_long: string;
        torrents: Torrent[];
        url: string;
        year: number;
        yt_trailer_code: string;
    }

    interface Torrent {
        date_uploaded: string;
        date_uploaded_unix: number;
        hash: string;
        peers: number;
        quality: "720p"|"1080p"|"2160p";
        seeds: number;
        size: string;
        size_bytes: number;
        type: "bluray"|"web";
        url: string;
    }

    let queryTerm: string = '';
    let movies: Movie[] = [];
    let movieInfoHash: string|null = null;
    let movieTitle: string|null = null;
    let loading: boolean = false;
    let torrentInfo: {
        numPeers: number,
        progress: number,
        downloadSpeed: number,
        uploadSpeed: number,
        downloaded: number,
        length: number,
    }|null = null;

    let videoContainerEl: HTMLDivElement;

    onMount(async () => {
        console.debug(await getIpAndGeoInfo());

        const WebTorrent = await import('webtorrent');
        const client: WebTorrent.Instance = new (WebTorrent as any)();

        const urlParams = new URLSearchParams(window.location.search);

        movieInfoHash = urlParams.get("m");
        if (movieInfoHash) {
            loading = true;
            movieTitle = urlParams.get("n") || '';

            const opts = {
                announce: [
                    'wss://tracker.btorrent.xyz',
                    'wss://tracker.fastcast.nz',
                    'wss://tracker.openwebtorrent.com',
                ],
            };

            client.add(await getTorrent(movieInfoHash), opts, (torrent: WebTorrent.Torrent) => {
                // Got torrent metadata!
                console.info('Client is downloading:', torrent.infoHash);

                torrent.files.sort((a, b) => b.length - a.length);
                for (const file of torrent.files) {
                    if (file.name.endsWith('.mp4')) {
                        // Display the file by appending it to the DOM. Supports video, audio, images, and
                        // more. Specify a container element (CSS selector or reference to DOM node).
                        file.appendTo(videoContainerEl);
                        loading = false;
                        break;
                    }
                }

                setInterval(() => {
                    torrentInfo = {
                        downloadSpeed: torrent.downloadSpeed,
                        uploadSpeed: torrent.uploadSpeed,
                        progress: torrent.progress,
                        numPeers: torrent.numPeers,
                        downloaded: torrent.downloaded,
                        length: torrent.length,
                    };
                }, 1000);
            });

            return;
        }

        queryTerm = urlParams.get("q") || '';
        const response = await fetch(queryTerm === '' ? 'https://yts.mx/api/v2/list_movies.json?' : `https://yts.mx/api/v2/list_movies.jsonp?query_term=${queryTerm}&quality=1080p&sort_by=year`);
        const responseBody = await response.json() as {data: {movies: Movie[]}};
        let dedupHistory: Set<number> = new Set();
        for (let movie of responseBody.data.movies) {
            if (dedupHistory.has(movie.id))
                continue;
            movie.torrents = movie.torrents.filter(torrent => torrent.quality == '1080p');
            movie.torrents.sort((a, b) => a.type === b.type ? 0 : (a.type === 'bluray' ? -1 : 1));
            movies.push(movie);
            dedupHistory.add(movie.id);
        }
        movies = movies;
        console.debug(movies);
    });

    async function getTorrent(infoHash: string): Promise<string|Buffer> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20_000);  // timeout in 20 seconds

        try {
            const torrentResponse = await fetch(`https://yts.mx/torrent/download/${infoHash}`, {signal: controller.signal});
            clearTimeout(timeoutId);
            return Buffer.from(await torrentResponse.arrayBuffer());
        } catch (error) {
            // if it failed to download the .torrent file, then use magnet link instead
            if (error instanceof DOMException && error.name === 'AbortError')
                return `magnet:?xt=urn:btih:${movieInfoHash}`;
            else
                throw error;
        }
    }

    async function getIpAndGeoInfo() {
        const [ip, dbWorker] = await Promise.all([
            getExternalIp(),
            loadGeoIpDb(),
        ]);

        // convert ipv4 format to integer representation
        const ipv4 = ip.split('.').map(i => parseInt(i));
        const ipInteger = (ipv4[0] << 24) + (ipv4[1] << 16) + (ipv4[2] << 8) + ipv4[3] - 0x8000_0000;

        const rows: Record<string, any>[] = await dbWorker.db.query(`
select latitude, longitude, locations.*
from networks_idx
join networks on networks_idx.id = networks.rowid
join locations on networks.geoname_id = locations.geoname_id
where ${ipInteger} between networks_idx.first_address and networks_idx.last_address`) as Record<string, any>[];
        console.debug(rows);
        if (rows.length === 0) {
            alert('failed to check vpn, be careful...');
            return {};
        }

        const latitude = rows[0].latitude / 1e5;
        const longitude = rows[0].longitude / 1e5;
        return {...rows[0], ip, latitude, longitude};
    }

    async function getExternalIp(): Promise<string> {
        const { ip } = await (await fetch('https://www.myexternalip.com/json')).json();
        return ip;
    }

    async function loadGeoIpDb() {
        const { createDbWorker } = await import("sql.js-httpvfs");
        const workerUrl = new URL(
            "sql.js-httpvfs/dist/sqlite.worker.js",
            import.meta.url,
        );
        const wasmUrl = new URL(
            "sql.js-httpvfs/dist/sql-wasm.wasm",
            import.meta.url,
        );
        const config = {
            from: "inline",
            config: {
                serverMode: "chunked", // file is just a plain old full sqlite database
                urlPrefix: "geoip/db.sqlite3.",
                serverChunkSize: 46137344,
                requestChunkSize: 1024, // the page size of the  sqlite database (by default 4096)
                databaseLengthBytes: 407158784,
            }
        };
        const worker = await createDbWorker(
            [config],
            workerUrl.toString(),
            wasmUrl.toString(),
            // maxBytesToRead // optional, defaults to Infinity
        );
        return worker;
    }

    function humanFileSize(size: number): string {
        if (size < 1_000)
            return `${size.toFixed(2)} B`;
        else if (size < 1_000_000)
            return `${(size / 1_000).toFixed(2)} KB`;
        else if (size < 1_000_000_000)
            return `${(size / (1_000_000)).toFixed(2)} MB`;
        else
            return `${(size / (1_000_000_000)).toFixed(2)} GB`;
    }

    function humanElapsed(seconds: number): string|null {
        if (!isFinite(seconds))
            return null;
        let minutes: number = Math.floor(seconds / 60);
        seconds = Math.round(seconds % 60);
        let hours = Math.floor(minutes / 60);
        minutes = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function beforeUnload() {
    }
</script>

<nav class="bg-gray-800 py-2 px-5 mb-4 flex">
    <a class="hidden sm:block items-center justify-center inline-flex py-1.5 px-5 -ml-5 text-white" href="/">Home</a>
    <form action="." method="GET" class="w-full">
        <input name="q" type="search" class="rounded-full py-1.5 px-3 w-full" bind:value={queryTerm} placeholder="search">
    </form>

</nav>

<ul class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8 mx-3 text-sm">
    {#each movies as movie}
        <li title={movie.synopsis}>
            <a class="block h-full p-2 hover:bg-gray-200" href={`?m=${movie.torrents[0].hash}&n=${encodeURIComponent(movie.title)}`}>
                <img src={movie.medium_cover_image} alt="cover">
                <p class="overflow-hidden whitespace-nowrap text-ellipsis">{ movie.title }</p>
                <p class="text-sm">{ movie.year }</p>
            </a>
        </li>
    {/each}
</ul>

{#if movieInfoHash}
    <div bind:this={videoContainerEl} class="grid justify-center">
    {#if loading}
        <div class="text-center">loading...</div>
    {/if}
    </div>
{/if}

{#if movieTitle}
    <h1 class="items-center justify-center inline-flex py-1.5 mx-5 my-5 font-semibold">{ movieTitle }</h1>
{/if}

{#if torrentInfo}
    <div class="grid grid-cols-[10rem,auto] gap-x-4 gap-y-1 mx-5 font-mono text-sm">
        <div>Download Speed</div>
        <div>{ humanFileSize(torrentInfo.downloadSpeed) }/s</div>
        <div>Upload Speed</div>
        <div>{ humanFileSize(torrentInfo.uploadSpeed) }/s</div>
        <div>Progress</div>
        <div>{ (torrentInfo.progress * 100).toFixed(1) }%</div>
        <div>Num Peers</div>
        <div>{ torrentInfo.numPeers }</div>
        <div>Downloaded</div>
        <div>{ humanFileSize(torrentInfo.downloaded) }</div>
        <div>Total Size</div>
        <div>{ humanFileSize(torrentInfo.length) }</div>
        <div>ETA</div>
        <div>{ humanElapsed(((torrentInfo.length - torrentInfo.downloaded) / torrentInfo.downloadSpeed)) || '<TBD>' }</div>
    </div>
{/if}

<div class="h-32"></div>

<svelte:window on:beforeunload={beforeUnload} />

<svelte:head>
    {#if movieTitle}
        <title>{ movieTitle }</title>
    {:else}
        <title>BlackLaser</title>
    {/if}
</svelte:head>
