import type { SpotifyTokenResponse } from "../type";
import 'dotenv/config';

// export async function getSpotifyToken(spotify_client_id: string, spotify_client_secret: string ): Promise<SpotifyTokenResponse> {
//     const spotifyClientId = spotify_client_id;
//     const spotifyClientSecret = spotify_client_secret;
//     console.log(`HERE: ${spotifyClientId}`);
//     console.log(`HERE: ${spotifyClientSecret}`);

  export async function getSpotifyToken(): Promise<SpotifyTokenResponse> {
      const spotifyClientId = "dcb6ac0189ef493494332ddd63689e7d"
      const spotifyClientSecret = "9fd66f2f88744f3a8161c1642d2e2bb8"
     ;
  
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append(
      "Cookie",
      "__Host-device_id=AQD9MWB1c52rUgF_hNGEY22d_GrsjQtbr-3NN5qSEdhqF_5E7mR0UlmaZurstC-UzqagWiqZCfoW7hZysfglMJljnTM0iqBxs-Y; sp_tr=false"
    );
  
    const urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");
    urlencoded.append("client_id", spotifyClientId);
    urlencoded.append("client_secret", spotifyClientSecret);
    
  
    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: urlencoded.toString(),
      redirect: "follow",
    };
  
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", requestOptions);
  
      // Store the response object
      const result: SpotifyTokenResponse = await response.json(); // Parse JSON
      //console.log(result);
      return result; // Return the response data as JSON
  
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error; // Throw the error to be handled by the caller
    }
  }
  
 export async function getSpotifySongInformation(token: string, song: string, artist: string[]) {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Cookie", "__Host-device_id=AQD9MWB1c52rUgF_hNGEY22d_GrsjQtbr-3NN5qSEdhqF_5E7mR0UlmaZurstC-UzqagWiqZCfoW7hZysfglMJljnTM0iqBxs-Y; sp_tr=false");
  
    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
  
    const artistQuery = encodeURIComponent(artist.join(' '));
    const songQuery = encodeURIComponent(song);
    //const url = `https://api.spotify.com/v1/search?q=${songQuery}&type=track&limit=20`;
    const url = `https://api.spotify.com/v1/search?q=track:${songQuery}%20artist:${artistQuery}&type=track`
    console.log(url);
  
    try {
      const response = await fetch(url, requestOptions);
      const result = await response.text();
      const resultJson = JSON.parse(result);
      console.log(resultJson);   
      return resultJson;
  
   
  
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  
  }

  export async function getSpotifySongAudioFeatures(token: string, songId: string) {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);
    myHeaders.append("Cookie", "__Host-device_id=AQD9MWB1c52rUgF_hNGEY22d_GrsjQtbr-3NN5qSEdhqF_5E7mR0UlmaZurstC-UzqagWiqZCfoW7hZysfglMJljnTM0iqBxs-Y; sp_tr=false");
  
    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow",
    };
  
    const url = `https://api.spotify.com/v1/audio-features/${songId}`
   // console.log(url);

  
    try {
      const response = await fetch(url, requestOptions);
      const result = await response.text();
      const resultJson = JSON.parse(result);
      //console.log(resultJson);   
      return resultJson;
  
   
  
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  
    

  }