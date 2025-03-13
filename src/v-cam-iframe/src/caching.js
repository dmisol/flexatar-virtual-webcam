import { getUint8ArrayFromCache,storeInCache,cacheObjectURL,retrieveObjectURLFromCache,listCacheKeys } from "../../util/util.js"

import * as FtarView from "./ftar_view3_mod.js"

// localStorage.clear();

export async function getFlexatarWraped(ftarLink,token){
  
    const savedFtar = await getUint8ArrayFromCache("/ftar/"+ftarLink.id)
      if (savedFtar){

        // console.log("fetch saved ftar",savedFtar)
        return {data: savedFtar,ready:Promise.resolve(true),id:ftarLink.id,name:ftarLink.meta?.name}
    }
    if (!ftarLink.ftar)
        ftarLink = await FtarView.flexatarEntry(token,ftarLink.id,{ftar:true})
    const result = await FtarView.getFlexatar(ftarLink);
    await storeInCache("/ftar/"+ftarLink.id,result.data)

    return result
}

export async function getPreviewWraped(ftarLink){
  
    const savedPreview = await retrieveObjectURLFromCache("/ftarpreview/"+ftarLink.id)
      if (savedPreview){

        // console.log("fetch saved ftar",savedFtar)
        return savedPreview
    }
    const result = await FtarView.getPreview(ftarLink);
    await cacheObjectURL("/ftarpreview/"+ftarLink.id,result)

    return result
}

export async function updateCahceByList(ftarList){
    // console.log(ftarList)
    const [keys,cache] = await listCacheKeys();
    
    for (const cahceKey of keys){
        const parts = cahceKey.url.split("/")
        const id = parts[parts.length-1]
        let notFound = true
        for (const ftarLink of ftarList){
            if (ftarLink.id == id){
                notFound = false
                break
            }
        }
        // console.log(parts)
        if (notFound){
            cache.delete(cahceKey)
            // console.log ("del cahce key",id)
        }

    }

}
