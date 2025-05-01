import { FaceLandmarker, FaceDetector, FilesetResolver} from "@mediapipe/tasks-vision"


function rotationMatrixToEulerAngles(R) {
    const sy = Math.sqrt(R[0][0] * R[0][0] + R[1][0] * R[1][0]);

    let pitch, yaw, roll;

    const singular = sy < 1e-6;

    if (!singular) {
        pitch = Math.atan2(R[2][1], R[2][2]);
        yaw   = Math.atan2(-R[2][0], sy);
        roll  = Math.atan2(R[1][0], R[0][0]);
    } else {
        // Gimbal lock
        pitch = Math.atan2(-R[1][2], R[1][1]);
        yaw   = Math.atan2(-R[2][0], sy);
        roll  = 0;
    }

    // Convert to degrees
    pitch = pitch * 180 / Math.PI;
    yaw   = yaw * 180 / Math.PI;
    roll  = roll * 180 / Math.PI;

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

    return rotationMatrixToEulerAngles(R);
}

function sortPoints(points) {
    return points.sort((a, b) => {
        a = a.keypoints[2]
        b = b.keypoints[2]
        if (a.x === b.x) {
        return a.y - b.y; // same column, compare rows (top to bottom)
        }
        return a.x - b.x; // left to right
    });
}

const MAX_YAW = 15
const MAX_PITCH = 25
const MIN_IMAGE_WIDTH = 100

const WARN_YAW = 10
const WARN_IMAGE_WIDTH = 300
  
export class FaceParser {
    constructor(pathToAsset){
        this.ready = this.setup(pathToAsset)
    }

    async setup(pathToAsset){
        const filesetResolver = await FilesetResolver.forVisionTasks(pathToAsset);
        const modelPath = pathToAsset+"/blaze_face_short_range.tflite"
        this.faceDetector = await FaceDetector.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: "GPU",
              minDetectionConfidence:0.2,
             
            },
           
            runningMode:"IMAGE",
           
        });

        const lmModelPath = pathToAsset+"/face_landmarker.task"

        this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: lmModelPath,
                delegate: "GPU"
            },
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes:true,
            runningMode:"IMAGE",
            numFaces: 1
        });

    }
    async detect(img){
        await this.ready;

        const result = this.faceDetector.detect(img);

        result.detections = sortPoints(result.detections)
        return result;
    }
    async landmark(img){
        await this.ready;
        return this.faceLandmarker.detect(img);
    }

    async checkImage(img){
        try{
            // if (img.width<MIN_IMAGE_WIDTH){
            //     return {isValid:false}
            // }
    
            const landmarks = await this.landmark(img)
            const angles = extractRotationAngles(landmarks.facialTransformationMatrixes[0].data)
            const ret = {angles,isValid:true}
            // if (Math.abs(angles.yaw)>MAX_YAW || Math.abs(angles.pitch)>MAX_PITCH){
            //     ret.isValid = false
            // }
    
            ret.errorPitch = Math.abs(angles.yaw)>MAX_PITCH
            ret.warnYaw = Math.abs(angles.yaw)>WARN_YAW
            ret.warnSize = img.width<WARN_IMAGE_WIDTH
            ret.errorYaw = Math.abs(angles.yaw)>MAX_YAW
    
            return ret
        }catch{
            return {isValid:false}
        }
        
    }
}