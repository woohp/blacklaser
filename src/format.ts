export function humanFileSize(size: number): string {
    if (size < 1_000) {
        return `${size.toFixed(2)} B`;
    }
    if (size < 1_000_000) {
        return `${(size / 1_000).toFixed(2)} KB`;
    }
    if (size < 1_000_000_000) {
        return `${(size / 1_000_000).toFixed(2)} MB`;
    }
    return `${(size / 1_000_000_000).toFixed(2)} GB`;
}

export function humanElapsed(seconds: number): string | null {
    if (!Number.isFinite(seconds)) {
        return null;
    }

    let minutes = Math.floor(seconds / 60);
    const roundedSeconds = Math.round(seconds % 60);
    const hours = Math.floor(minutes / 60);
    minutes %= 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${roundedSeconds
        .toString()
        .padStart(2, "0")}`;
}
