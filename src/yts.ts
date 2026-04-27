export interface Movie {
    id: number;
    title: string;
    title_long: string;
    synopsis: string;
    summary: string;
    year: number;
    rating: number;
    runtime: number;
    genres: string[];
    medium_cover_image: string;
    large_cover_image: string;
    torrents: MovieTorrent[];
}

export interface MovieTorrent {
    hash: string;
    peers: number;
    quality: "720p" | "1080p" | "2160p";
    seeds: number;
    size: string;
    size_bytes: number;
    type: "bluray" | "web";
    url: string;
}

const ytsBaseUrl = "https://yts.bz";

export async function searchMovies(searchTerm: string) {
    const params = new URLSearchParams();
    params.set("quality", "1080p");
    params.set("sort_by", "year");
    if (searchTerm) {
        params.set("query_term", searchTerm);
    }

    const response = await fetch(`${ytsBaseUrl}/api/v2/list_movies.json?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`YTS returned HTTP ${response.status}`);
    }

    const responseBody = (await response.json()) as { data?: { movies?: Movie[] } };
    return dedupeMovies(responseBody.data?.movies ?? []);
}

export async function getTorrent(infoHash: string): Promise<string | Uint8Array> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20_000);

    try {
        const torrentResponse = await fetch(`${ytsBaseUrl}/torrent/download/${infoHash}`, {
            signal: controller.signal,
        });
        if (!torrentResponse.ok) {
            throw new Error(`Torrent download returned HTTP ${torrentResponse.status}`);
        }
        return new Uint8Array(await torrentResponse.arrayBuffer());
    } catch {
        return `magnet:?xt=urn:btih:${infoHash}`;
    } finally {
        clearTimeout(timeoutId);
    }
}

function dedupeMovies(searchResults: Movie[]) {
    const seen = new Set<number>();
    const deduped: Movie[] = [];

    for (const movie of searchResults) {
        if (seen.has(movie.id)) {
            continue;
        }

        const torrents = movie.torrents
            .filter((torrent) => torrent.quality === "1080p")
            .sort((a, b) => (a.type === b.type ? 0 : a.type === "bluray" ? -1 : 1));

        if (torrents.length === 0) {
            continue;
        }

        deduped.push({ ...movie, torrents });
        seen.add(movie.id);
    }

    return deduped;
}
