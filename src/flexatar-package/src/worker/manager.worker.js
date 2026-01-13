import { Manager } from "../ftar-manager/ftar-connection.js"




const originalFetch = self.fetch;

self.fetch1 = async function (input, init) {
    console.log("fetch override")
  // Create a unique ID for this request
  const id = Math.random().toString(36).slice(2);

  // Send the request details to the client (the main page)
  const clientsList = await self.clients.matchAll();
  if (clientsList.length === 0) {
    // No client available — fallback
    return originalFetch(input, init);
  }
  const client = clientsList[0];

  client.postMessage({
    type: 'fetch-proxy-request',
    id,
    input,
    init
  });

  // Wait for response message
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const data = event.data;
      if (data && data.type === 'fetch-proxy-response' && data.id === id) {
        self.removeEventListener('message', onMessage);
        if (data.error) reject(data.error);
        else resolve(new Response(data.body, data.options));
      }
    };
    self.addEventListener('message', onMessage);
  });
};


let managerPromiseResolve
let managerPromise = new Promise(resolve => {
    managerPromiseResolve = resolve
})

onmessage = async (event) => {
    const msg = event.data
    if (!msg) return
    let manager
    if (!msg.initManager) {
        manager = await managerPromise
    }
    if (msg.initManager) {



        const manager = new Manager(() => {
            return new Promise(resolve => {
                function handler(e) {
                    if (e.data && e.data.token) {
                        resolve(e.data.token)
                        self.removeEventListener("message", handler)
                    }
                }
                self.addEventListener("message", handler)
                postMessage({ tokenRequest: true })
            })



        },"defaultManager",()=>{
            return new Promise(resolve => {
                function handler(e) {
                    if (e.data && e.data.defaultBackgrounds) {
                        resolve(e.data.defaultBackgrounds)
                        self.removeEventListener("message", handler)
                    }
                }
                self.addEventListener("message", handler)
                postMessage({ defaultBackgroundsRequest: true })
            })

        }, false,false,msg.needGallery)
        manager.onMediaPort = port => {
            postMessage({ onMediaPort: port }, [port])
        }
        managerPromiseResolve(manager)

    } else if (msg.managerName) {
        manager.managerName = msg.managerName
    } else if (msg.tokenRequestArguments) {

    } else if (msg.ftarUIPort) {
        console.log("msg.ftarUIPort", msg.ftarUIPort)
        manager.addPort(msg.ftarUIPort)
    } else if (msg.ftarLensPort) {
        console.log("msg.ftarLensPort", msg.ftarLensPort)
        manager.addFtarLens(msg.ftarLensPort)
    }
    else if (msg.showProgress) {
        manager.showProgress()
    } else if (msg.ftarProgressPort) {
        console.log("msg.ftarProgressPort", msg.ftarProgressPort)
        manager.addProgressPort(msg.ftarProgressPort)
    }
    else if (msg.ftarEffectsPort) {
        console.log("msg.ftarEffectsPort", msg.ftarEffectsPort)
        manager.addEffectPort(msg.ftarEffectsPort)
    }
    else if (msg.ftarRetargPort) {
        console.log("msg.ftarRetargPort", msg.ftarRetargPort)
        manager.addRetargPort(msg.ftarRetargPort)
    }
}

