<script lang="ts">
    import { Buffer } from 'buffer';
    import { onMount } from 'svelte';
    import * as WebTorrent from 'webtorrent';

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
    /* let movieTitle: string|null = null; */
    let loading: boolean = false;

    let videoContainerEl: HTMLDivElement;

    onMount(async () => {
        const client: WebTorrent.Instance = new (WebTorrent as any)();

        const urlParams = new URLSearchParams(window.location.search);

        movieInfoHash = urlParams.get("m");
        if (movieInfoHash) {
            /* movieTitle = urlParams.get("n") || ''; */

            const magnetURI = `https://yts.mx/torrent/download/${movieInfoHash}`;
            const torrentResponse = await fetch(magnetURI);
            const torrentContent = await torrentResponse.arrayBuffer();
            const opts = {
                announce: [
                    'wss://tracker.btorrent.xyz',
                    'wss://tracker.fastcast.nz',
                    'wss://tracker.openwebtorrent.com',
                ],
            };

            client.add(Buffer.from(torrentContent), opts, (torrent: WebTorrent.Torrent) => {
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
            });
            loading = true;

            return;
        }

        queryTerm = urlParams.get("q") || '';
        if (!queryTerm || queryTerm === '')
            return;

        const response = await fetch(`https://yts.mx/api/v2/list_movies.jsonp?query_term=${queryTerm}&quality=720p&sort_by=year`);
        const responseBody = await response.json() as {data: {movies: Movie[]}};
        let dedupHistory: Set<number> = new Set();
        for (let movie of responseBody.data.movies) {
            if (dedupHistory.has(movie.id))
                continue;
            movie.torrents = movie.torrents.filter(torrent => torrent.quality == '720p');
            movie.torrents.sort((a, b) => a.type === b.type ? 0 : (a.type === 'bluray' ? -1 : 1));
            movies.push(movie);
            dedupHistory.add(movie.id);
        }
        movies = movies;
        console.debug(movies);
    });

    function beforeUnload() {
    }
</script>

<nav class="bg-gray-800 py-2 px-3 mb-4">
    <form action="." method="GET">
        <input name="q" type="search" class="rounded-full py-1.5 px-3" bind:value={queryTerm} placeholder="search">
    </form>
</nav>

<ul class="grid grid-cols-6 gap-x-4 gap-y-8 mx-5">
    {#each movies as movie}
        <li class="">
            <a href={`?m=${movie.torrents[0].hash}&n=${encodeURIComponent(movie.title)}`}>
                <img src={movie.medium_cover_image} alt="cover">
                <p class="text-sm">{ movie.title_long }</p>
                <p class="text-xs">{ movie.synopsis }</p>
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

<svelte:window on:beforeunload={beforeUnload} />
