import RenderWorker from "./render.worker.js"
function log(){
    console.log("[RENDER_WORKER_WARPER]",...arguments)
}

export class RenderWorkerWarper {
    constructor(url,size={width:640,height:480}){
        const worker = new RenderWorker({ type: "module" });
        const self = this
        worker.onmessage = e =>{
            const msg = e.data
            if (!msg)return

            if (msg.renderToManagerPort){

                self.onManagerPort(msg.renderToManagerPort)

        
            }else if (msg.isContextLost){
                self.onContextLost(msg.isContextLost.value)

                console.log("isContextLost sandbox:",msg.isContextLost)
            }else if (msg.isInUse){
                self.onIsInUse(msg)

    
            }else if (msg.initComplete){
                if (this.onReady) this.onReady()
            }
        }
        
        this.worker = worker
        console.log("stadrting worker at url",url)
        Promise.all([
            fetch(url+"/flx_gl_static.p").then(response=>response.arrayBuffer()),
            fetch(url+"/animation.bin").then(response=>response.arrayBuffer()),
            fetch(url+"/speachnn/wav2mel/model.json").then(response=>response.arrayBuffer()),
            fetch(url+"/speachnn/wav2mel/group1-shard1of3.bin").then(response=>response.arrayBuffer()),
            fetch(url+"/speachnn/wav2mel/group1-shard2of3.bin").then(response=>response.arrayBuffer()),
            fetch(url+"/speachnn/wav2mel/group1-shard3of3.bin").then(response=>response.arrayBuffer()),
            fetch(url+"/speachnn/mel2phon/model.json").then(response=>response.arrayBuffer()),
            fetch(url+"/speachnn/mel2phon/group1-shard1of1.bin").then(response=>response.arrayBuffer()),
            fetch(url+"/speachnn/phon2avec/model.json").then(response=>response.arrayBuffer()),
            fetch(url+"/speachnn/phon2avec/group1-shard1of1.bin").then(response=>response.arrayBuffer()),
            // fetch("/speachnn/mel2phon/model.json").then(response=>response.arrayBuffer()),
            // fetch("/speachnn/phon2avec/model.json").then(response=>response.arrayBuffer()),
        ]).then(

            buffers=>{
                console.log("worker buffers ready",buffers)

                worker.postMessage({
                    initBuffers:[buffers[0],buffers[1]],
                    nnBuffers:{
                        wav2mel:{
                            model:buffers[2],
                            shards:[buffers[3],buffers[4],buffers[5]]
                        },
                        mel2phon:{
                            model:buffers[6],
                            shards:[buffers[7]]
                            // url:buffers[3]
                        },
                        phon2avec:{
                            model:buffers[8],
                            shards:[buffers[9]]
                        },
                    },
                    size
                },buffers)
            }
        ).catch((e)=>{
            console.error("Error load worker resource",e)
        })
        

    }
    // start(){
    //     const worker = this.worker
    set size(val){
        this.worker.postMessage({changeSize:val})
    }  
        
    // }
    destroy(){
        this.worker.terminate()
        this.worker = undefined
    }
    getControllerPort(){
        const self = this
        return new Promise(resolve=>{
            const msgId = crypto.randomUUID()
            function handler(e){
                if (e.data && e.data.msgID){
                    if (e.data.msgID){
                        self.worker.removeEventListener("message",handler)
                        resolve(e.data.controllerPort)
                    }
                }
    
            }
            self.worker.addEventListener("message",handler)
            self.worker.postMessage({controllerPort:true,msgID:msgId})
        })
        
    }
    checkGlContext(){
        this.worker.postMessage({checkGlContext:true})
    }
    // onControllerPort = ()=>{}
    onManagerPort = ()=>{}
    onContextLost = ()=>{}
    onIsInUse = ()=>{}
    addMediaPort(port){
        this.worker.postMessage({mediaPort:port},[port])
    }
    checkInUse(){
        this.worker.postMessage({checkInUse:true})
    }
}