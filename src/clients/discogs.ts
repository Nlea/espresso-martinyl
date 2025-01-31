import type { VinylInformation } from "../type";

export async function getDiscogsInformation(barcode: string, artist: string, release_title: string, discogs_key: string, discogs_secret: string ) {

  const myHeaders = new Headers();
    myHeaders.append("User-Agent", "PostmanRuntime/7.37.3");
    myHeaders.append("Cookie", "__cf_bm=GQu1uy.oOhPqp3yX7ZTMsxbAls9Ud07RjOu4zR95U_o-1736521883-1.0.1.1-NYdMJpGoh1KUy8AC8Qu5icIQFD0nhyltYCnK2SOdH51Vjspuf7WbVel1sPY1RZCDIBpoPzVZTfVqJrFFq57RPA");

  const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

  const barcode_hyphens = barcode?.replace(/ /g, '-') || '';
  const artist_hyphens = artist?.replace(/ /g, '-') || '';
  const release_title_hyphens = release_title?.replace(/ /g, '-') || '';

  let url = 'https://api.discogs.com/database/search?';
  const params = new URLSearchParams();

    if (barcode_hyphens) {
      params.append('barcode', barcode);
    }
    if (release_title_hyphens) {
      params.append('release_title', release_title);
    }
    if (artist_hyphens) {
      params.append('artist', artist);
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
      const firstEntryMasterURL = parsedResult.results[0].master_url;
      const vinylInformationRequest = await fetch(firstEntryMasterURL, requestOptions);
      console.log(`Status Code: ${vinylInformationRequest.status}`);
      const vinylInformationResult = await vinylInformationRequest.text();
      const vinylInformationJson = JSON.parse(vinylInformationResult);
      console.log(vinylInformationJson);
      const {title, artists, label, year, tracklist, genres, styles} = vinylInformationJson;

      const artistNames = artists.map((artist: { name: string }) => artist.name);

      const vinylInformation: VinylInformation = {
        title: title,
        artists: artistNames,
        label: label,
        year: year,
        tracklist: tracklist,
        genre: genres,
        style: styles
      };

      return vinylInformation;

    } catch (error) {
      console.error('Fetch error:', error);
      //return { error: error.message } as unknown as VinylInformation;
    }
  }
