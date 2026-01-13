// const FormData = require("form-data");
// const https = require('https');

export async function uploadImageForFtar(link,file){
    const form = new FormData();
    Object.entries(link.fields).forEach(([field, value]) => {
      form.append(field, value);
    });

    form.append("file", file);
    const response = await fetch(link.url, {
        method: "POST",
        // Set the FormData instance as the request body
        body: form,
    });
    if (!response.ok){
        console.error("send img failed")
        return false
    }
    console.log("ftar send img ok")
    return true
   

    // form.submit(link.url, (err, res) => {
    //     console.log(res)
    //     //handle the response
    //   })
    /*
    return new Promise((resolve,reject) =>{

   
        form.getLength((err, contentLength) => {
            if (err) {
                console.error('Error calculating Content-Length:', err);
                return;
            }
            console.log("contentLength",contentLength)
            // Prepare the request
            const requestOptions = {
                method: 'POST',
                hostname: new URL(link.url).hostname,
                path: new URL(link.url).pathname,
                headers: {
                    ...form.getHeaders(),
                    'Content-Length': contentLength,
                },
            };
        
            // Send the request
            const req = https.request(requestOptions, (res) => {
                console.log(`Status Code: ${res.statusCode}`);
                if (res.statusCode === 204) {
                    console.log('File uploaded successfully!');
                    resolve()
                } else {
                    reject()
                    console.log('File upload failed.');
                    res.on('data', (chunk) => {
                        console.log(chunk.toString());
                    });
                }
            });
        
            // Handle errors
            req.on('error', (err) => {
                console.error(`Error: ${err.message}`);
                reject()
            });
        
            // Pipe form data to the request
            form.pipe(req);
        });
    })
        */
}

// function decodeBase64UrlSafe(base64UrlSafe) {
//     // Replace URL-safe characters with standard Base64 characters
//     const base64 = base64UrlSafe
//         .replace(/-/g, '+')
//         .replace(/_/g, '/');

//     // Pad with "=" to make the length a multiple of 4
//     const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

//     // Decode the Base64 string
//     const decodedData = atob(paddedBase64);

//     return decodedData;
// }

export async function makeFtar(url,token, imgFile,flexatarName,opts,fetchWithToken,onFtarId){
    const response = await fetchWithToken(url, {
        method: 'POST',
        headers:{
            "Content-Type": "application/json",
            // "Authorization": "Bearer "+token
        },
        body: JSON.stringify({name:flexatarName})
    },token);
    if (!response.ok) {
        console.log("faild obtain make link",await response.json())
        // if (onFtarId) await onFtarId("error_id")
        return {error:{status:response.status}}
    }
    const r = await response.json();
    if (r.block){
        // if (onFtarId) await onFtarId("error_id")
        return {success:false,reason:r.block}
    }
    if (onFtarId) await onFtarId(r.id)

    const s3Link =r.link
    if (!await uploadImageForFtar(s3Link,imgFile)){
        // if (onFtarId) await onFtarId("error_id")
        return 
    }
    // r.poll = decodeBase64UrlSafe(r.poll)
    let counter = 0
    // const timings = [5000,15000]
    return await new Promise(resolve=>{

   
        const interval = setInterval(async ()=>{
            const response = await fetch(r.poll, {
                method: 'GET',
            
            });
            if (!response.ok){
                counter += 1
                if (counter>10){
                    clearInterval(interval)
                    resolve()
                }
                console.log("ftar not ready")
                return
            }
            const statusJson = await response.json();
            console.log("ftar ready",statusJson)
            clearInterval(interval)
           
            resolve(statusJson)
           
            
            
        },5000)
    })
}

export async function getFtarUploadLink(url,token, fetchWithToken,aiPrompt1){
   
    let body = aiPrompt1 ? JSON.stringify({aiPrompt:JSON.parse(JSON.parse(aiPrompt1))}) : undefined
    // console.log("[Make ftar] aiPrompt",aiPrompt1)
    // console.log("[Make ftar] obj",obj)
    // console.log("[Make ftar] body",body)
    // return {error:true}
    const response = await fetchWithToken(url, {
        method: 'POST',
        headers:{
            "Content-Type": "application/json",
            // "Authorization": "Bearer "+token
        },
        body
    },token);
    if (!response.ok) {
        console.log("faild obtain make link",await response.json())
        // if (onFtarId) await onFtarId("error_id")
        return {error:{type:"unknown",message:response.status}}
    }
    const r = await response.json();
    if (r.block){
        return {error:{type:"block",reason:r.block}}
    }
    return r
   

}


export async function pollFtar(url,token, fetchWithToken,ftarId){
    const response = await fetchWithToken(url, {
        method: 'POST',
        headers:{
            "Content-Type": "application/json",
            // "Authorization": "Bearer "+token
        },
        body:JSON.stringify({id:ftarId})
    },token);
    if (!response.ok) {
        if (response.status === 404){
            return {status:"in_progress"}
        }else{

            return {error:await response.text()}
        }

        
    }
    const r = await response.json();
    
    return r
   

}