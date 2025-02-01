
export async function  wait(ms){
    await new Promise(resolve=>{setTimeout(resolve,ms)})
}

export async function retryWithDelay(handler,delayList){
    if (delayList.length == 0){
        return false
    }
    await wait(delayList[0])
    delayList.shift()
    const isComplete  = await handler()
    if (isComplete) return true
    return await retryWithDelay(handler,delayList)
}

export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}
// export function eraseAllCookie() {
//     let cookies = document.cookie.split("; ");
//     for (let c = 0; c < cookies.length; c++) {
//         let d = window.location.hostname.split(".");
//         while (d.length > 0) {
//             let cookieBase = encodeURIComponent(cookies[c].split(";")[0].split("=")[0]) + '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; domain=' + d.join('.') + ' ;path=';
//             let p = location.pathname.split('/');
         
//             document.cookie = cookieBase + '/';
           
//             while (p.length > 0) {
//                 document.cookie = cookieBase + p.join('/');
//                 p.pop();
//             };
//             d.shift();
//         }
//     }
// }

export async function bufferToBase64(buffer) {
    // use a FileReader to generate a base64 data URI:
    const base64url = await new Promise(r => {
      const reader = new FileReader()
      reader.onload = () => r(reader.result)
      reader.readAsDataURL(new Blob([buffer]))
    });
    // remove the `data:...;base64,` part from the start
    return base64url;
}

export async function base64ToUint8Array(base64) {
    const response = await fetch(base64);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
}
const cacheName = "ftarcache";
export async function storeInCache( url, responseData) {
    const cache = await caches.open(cacheName); // Open or create a named cache
    const response = new Response(responseData, {
      headers: { 'Content-Type': 'application/octet-stream' }
    });
    await cache.put(url, response); // Store the data in the cache
    // console.log(`Data cached for ${url}`);
}

export async function getUint8ArrayFromCache(key) {
    const cache = await caches.open(cacheName);
    const response = await cache.match(key);
    
    if (!response) {
    //   console.log(`No data found for key: ${key}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer(); // Read as ArrayBuffer
    const uint8Array = new Uint8Array(arrayBuffer); // Convert to Uint8Array
    // console.log(`Retrieved Uint8Array from key: ${key}`);
    return uint8Array;
  }


  async function fetchBlobFromObjectURL(objectURL) {
    const response = await fetch(objectURL); // Fetch the Blob data behind the ObjectURL
    const blob = await response.blob(); // Get the Blob
    return blob;
  }

  export async function cacheObjectURL( key, objectURL) {
    const blob = await fetchBlobFromObjectURL(objectURL); // Get the Blob from the ObjectURL
    const cache = await caches.open(cacheName); // Open the cache
    const response = new Response(blob, { 
      headers: { 'Content-Type': blob.type || 'application/octet-stream' } 
    });
    await cache.put(key, response); // Cache the Blob
    // console.log(`Cached ObjectURL under key: ${key}`);
  }


  export async function retrieveObjectURLFromCache( key) {
    const cache = await caches.open(cacheName);
    const response = await cache.match(key); // Retrieve the cached Response
  
    if (!response) {
    //   console.log(`No data found for key: ${key}`);
      return null;
    }
  
    const blob = await response.blob(); // Convert the Response to a Blob
    const objectURL = URL.createObjectURL(blob); // Recreate the ObjectURL
    // console.log(`Recreated ObjectURL from cache for key: ${key}`);
    return objectURL;
  }

  export async function listCacheKeys() {
    const cache = await caches.open(cacheName); // Open the specific cache
    const keys = await cache.keys(); // Get all keys (URLs) in the cache
    // console.log(`Cache keys in ${cacheName}:`, keys);
    return [keys,cache];
  }

export async function fetchArrayBuffer(url){
  const response = await fetch(url)
  if (!response.ok){
    console.error(`can't load from ${url}`)
    return
  }
  let arrayBuffer;
  try {
    arrayBuffer = await response.arrayBuffer();
  } catch (error) {
    console.error(`Error while reading arrayBuffer: ${error.message}`);
    return;
  }
  return arrayBuffer
}
export async function mediaStreamFromArrayBufer(arrayBuffer,audioContext,callback){


  let audioBuffer;
  try {
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (error) {
    console.error(`Error while decoding audio data: ${error.message}`);
    return;
  }
  const bufferSource = audioContext.createBufferSource();
  bufferSource.buffer = audioBuffer;

  const destination = audioContext.createMediaStreamDestination();
  let isStoped = false

  bufferSource.connect(destination);
  const mediaStream = destination.stream;
  bufferSource.onended = () => {
      // console.log('Playback has finished.');
      if (!isStoped){
        const track = mediaStream.getAudioTracks()[0]
        if (track){
          track.stop()
          track.dispatchEvent(new Event("ended"));
        }
        // callback()
      }
  };

 

  bufferSource.start();

  mediaStream.stopBufferSource = ()=>{
      isStoped = true
      bufferSource.stop()
  }
  return mediaStream;
}

export async function mediaStreamFromUrl(url,audioContext,callback){

    const arrayBuffer = await fetchArrayBuffer(url)
    if (!arrayBuffer) return 
    return mediaStreamFromArrayBufer(arrayBuffer,audioContext,callback)
}

export const imageMimeTypes = [
  "image/jpeg","image/png","image/bmp","image/webp","image/avif","image/x-portable-bitmap",
  "image/x-portable-anymap","image/x-portable-pixmap","image/tiff"
]

export function checkFileType(fileType, typelist){
  for (const mimeType of typelist){
      
      if (fileType == mimeType) {
          return true
      }
  }
  return false
}