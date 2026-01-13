import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
function log() {
    console.log("[LANDMARKER]", ...arguments)
}


function rotationMatrixToEulerAngles(R) {
    const sy = Math.sqrt(R[0][0] * R[0][0] + R[1][0] * R[1][0]);

    let pitch, yaw, roll;

    const singular = sy < 1e-6;

    if (!singular) {
        pitch = Math.atan2(R[2][1], R[2][2]);
        yaw = Math.atan2(-R[2][0], sy);
        roll = Math.atan2(R[1][0], R[0][0]);
    } else {
        // Gimbal lock
        pitch = Math.atan2(-R[1][2], R[1][1]);
        yaw = Math.atan2(-R[2][0], sy);
        roll = 0;
    }

    // Convert to degrees
    // pitch = pitch * 180 / Math.PI;
    // yaw = yaw * 180 / Math.PI;
    // roll = roll * 180 / Math.PI;

    return { pitch, yaw, roll };
}

function extractRotationAngles(matrix4x4) {
    // Assumes matrix is a flat array of 16 numbers in column-major order
    // Extract upper-left 3x3 rotation matrix
    const R = [
        [matrix4x4[0], matrix4x4[4], matrix4x4[8]],
        [matrix4x4[1], matrix4x4[5], matrix4x4[9]],
        [matrix4x4[2], matrix4x4[6], matrix4x4[10]]
    ];
    const ret = rotationMatrixToEulerAngles(R);
    ret.tx = matrix4x4[12]
    ret.ty = matrix4x4[13]
    ret.tz = matrix4x4[14]

    return ret;
}


export class Landmarker {
    constructor(assetMap, wasmPath = "/virtual", modelPath = "/virtual/face_landmarker.task") {

        this.ready = this.setup(assetMap, wasmPath, modelPath)
    }

    async setup(assetMap, wasmPath, modelPath) {
        log("paths", wasmPath, modelPath)
        const originalFetch = self.fetch.bind(self);
        const originalImportScripts = self.importScripts;
        if (assetMap) {
            self.fetch = async (url, options) => {
                // log("try to fetch landmarker patch", url)
                if (url instanceof Request) {
                    options = {
                        method: url.method,
                        headers: url.headers,
                        body: url.body,
                        mode: url.mode,
                        credentials: url.credentials,
                        cache: url.cache,
                        redirect: url.redirect,
                        referrer: url.referrer,
                        integrity: url.integrity,
                        keepalive: url.keepalive,
                        signal: url.signal
                    };
                    url = url.url;

                }
                const fileName = url.split("/").pop();
                log()
                if (assetMap[fileName]) {
                    log("assetMap branch")
                    const buffer = assetMap[fileName];
                    const contentType = fileName.endsWith("wasm") ? 'application/wasm' : "application/octet-stream"
                    // Wrap ArrayBuffer in a Response object so MediaPipe sees it like a normal fetch result
                    return new Response(buffer, {
                        status: 200,
                        headers: { "Content-Type": contentType }
                    });
                }
                try {

                    const fetchResult = await originalFetch(url, options)
                    log("using oroginalfetch", fetchResult)

                    return fetchResult;
                } catch (e) {
                    console.error("originalFetch failed:", url, e);
                    throw e;
                }
                // return originalFetch(url, options);
            };


            self.importScripts = function (...urls) {
                const patchedUrls = urls.map(url => {
                    if (url.endsWith("vision_wasm_internal.js") && assetMap["vision_wasm_internal.js"]) {
                        console.log("Intercepted", url);

                        const blob = new Blob(
                            [assetMap["vision_wasm_internal.js"]],
                            { type: "application/javascript" }
                        );
                        return URL.createObjectURL(blob);
                    }
                    return url;
                });

                return originalImportScripts.apply(self, patchedUrls);
            };
        }

        log("assetMap", assetMap)
        const filesetResolver = await FilesetResolver.forVisionTasks(wasmPath);
        this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: modelPath,
                delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            outputFaceLandmarks: false,
            runningMode: "VIDEO",
            numFaces: 1
        });
        log("FaceLandmarker installed")
        // ---- Restore fetch after initialization ----
        // self.fetch = originalFetch;

    }
    async makeDetection(frame, ts) {
        if (!this.faceLandmarker) return
        // const now = performance.now();
        const detectionResult = await this.faceLandmarker.detectForVideo(frame, ts);
        return detectionResult




    }
    async obtainHeadMotionState(frame, calibration, ts) {
        const detectionResult = await this.makeDetection(frame, ts)
        if (!detectionResult) return
        const transformMatrix = detectionResult.facialTransformationMatrixes[0];
        if (!transformMatrix) return
        const transformData = detectionResult.facialTransformationMatrixes[0].data
        if (!transformData) return
        const angles = extractRotationAngles(transformData)
        const eyeLeftScore = detectionResult.faceBlendshapes[0].categories[14].score
        const eyeRightScore = detectionResult.faceBlendshapes[0].categories[16].score
        const eyeLeftScore1 = detectionResult.faceBlendshapes[0].categories[13].score
        const eyeRightScore1 = detectionResult.faceBlendshapes[0].categories[15].score
        const eyePosition = (eyeLeftScore - eyeRightScore - eyeLeftScore1 + eyeRightScore1) / 2

        const eyeUpScore = detectionResult.faceBlendshapes[0].categories[18].score
        const eyeDownScore = detectionResult.faceBlendshapes[0].categories[12].score
        const eyeUpScore1 = detectionResult.faceBlendshapes[0].categories[17].score
        const eyeDownScore1 = detectionResult.faceBlendshapes[0].categories[11].score
        const eyePositionUD = (eyeUpScore - eyeDownScore + eyeUpScore1 - eyeDownScore1) / 2


        const browUp = (detectionResult.faceBlendshapes[0].categories[3].score + detectionResult.faceBlendshapes[0].categories[4].score + detectionResult.faceBlendshapes[0].categories[5].score) / 3
        const browDown = (detectionResult.faceBlendshapes[0].categories[1].score + detectionResult.faceBlendshapes[0].categories[2].score) / 2


        const smile = (detectionResult.faceBlendshapes[0].categories[44].score + detectionResult.faceBlendshapes[0].categories[45].score) / 2
        const scale = (-angles.tz - 43) / 50

        const mouthUp = detectionResult.faceBlendshapes[0].categories[38].score * 2


        let jawOpen = detectionResult.faceBlendshapes[0].categories[25].score * 2
        const mouthStretch = detectionResult.faceBlendshapes[0].categories[46].score + detectionResult.faceBlendshapes[0].categories[47].score - detectionResult.faceBlendshapes[0].categories[32].score
        const mouthRoll = detectionResult.faceBlendshapes[0].categories[40].score + detectionResult.faceBlendshapes[0].categories[41].score
        let eyeBlink = detectionResult.faceBlendshapes[0].categories[9].score + detectionResult.faceBlendshapes[0].categories[10].score

        const upperLipOp = detectionResult.faceBlendshapes[0].categories[48].score + detectionResult.faceBlendshapes[0].categories[49].score



        if (eyeBlink > 1) eyeBlink = 1
        if (jawOpen > 0.65) jawOpen = 0.65
        const headMotionState = [
            -angles.yaw * 1, //rot right-left 0
            angles.pitch * 0.8, //rot down-up 1
            0, //move left-right 2
            0, //move up - down 3
            // angles.tx * 0.03, //move left-right 2
            // angles.ty * 0.1, //move up - down 3
            -scale*0.3,  //scale form 0 to 1 (1+alpha) 4
            0, //tilt body 5
            // angles.tx * 0.1 * 0.1, //tilt body 5
            -angles.roll * 3.5, //tilt head 6
            eyePosition, //eyes-right 7
            eyePositionUD, //eyes-down 8
            0, //no effect 9
            smile, //smile 10
            browUp * 4, // brow up 11
            browDown * 4, //brow down 12
            mouthUp * 0.25, //mouse up 13
            smile * 0.5+mouthStretch*jawOpen*3, //mouse corners up 14
            jawOpen, // following are mouse openings 15
            mouthStretch, //16
            -mouthRoll-mouthStretch*jawOpen*1.5, //mouth roll up//17
            eyeBlink //18
        ]
        const headMotionStateClean = [...headMotionState]
        if (calibration) {
            const state = calibration[0]
            for (let i = 0; i < headMotionState.length; i++) {
                headMotionState[i] -= state[i]

            }
            for (let i = 10; i < 14; i++) {
                if (headMotionState[i] < 0) headMotionState[i] = 0
                if (headMotionState[i] >1) headMotionState[i] = 1

            }
            
            if (headMotionState[18] < 0) headMotionState[18] = 0
            if (headMotionState[16] < 0) {
                headMotionState[16] *= 1.2
            }
            if (headMotionState[8] < 0) {
                headMotionState[8] *= 3
            }
            // log("eyePositionUD",headMotionState[8] )



        }

        const lrThr = 0.23
        const lrThrNEg = 0.25
        const udThr = 0.2
        const tiltThr = 1
        if (headMotionState[0] < -lrThrNEg) headMotionState[0] = -lrThrNEg
        if (headMotionState[0] > lrThr) headMotionState[0] = lrThr

        if (headMotionState[1] < -udThr) headMotionState[1] = -udThr
        if (headMotionState[1] > udThr) headMotionState[1] = udThr

        if (headMotionState[6] < -tiltThr) headMotionState[6] = -tiltThr
        if (headMotionState[6] > tiltThr) headMotionState[6] = tiltThr
        return [headMotionStateClean, headMotionState, upperLipOp]

    }
}