




export async function cropImage(imageBitmap, detection) {
    
    // new Promise(resolve=>{
        const { originX, originY, width, height } = detection.boundingBox;
        // const p0 = detection.keypoints[0]
        // const p1 = detection.keypoints[1]
        // const x = (p0.x+p1.x)/2
        // const y = (p0.y+p1.y)/2
        const {x,y} = detection.keypoints[2]
        const centerX = Math.round(x * (imageBitmap.naturalWidth || imageBitmap.width))
        const centerY = Math.round(y * (imageBitmap.naturalHeight || imageBitmap.height))
        const halfWidth = Math.round(width * 1.2)
        const halfHeight = Math.round(width * 1.4)
        const totalWidth = halfWidth * 2
        const totalHeight = halfHeight * 2
        const left = centerX - halfWidth
        const top = centerY - halfHeight

    
        // Create a canvas element
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
       
        
        // Set canvas size to match bounding box
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        
        // Draw the cropped portion of the image onto the canvas
        ctx.drawImage(
            imageBitmap,
            left, top, totalWidth, totalHeight, // Source rectangle
            0, 0, totalWidth, totalHeight // Destination rectangle
        );
        const bitmap = await createImageBitmap(canvas);
        bitmap.toObjectUrl = async ()=>{
            const offscreen = new OffscreenCanvas(bitmap.width, bitmap.height);
            const ctx = offscreen.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);
          
            return URL.createObjectURL(await offscreen.convertToBlob());
        }
        // Convert canvas to data URL and pass it to callback
        return bitmap
    // })
   
}

export async function maskUnwantedFaces(imageBitmap, boundingBoxes) {
    const { width, height } = imageBitmap;
  
    // Create an offscreen canvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
  
    // Draw the original image
    ctx.drawImage(imageBitmap, 0, 0);
  
    // Set the fill style to black
    ctx.fillStyle = 'black';
  
    // Draw each bounding box as a filled black rectangle
    boundingBoxes.forEach(({ originX, originY, width, height }) => {
      ctx.fillRect(originX, originY, width, height);
    });
  
    // Convert canvas back to an ImageBitmap and return
    return await createImageBitmap(canvas);
  }

  export async function bitmapFromArrayBuffer(arrayBuffer) {
    // Create a Blob from the ArrayBuffer, guessing the type
    const blob = new Blob([arrayBuffer]);
    
    // Create an ImageBitmap from the Blob
    const imageBitmap = await createImageBitmap(blob);
    
    return imageBitmap;
  }

  export async function rotateImageBitmap(imageBitmap, angleDegrees) {
    const angleRadians = angleDegrees * Math.PI / 180;
  
    const width = imageBitmap.width;
    const height = imageBitmap.height;
  
    // Create an OffscreenCanvas with the original image size
    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext('2d');
  
    // Move origin to the center of the canvas and rotate
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angleRadians);
    ctx.drawImage(imageBitmap, -width / 2, -height / 2);
  
    // Convert OffscreenCanvas to ImageBitmap
    const rotatedBitmap = await createImageBitmap(offscreen);
    rotatedBitmap.toObjectUrl = async ()=>{
        const offscreen = new OffscreenCanvas(rotatedBitmap.width, rotatedBitmap.height);
        const ctx = offscreen.getContext('2d');
        ctx.drawImage(rotatedBitmap, 0, 0);
      
        return URL.createObjectURL(await offscreen.convertToBlob());
    }
 

    return rotatedBitmap;
  }

  function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  export async function encodeImageBitmapToJpegDataURL(imageBitmap, quality = 0.92) {
    // Use OffscreenCanvas if available, otherwise fallback
    let canvas, ctx;
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
      ctx = canvas.getContext('2d');
    } else {
      canvas = document.createElement('canvas');
      canvas.width = imageBitmap.width;
      canvas.height = imageBitmap.height;
      ctx = canvas.getContext('2d');
    }
  
    ctx.drawImage(imageBitmap, 0, 0);
  
    // For OffscreenCanvas, we need to convert the blob to Data URL manually
    if (canvas.convertToBlob) {
      const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
      return await blobToDataURL(blob);
    } else {
      // Regular canvas has toDataURL
      return canvas.toDataURL('image/jpeg', quality);
    }
  }

  export async function calculateImageFileHash(arrayBuffer, algorithm = 'SHA-256') {
    // Read the file as ArrayBuffer

  
    // Compute the hash
    const hashBuffer = await crypto.subtle.digest(algorithm, arrayBuffer);
  
    // Convert the hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
    return hashHex;
  }