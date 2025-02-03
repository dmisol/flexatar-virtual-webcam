# Flexatar V-Gen

[v-cam iframe source](../v-gen-iframe)

## Quick start 


 ```js
    const iframeUrl = "https://dev.flexatar-sdk.com/v-cam/index.html"
    // Run v-gen iframe on localhost
    // cd ../v-gen
    // npm install
    // npm run build
    // npm run start
    // const iframeUrl = "http://localhost:8082"

    const vGen = VGEN.getVGenElement(iframeUrl,{token:"hardcoded token to test"})
    
   

    const url = "url of your backends endpoint to obtain user token"
    const opts = {"the same as fetch opts"}
    // vGen will make fetch with provided arguments fetch(url,opts) in case 
    // it has no token or token is expired.
    // The response must be json {"token":"user token obtained with FLEXATAR_API_SECRET"}
    
    vGen.setupTokenFetch(
        url,
        opts
    )
    // if fetch token fails handle error here
    vGen.ontokenerror = (error)=>{
        console.log(error)
    }

    // makes appendCild to provided container
    // alternatively: holder.appendChild(vGen.element)
    vGen.mount(holder)

    // remove iframe from document
    vGen.unmount()

 ```

 > **Note:** If you will use restricted user tokens, creation and deletion of flexatars will be unavailable. 



