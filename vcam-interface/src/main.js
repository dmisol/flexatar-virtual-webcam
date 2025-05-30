import './style.css'

import {makeWHIPServer} from "./v-cam-internal-interface.js"





function createFakeStream(){
    const canvas = document.createElement("canvas")
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'red';
    ctx.fillRect(50, 50, 100, 100); // Draw red square
    document.body.append(canvas)
    // Step 2: Capture MediaStream from canvas
    const stream = canvas.captureStream(30); // 30 FPS
    (async ()=>{
        function drawLoop() {
            ctx.fillStyle = "blue";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          
            ctx.fillStyle = "red";
            ctx.font = "30px sans-serif";
            ctx.fillText("Time: " + new Date().toLocaleTimeString(), 190, 260);
            
            ctx.fillStyle = "green";
            ctx.font = "bold 40px sans-serif ";
            ctx.f
            ctx.fillText("VIRTUAL CAMERA", 130, 200);
          
            requestAnimationFrame(drawLoop);
          }
          drawLoop();  
    })()
    
    return stream
}
const videoTracks = createFakeStream().getVideoTracks()
makeWHIPServer(audio =>{
  return videoTracks
})

