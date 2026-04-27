import WebTorrent from "webtorrent/dist/webtorrent.min.js";

export interface TorrentInfo {
    numPeers: number;
    progress: number;
    downloadSpeed: number;
    uploadSpeed: number;
    downloaded: number;
    length: number;
}

export interface WebTorrentFile {
    name: string;
    length: number;
    streamTo: (element: HTMLVideoElement) => void;
}

export interface WebTorrentTorrent {
    files: WebTorrentFile[];
    numPeers: number;
    progress: number;
    downloadSpeed: number;
    uploadSpeed: number;
    downloaded: number;
    length: number;
    on: (event: "error", listener: (error: Error) => void) => void;
}

export interface WebTorrentClient {
    add: (
        torrentId: string | Uint8Array,
        options: { announce: string[] },
        onTorrent: (torrent: WebTorrentTorrent) => void,
    ) => void;
    createServer: (options: { controller: ServiceWorkerRegistration }) => unknown;
    destroy: () => void;
    on: (event: "error", listener: (error: Error) => void) => void;
}

const WebTorrentBrowser = WebTorrent as new () => WebTorrentClient;

export function createWebTorrentClient() {
    return new WebTorrentBrowser();
}

export function getTorrentInfo(torrent: WebTorrentTorrent): TorrentInfo {
    return {
        downloadSpeed: torrent.downloadSpeed,
        uploadSpeed: torrent.uploadSpeed,
        progress: torrent.progress,
        numPeers: torrent.numPeers,
        downloaded: torrent.downloaded,
        length: torrent.length,
    };
}
