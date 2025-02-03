import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

const ffmpeg = new FFmpeg();
let ffmpegLoadPromies
const load = async () => {
    // console.log("Start load ffmpeg")
    const baseURL = '.'
   
    ffmpeg.on('log', ({ message }) => {
        // messageRef.current.innerHTML = message;
        
        // console.log(message);
    });
    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    ffmpegLoadPromies =  ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/static/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/static/ffmpeg-core.wasm`, 'application/wasm'),
    });
    // console.log("ffmpeg ready")

}
function checkCodecs(){
    const options = [
        { mimeType: 'video/mp4;codecs=avc1' }, // MP4 with H.264
        { mimeType: 'video/mp4'}, // MP4 with default coded
        { mimeType: 'video/webm;codecs=h264' }, // WebM with H.264
        { mimeType: 'video/webm;codecs=vp8' },  // WebM with VP8
        { mimeType: 'video/webm' },             // WebM with default codec
        { mimeType: 'video/x-matroska;codecs=avc1' }, // MKV with H.264 (if supported)
        { mimeType: 'video/ogg' },              // Ogg as a fallback
      ];
    
      for (const option of options) {
        if (MediaRecorder.isTypeSupported(option.mimeType)) {
          return option.mimeType; // Return the first supported type
        }
      }
}
const codec = checkCodecs()
if (!codec.startsWith("video/mp4"))
    load()

export default async function convert(file,prompt) {
    if (!ffmpegLoadPromies) return
    if (prompt) {
        if (await prompt(codec.includes("h264"))){
            return
        }
    }
    await ffmpegLoadPromies
    const name = "input.webm"
    await ffmpeg.writeFile(name, await fetchFile(file));
    if (codec.includes("h264")){
        await ffmpeg.exec(['-i', name, "-codec", "copy", "-strict", "-2", 'output.mp4']);
    }else{
        await ffmpeg.exec(['-i', name, "-c:v","libx264", "-preset","ultrafast","-c:a","aac", 'output.mp4']);
    }
    const data = await ffmpeg.readFile('output.mp4');
    // console.log("transcoded",data)
    const blob = new Blob([data], { type: 'video/mp4' });

    // Generate a URL for the Blob
    const url = URL.createObjectURL(blob);
    return url
}
