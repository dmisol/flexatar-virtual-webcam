
export async function patchChromeStorage(){
  function isRunningInChromeExtension() {
    return typeof chrome !== "undefined" &&
           typeof chrome.runtime !== "undefined" &&
           typeof chrome.runtime.id !== "undefined";
  }
  if (!isRunningInChromeExtension()){
    if (typeof window === 'undefined') {
        var window = self; // Alias self to window
    }
  
    if (typeof chrome === 'undefined') {
      
        window.chrome = {};
    }
  
      if (!chrome.storage) {
        chrome.storage = {};
      }
  
      if (!chrome.storage.local) {
        chrome.storage.local = {};
      }
  
      const CACHE_NAME = 'flexatar-storage-cache';
  
      const encodeKey = (key) => new Request(`https://flexatar-mock-storage/${key}`);
      const decodeKey = (url) => new URL(url).pathname.slice(1); 
      // (async ()=>{
        const cache = await caches.open(CACHE_NAME);
  
        chrome.storage.local.set = async (items) => {
          const promises = Object.entries(items).map(async ([key, value]) => {
            const body = JSON.stringify({ value });
            const response = new Response(body, { headers: { 'Content-Type': 'application/json' } });
            await cache.put(encodeKey(key), response);
          });
          await Promise.all(promises);
        };
      
        chrome.storage.local.get = async (keys,callback) => {
          const result = {};
      
          if (keys === null || keys === undefined) {
            const requests = await cache.keys();
            const allKeys = requests.map(request => decodeKey(request.url));
            if (callback) callback(allKeys);
            return allKeys;
          }
  
          const keyArray = Array.isArray(keys)
            ? keys
            : typeof keys === 'object' && keys !== null
              ? Object.keys(keys)
              : typeof keys === 'string'
                ? [keys]
                : [];
      
          const promises = keyArray.map(async (key) => {
            const response = await cache.match(encodeKey(key));
            if (response) {
              const data = await response.json();
              result[key] = data.value;
            } else {
              if (typeof keys === 'object' && keys !== null){
                result[key] = keys[key];
              }else{
                result[key] = undefined;
  
              }
            }
          });
      
          await Promise.all(promises);
          if (callback)callback(result)
          return result;
        };
      
        chrome.storage.local.remove = async (keys) => {
          const keyArray = Array.isArray(keys) ? keys : [keys];
          const promises = keyArray.map((key) => cache.delete(encodeKey(key)));
          console.log("start del keys")
          await Promise.all(promises);
          console.log("end del keys")
        };
  
      // })()
    
  }
}
