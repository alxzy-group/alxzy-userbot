import axios from "axios";
import { 
  toAudio,
  toPTT,
  toVideo,
  toSpeakerMP3,
  ffmpeg } from "./converter.js";
const regex = {
  tiktok: /(?:https?:\/\/)?(?:www\.)?(?:vm\.|vt\.)?tiktok\.com\/[^\s]+/i,
  instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:reel|p|tv)\/[^\s]+/i,
  facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[^\s]+/i,
  youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s]+/i,
  pinterest: /(?:https?:\/\/)?(?:www\.)?pinterest\.com\/pin\/[^\s]+/i,
};

async function tiktok(url) {
  if (!regex.tiktok.test(url)) return "harap masukan link tiktok yang benar";
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
    'Referer': 'https://ssstik.io/id',
    'Origin': 'https://ssstik.io'
  };

  try {  
    const postData = new URLSearchParams();
    postData.append('id', url);
    postData.append('locale', 'id');
    postData.append('tt', '');
    postData.append('debug', 'ab=0&loc=ID&ip=114.5.242.66');

    const { data } = await axios.post(
      "https://ssstik.io/abc?url=dl",
      postData,
      {
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          'HX-Request': 'true',
          'HX-Trigger': '_gcaptcha_pt',
          'HX-Target': 'target',
          'HX-Current-URL': 'https://ssstik.io/id'
        }
      }
    );

    const regex_nowm = /<a[^>]*?href="([^"]+)"[^>]*?class="[^"]*\bwithout_watermark\b[^"]*"/;
    const regex_audio = /<a[^>]*?href="([^"]+)"[^>]*?class="[^"]*\bmusic\b[^"]*"/;
    const regex_title = /<p class="maintext">([\s\S]*?)<\/p>/;
    const regex_cover = /background-image: url\(([^)]+)\);/;

    const match_nowm = data.match(regex_nowm);
    const match_audio = data.match(regex_audio);
    const match_title = data.match(regex_title);
    const match_cover = data.match(regex_cover);

    const result = {
      title: match_title ? match_title[1].trim() : "Gagal parse judul",
      cover: match_cover ? match_cover[1] : "Gagal parse link foto",
      no_watermark: match_nowm ? match_nowm[1] : "Gagal parse link video",
      audio: match_audio ? match_audio[1] : "Gagal parse link audio"
    };

    return result;

  } catch (e) {
    console.error(e);
    return e.message;
  }
}
const scraper = {
tiktok: tiktok,
toAudio: toAudio,
toPTT: toPTT,
toVideo: toVideo,
toSpeakerMP3: toSpeakerMP3,
ffmpeg: ffmpeg
}
export default scraper