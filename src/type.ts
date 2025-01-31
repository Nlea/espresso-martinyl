export interface VinylInformation {
    title: string;
    artists: string[];
    label: string;
    year: number;
    tracklist: { title: string; duration: string }[];
    genre?: string[];
    style?: string[];
  }


  export interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
  }