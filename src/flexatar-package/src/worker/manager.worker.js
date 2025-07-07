import { Manager } from "../ftar-manager/ftar-connection.js"

let manager

    manager = new Manager(()=>{
        return new Promise (resolve=>{
            function handler(e){
                if (e.data && e.data.token){
                    resolve(e.data.token)
                    self.removeEventListener("message",handler)
                }
            }
            self.addEventListener("message",handler)
            postMessage({tokenRequest:true})
        })
        

        // const response = await fetch(msg.tokenRequestArguments.url,msg.tokenRequestArguments.opts)
        // if (!response.ok){
        //     postMessage({error:{status:response.status,message:await response.text()}})
        //     return 
        // }
        // const tokenJson = await response.json()
        // console.log("tokenJson",tokenJson)
        // if (!tokenJson.token){
        //     postMessage({error:{status:403,message:"token_expired"}})
        // }
        // return tokenJson.token

    })
    manager.onMediaPort = port =>{
        postMessage({onMediaPort:port},[port])
    }

onmessage = (event) => {
    const msg = event.data
    if (!msg) return
    if (msg.tokenRequestArguments){
       
    } else if (msg.ftarUIPort){
        console.log("msg.ftarUIPort",msg.ftarUIPort)
        manager.addPort(msg.ftarUIPort)
    } else if (msg.ftarLensPort){
        console.log("msg.ftarLensPort",msg.ftarLensPort)
        manager.addFtarLens(msg.ftarLensPort)
    }
    else if (msg.showProgress){
        manager.showProgress()
    }else if (msg.ftarProgressPort){
        console.log("msg.ftarProgressPort",msg.ftarProgressPort)
        manager.addProgressPort(msg.ftarProgressPort)
    }
    else if (msg.ftarEffectsPort){
        console.log("msg.ftarEffectsPort",msg.ftarEffectsPort)
        manager.addEffectPort(msg.ftarEffectsPort)
    }
}