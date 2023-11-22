const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const captureButton = document.getElementById('captureBtn');
const stVidButton = document.getElementById('stVidBtn');

var hintCounter = 0;
const hintList = [
    document.getElementById('face_front'),
    document.getElementById('face_left'),
    document.getElementById('face_front'),
    document.getElementById('face_right'),
    document.getElementById('face_front'),
    document.getElementById('face_up'),
    document.getElementById('face_front'),
    document.getElementById('face_down'),
];

//sendImages([]);
var vStream;
var imgW;
var imgH;
var blobs = [];
var imageCounter = 0;
// Get user media (video) and display in the video element
navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
        vStream = stream;

    })
    .catch(function (error) {
        console.error('Error accessing the camera: ', error);
    });

const helpList = document.getElementById('helpList');
const timeCounter = document.getElementById('timeCounter');
const timeHeader = document.getElementById('timeHeader');
const makeAgianBtn = document.getElementById('makeAgianBtn');
const toConference = document.getElementById('toConference');
timeCounter.style.display = 'none';
timeHeader.style.display = 'none';

let seconds = 0;
function updateTimer() {
    seconds++;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    var sMins = String(mins);
    var sSecs = String(secs);
    if (sMins.length == 1){
        sMins = "0"+sMins;
    }
    if (sSecs.length == 1){
        sSecs = "0"+sSecs;
    }
    timeCounter.textContent = " "+sMins + " : " +sSecs+" / ( 00:20 )"
}

async function startFlexatar(arrayBuffer){
    makeAgianBtn.style.display = 'inline-block';
    toConference.style.display = 'inline-block';
    const flxCanvas = document.getElementById("flexatarCanvas");
    flxCanvas.style.display = 'inline-block';
    flxCanvas.width = 240;
    flxCanvas.height = 320;
    flxCanvas.style.border = "2px solid";
    document.body.appendChild(flxCanvas);
    const rEngine = await makeFlexatar(flxCanvas,arrayBuffer)
}

function sendImages(blobList){
    timeCounter.style.display = 'inline-block';
    timeHeader.style.display = 'inline-block';
    const timerInterval = setInterval(updateTimer, 1000);


    const formData = new FormData();

    // Append each image Blob to the FormData object with a specific key (e.g., 'images[]')
    blobList.forEach((blob, index) => {
        formData.append('images[]', blob, `image_${index}.jpg`);
    });
//    var request = new Request('https://192.168.0.17:5556?what=make_web_flx&userid=android_test_id');
    var request = new Request('https://flexatar.com/data?what=make_web_flx&userid=android_test_id&s_limit=21&send_to_conf=1');
    // Send the FormData object to the server using a POST request
    fetch(request, {
        method: 'POST',
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        if (response.status === 200) {
            return response.arrayBuffer();
        }else{
            throw new Error('Network response was not ok: ' + response.statusText);
        }
    })
    .then(data => {
        if (data.byteLength<10){
            alert("Error. You must follow instructions!");
            timeCounter.style.display = 'none';
            timeHeader.style.display = 'none';

            clearInterval(timerInterval);
            makeAgianBtn.style.display = 'inline-block';
//            toConference.style.display = 'inline-block';
        }else{
            timeCounter.style.display = 'none';
            timeHeader.style.display = 'none';
            startFlexatar(data);
            clearInterval(timerInterval);

//            console.log('Server response:', data);
        }

    })
    .catch(error => {
        timeCounter.style.display = 'none';
        timeHeader.style.display = 'none';
        makeAgianBtn.style.display = 'inline-block';
        clearInterval(timerInterval);
        alert('Something went wrong, sorry!');
        console.error('Error:', error);
    });
}



// Function to capture a photo from the video stream
function capturePhoto() {
    // Draw the current frame from the video onto the canvas

    canvasElement.getContext('2d').drawImage(videoElement, 0, 0, imgW, imgH);
    canvas.toBlob(function(blob) {
        // Send the Blob data to the server using a POST request with content type application/octet-stream
        if (hintCounter == 0 || hintCounter%2 == 1){
            blobs.push(blob)
        }
        hintList[hintCounter].style.display = 'none';
        hintCounter += 1;
        if (hintCounter<hintList.length){
            hintList[hintCounter].style.display = 'inline-block';
        }else{
            sendImages(blobs);
            captureButton.style.display = 'none';
            const mediaStream = videoElement.srcObject;

            // Check if the media stream is active
            if (mediaStream) {

                // Get the tracks from the media stream
                const tracks = mediaStream.getTracks();

                // Iterate through tracks and stop them
                tracks.forEach(track => {
                    track.stop(); // Stop the track
                });

                // Clear the video element source object to stop displaying the video
                videoElement.srcObject = null;
                videoElement.style.display = 'none';
            }
        }
//        if (blobs.length == 3){
//            sendImages(blobs);
//        }
    }, 'image/jpeg', 0.8);

}



function startVideo() {
    videoElement.srcObject = vStream;
    videoElement.style.transform = 'scaleX(-1)';
    videoElement.style.display = 'inline-block';
    captureButton.style.display = 'inline-block';
    stVidButton.style.display = 'none';
    helpList.style.display = 'none';
    document.body.removeChild(helpList);

    hintList[hintCounter].style.display = 'inline-block';
    videoElement.addEventListener('loadedmetadata', function () {
        imgW = videoElement.videoWidth;
        imgH = videoElement.videoHeight;

        canvasElement.width =imgW;
        canvasElement.height =imgH;


    });
}
function startInterfaceAgain(){
    location.reload();
}
function startConference(){
    window.location.href = 'https://flexatar.com';
}

stVidButton.addEventListener('click', startVideo);
// Add click event listener to the capture button
captureButton.addEventListener('click', capturePhoto);

makeAgianBtn.addEventListener('click', startInterfaceAgain);

toConference.addEventListener('click', startConference);

function checkOrientation() {
    if (window.orientation === 0 || window.orientation === 180) {
        console.log("Portrait orientation");
        videoElement.classList.add('fixed-video-pt');
        videoElement.classList.remove('fixed-video');
        hintList.forEach(item => {
            item.classList.add('image-container-pt');
            item.classList.remove('image-container');
        });


    } else if (window.orientation === 90 || window.orientation === -90) {
        console.log("Landscape orientation");

        videoElement.classList.add('fixed-video');
        videoElement.classList.remove('fixed-video-pt');
         hintList.forEach(item => {
            item.classList.add('image-container');
            item.classList.remove('image-container-pt');
        });
    }
}

// Call the function initially and on orientation change
checkOrientation();
window.addEventListener("orientationchange", checkOrientation);


