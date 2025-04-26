export interface Track {
    position: string;
    title: string;
    artists: string[];
    duration: string;
    extraartists?: string[];
}

export interface VinylInformation {
    title: string;
    artists: string[];
    label: string;
    year: number;
    tracklist: Track[];
    genre?: string[];
    style?: string[];
    discogsMasterUrl?: string;
    discogsUri?: string;
    owner?: string;
}
