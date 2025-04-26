import type { VinylInformation, Track } from "../type";

export async function getDiscogsInformation(barcode: string, artist: string, release_title: string, discogs_key: string, discogs_secret: string ) {

  const myHeaders = new Headers();
    myHeaders.append("User-Agent", "PostmanRuntime/7.37.3");
    myHeaders.append("Cookie", "__cf_bm=GQu1uy.oOhPqp3yX7ZTMsxbAls9Ud07RjOu4zR95U_o-1736521883-1.0.1.1-NYdMJpGoh1KUy8AC8Qu5icIQFD0nhyltYCnK2SOdH51Vjspuf7WbVel1sPY1RZCDIBpoPzVZTfVqJrFFq57RPA");

  const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

  let url = 'https://api.discogs.com/database/search?';
  const params = new URLSearchParams();

  // Only add parameters if they are non-empty strings
  if (barcode) {
    params.append('barcode', barcode);
  } else if (artist && release_title) {
    params.append('artist', artist);
    params.append('release_title', release_title);
  }

  params.append('format', 'vinyl');
  params.append('per_page', '5');
  params.append('page', '1');
  params.append('key', discogs_key);
  params.append('secret', discogs_secret);

    url += params.toString();
    console.log('URL:', url);

    try {
      const response = await fetch(url, requestOptions);
      console.log(`Status Code: ${response.status}`);
      const result = await response.text();
      if (!result) {
        return { error: "Empty response" };
      }

      const parsedResult = JSON.parse(result);
      
      // Check if we have results
      if (!parsedResult.results || parsedResult.results.length === 0) {
        return { error: "No results found in Discogs" };
      }

      // Check if we have a master_url
      const firstEntry = parsedResult.results[0];
      const label = Array.isArray(firstEntry.label) ? firstEntry.label[0] || '' : '';

      if (!firstEntry.master_url) {
        return { error: "No master URL found for this release" };
      }

      const firstEntryMasterURL = firstEntry.master_url;
      const vinylInformationRequest = await fetch(firstEntryMasterURL, requestOptions);
      const vinylInformationResult = await vinylInformationRequest.text();
      const vinylInformationJson = JSON.parse(vinylInformationResult);
      const {title, artists, year, tracklist, genres, styles} = vinylInformationJson;

      // Format the tracklist to include artist names as text
      const formattedTracklist = tracklist.map((track: any) => ({
        ...track,
        artists: track.artists ? track.artists.map((artist: { name: string }) => artist.name).join(', ') : '',
        extraartists: track.extraartists ? track.extraartists.map((artist: { name: string }) => artist.name).join(', ') : ''
      }));

      console.log('Formatted tracklist:', formattedTracklist);

      const artistNames = artists.map((artist: { name: string }) => artist.name);

      const vinylInformation: VinylInformation = {
        title,
        artists: artistNames,
        label,
        year,
        genre: genres,
        tracklist: formattedTracklist,
        style: styles,
        discogsMasterUrl: firstEntry.master_url,
        discogsUri: firstEntry.uri
      };

      return vinylInformation;

    } catch (error) {
      console.error('Fetch error:', error);
      //return { error: error.message } as unknown as VinylInformation;
    }
  }
