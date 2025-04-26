export interface Track {
    position: string;
    title: string;
    artists: string[];
    duration: string;
    extraartists?: string[];
}

export interface VinylIdentifier {
    discogsUri: string;
    owner: string;
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
    discogsUri: string; // Made required since it's part of the unique identifier
    owner: string; // Made required since it's part of the unique identifier
    uniqueId?: string; // Can be generated as `${discogsUri}-${owner}`
}
