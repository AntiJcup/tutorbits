export interface Part {
    index: number;
    etag: string;
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}