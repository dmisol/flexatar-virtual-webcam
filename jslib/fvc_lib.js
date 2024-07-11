
class SpeechNN{
    constructor() {
        this.wav2melModel = null;
        this.mel2phonModel = null;
        this.phon2avecModel = null;
        this.isReady = false;
        this.readyCallback = null;
        this.loadNetworks();
    }
    async loadNetworks(){
        
        this.wav2melModel = await tf.loadLayersModel('https://raw.githubusercontent.com/dmisol/flexatar-virtual-webcam/main/raw/wav2mel/model.json');
//        this.wav2melModel = await tf.loadLayersModel('/file/wav2mel/model.json');
        this.mel2phonModel = await tf.loadLayersModel('https://raw.githubusercontent.com/dmisol/flexatar-virtual-webcam/main/raw/mel2phon/model.json');
//        this.mel2phonModel = await tf.loadLayersModel('/file/mel2phon/model.json');
        this.phon2avecModel = await tf.loadLayersModel('https://raw.githubusercontent.com/dmisol/flexatar-virtual-webcam/main/raw/phon2avec/model.json');
//        this.phon2avecModel = await tf.loadLayersModel('/file/phon2avec/model.json');

        const inputData = tf.tensor2d([new Float32Array(800)]);
        const melPredicted = this.wav2melModel.predict(inputData);
        const melTensors = [];
        for (let i = 0; i < 20; i++) {
            melTensors.push(melPredicted);
        }
        const melGroup = tf.concat(melTensors,1);
        const phoneGroup = this.mel2phonModel.predict(melGroup);
        const start = [0, 0, 0, 0];
        const end = [phoneGroup.shape[0], phoneGroup.shape[1],phoneGroup.shape[2]-1,phoneGroup.shape[3]];
        const phoneGroup1 = tf.slice(phoneGroup,start,end);
        const avec = this.phon2avecModel.predict(phoneGroup1);

        this.isReady = true;
        if (this.readyCallback) {
            this.readyCallback();
        }
    }

    async awaitResources() {
        if (this.isReady) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          this.readyCallback = resolve;
        });
    }
}


class AnimCalc{
    constructor(speechNetworks) {
        this.speechNetworks = speechNetworks;
        this.melTensors = [];
        this.zeroAnimState = new Float32Array(5);
        this.zeroAnimState[0] = 0.5;
        this.zeroAnimState[1] = 0.48;
        this.zeroAnimState[2] = 0.52;
        this.zeroAnimState[3] = 0.43;
        this.zeroAnimState[4] = 0.46;
        var converterType = LibSampleRate.ConverterType.SRC_SINC_FASTEST;
    //        var converterType = LibSampleRate.ConverterType.SRC_SINC_BEST_QUALITY;
        this.resampler;
        let nChannels = 1;
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        let inputSampleRate = audioContext.sampleRate;
        let outputSampleRate = 16000;

        LibSampleRate.create(nChannels, inputSampleRate, outputSampleRate, {
                converterType: converterType, // default SRC_SINC_FASTEST. see API for more
            }).then((src) => {

                this.resampler = src;
//
        });
    }
    getAnim(aBuffer){
        const result = this.makeMel(this.resampler.simple(aBuffer));
        if (result) {
            return result;
        }else{
            return [0.0,0.0,0.0,0.0,0.0];
        }
    }
    makeMel(aBuffer){
//        tf.engine().startScope()
        const inputData = tf.tensor2d([aBuffer]);
        const mel = this.speechNetworks.wav2melModel.predict(inputData);


        this.melTensors.push(mel)

        if (this.melTensors.length == 20){

            const melGroup = tf.concat(this.melTensors,1);

            const phoneGroup = this.speechNetworks.mel2phonModel.predict(melGroup);
            const start = [0, 0, 0, 0];
            const end = [phoneGroup.shape[0], phoneGroup.shape[1],phoneGroup.shape[2]-1,phoneGroup.shape[3]];
            const phoneGroup1 = tf.slice(phoneGroup,start,end);
            const avec = this.speechNetworks.phon2avecModel.predict(phoneGroup1);
            const avecSlice = tf.slice(avec,[0,10,0,0],[1,1,5,1]);
            const avecArrayTF = avecSlice.arraySync()


            const avecArray = new Float32Array(5);
            for (let i = 0; i < 5; i++) {
                avecArray[i] = avecArrayTF[0][0][i][0];
            }
//            this.avecToBshpCoef(avecArray,rEngine,onAnimate);

            //Dispose tensors
                this.melTensors[0].dispose();
                inputData.dispose();
                melGroup.dispose();
                phoneGroup.dispose();
                phoneGroup1.dispose();
                avec.dispose()
                avecSlice.dispose();
            //-----
            this.melTensors.shift()
            return this.avecToBshpCoef(avecArray)
        }


    }
    avecToBshpCoef(nnAvec){
        const result = new Float32Array(5);
        const amp = -7;
         for (let i = 0; i < 5; i++) {
                result[i] =amp*(nnAvec[i]-this.zeroAnimState[i]);
         }
         return result;
//         onAnimate(result,rEngine);

    }
}
//console.log("matirx op")

var v2 = {
    mulScalar: function(v, s) {
        return [v[0]*s,v[1]*s];
    },
    add: function(v1, v2) {
        return [v1[0]+v2[0],v1[1]+v2[1]];
    }
}

var v4 = {
    mulScalar: function(v, s) {
        return [v[0]*s,v[1]*s,v[2]*s,v[3]*s];
    },
    add: function(v1, v2) {
        return [v1[0]+v2[0],v1[1]+v2[1],v1[2]+v2[2],v1[3]+v2[3]];
    }
}

var m4 = {
  translation: function(tx, ty, tz) {
    return [
       1,  0,  0,  0,
       0,  1,  0,  0,
       0,  0,  1,  0,
       tx, ty, tz, 1,
    ];
  },

  xRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
       c, s, 0, 0,
      -s, c, 0, 0,
       0, 0, 1, 0,
       0, 0, 0, 1,
    ];
  },

  scaling: function(sx, sy, sz) {
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },
        translate: function(m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
      },

      xRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.xRotation(angleInRadians));
      },

      yRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.yRotation(angleInRadians));
      },

      zRotate: function(m, angleInRadians) {
        return m4.multiply(m, m4.zRotation(angleInRadians));
      },

      scale: function(m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
      },
      multiply: function(a, b) {
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];

        return [
          b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
          b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
          b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
          b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
          b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
          b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
          b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
          b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
          b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
          b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
          b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
          b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
          b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
          b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
          b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
          b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
      },
      multiplyByV4: function(a, b) {
        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];

        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];

        return [
          b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
          b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
          b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
          b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,

        ];
      }
};

function triSign(triangle){

    const [x1, y1] = triangle[0];
    const [x2, y2] = triangle[1];
    const [x3, y3] = triangle[2];
    return (x1-x3)*(y2-y3) - (x2-x3)*(y1-y3);
}

function checkTriangle(point,triangle){
    const d1 = triSign([point,triangle[0],triangle[1]]);
    const d2 = triSign([point,triangle[1],triangle[2]]);
    const d3 = triSign([point,triangle[2],triangle[0]]);
    const has_neg = (d1<0) || (d2<0) || (d3<0);
    const has_pos = (d1>0) || (d2>0) || (d3>0);
    return !(has_neg && has_pos);

}

function findTriangleContaining(point,triangles){
    var ret = -1;
    for (let j = 0; j < triangles.length; j++) {
            const result = checkTriangle(point,triangles[j]);
            if (result) {
                ret = j;
                break;
            }
//            console.log(result);
    }
    return ret;
}

function vLength(v){
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}
function vLength2(v){
    return v[0] * v[0] + v[1] * v[1];
}
function dot(v1,v2){
    return v1[0] * v2[0] + v1[1] * v2[1];
}

function vSub(v1,v2){
    return [v1[0]-v2[0],v1[1]-v2[1]];

}

function distAndWeight(v0,v1){
    const v1Len = vLength(v1) + 0.0001;
    var proj = dot(v0,v1)/v1Len;
    const dist = Math.sqrt(vLength2(v0) - proj * proj);
    const weight = proj/v1Len;
    return [dist,weight];
}

function vNorm(v){
    const sum = v.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const ret = [];
    for (const vv of v) {
        ret.push(vv/sum);
    }
    return ret;
}

function findWeightsForPoly(poly,point){
    const dists = [];
    const weights = [];
    for (let i = 0; i < poly.length - 1; i++) {
        const v1 = vSub(poly[i+1],poly[i]);
        const v0 = vSub(point,poly[i]);
        const [dist,weight] = distAndWeight(v0,v1);
        dists.push(1.0/(dist+0.001));
        weights.push(weight);
    }
    const v1 = vSub(poly[0],poly[poly.length-1]);
    const v0 = vSub(point,poly[poly.length-1]);
    const [dist,weight] = distAndWeight(v0,v1);
    dists.push(1.0/(dist+0.001));
    weights.push(weight);
    const distN = vNorm(dists);

    const pointWeights = [0.0,0.0,0.0];
    for (let i = 0; i < poly.length - 1; i++) {
        pointWeights[i] += (1 - weights[i]) * distN[i];
        pointWeights[i+1] += weights[i] * distN[i];
    }
    pointWeights[poly.length-1] += (1 - weights[poly.length-1]) * distN[poly.length-1];
    pointWeights[0] += weights[poly.length-1] * distN[poly.length-1];
    return vNorm(pointWeights);

}
function makeInterUnit(point,triangles,indices,border){
    var triIdx = findTriangleContaining(point,triangles);
    var calculatedPoint = point;
    if (triIdx == -1) {
//        console.log("borderPoint");
//        const borderPoint = findIntersection([[0.0,0.0],[1.0,0.1]],[[0.5,1.0],[0.55,-1.0]]);
//        console.log(borderPoint);
        var borderPoint = null;
        for (const b of border) {
            borderPoint = findIntersection(b,[point,[0.5,0.45]]);
//            console.log(borderPoint);
            if (borderPoint!=null){
                break;
            }
        }
         if (borderPoint==null){
            return null;
         }
         calculatedPoint = pointBetweenPoints([0.5,0.45],borderPoint,0.98);
         triIdx = findTriangleContaining(calculatedPoint,triangles);
    }
//    console.log("calculatedPoint");
//    console.log(calculatedPoint);
    const weights = findWeightsForPoly(triangles[triIdx],calculatedPoint);

    const bshpIdx = [];
    for (let i = 0; i < 3; i++) {
        bshpIdx.push(indices[triIdx * 3 + i]);
    }
    return [bshpIdx,weights,[point[0]-calculatedPoint[0],point[1]-calculatedPoint[1]]]

}

function pointBetweenPoints(p1,p2,percent){
    const [x1,y1] = p1;
    const [x2,y2] = p2;
    const x = x1 + (x2-x1) * percent;
    const y = y1 + (y2-y1) * percent;
    return [x,y];
}

function rCont(range,val){
    return range[0]<=val &&  range[1]>=val;
}

function findIntersection(line1,line2){
    const [s1,e1] = line1;
    const [s2,e2] = line2;
    const [s1x,s1y] = s1;
    const [e1x,e1y] = e1;
    const [s2x,s2y] = s2;
    const [e2x,e2y] = e2;
    const slope1 = (e1y-s1y)/(e1x-s1x);
    const yIntercept1 = s1y - slope1 * s1x;
//    console.log([slope1,yIntercept1]);

    const slope2= (e2y-s2y)/(e2x-s2x);
    const yIntercept2 = s2y - slope2 * s2x;
//     console.log([slope2,yIntercept2]);
    if (slope1 == slope2) {
        return null;
    }
    const x = (yIntercept2 - yIntercept1) / (slope1 - slope2);
    const y = slope1 * x + yIntercept1;
//    console.log([x,y]);
    const x1Range = [Math.min(s1x, e1x),Math.max(s1x, e1x)];
    const x2Range = [Math.min(s2x, e2x),Math.max(s2x, e2x)];
    const y1Range = [Math.min(s1y, e1y),Math.max(s1y, e1y)];
    const y2Range = [Math.min(s2y, e2y),Math.max(s2y, e2y)];
    if (rCont(x1Range,x) && rCont(y1Range,y) && rCont(x2Range,x) && rCont(y2Range,y)){
        return [x,y];
    }
    else{
       return null;
    }

}



function unpackLengthHeader(data){


    littleEndian = true
    const left =  data.getUint32(0, littleEndian);
    const right = data.getUint32(4, littleEndian);

    const combined = littleEndian? left + 2**32*right : 2**32*left + right;
    return combined;
}

function unpackToBlocks(data){
    var offset = 0;
    const fullLength = data.length;

    const headers = [];
    const bodies = [];
    var counter = 0
    while (true){
        const headerView = new DataView(data.buffer, data.byteOffset+offset, 8);
        const dataLength = unpackLengthHeader(headerView);
        offset += 8;
        const bodyUint8Array = new Uint8Array(data.buffer, data.byteOffset + offset, dataLength);
        offset += dataLength;
        if (counter%2 == 0){
            const text = new TextDecoder('utf-8').decode(bodyUint8Array);
            const jsonObject = JSON.parse(text);
            headers.push(jsonObject);
//            console.log(jsonObject);
        }else{
            bodies.push(bodyUint8Array);
        }
        counter+=1;
        if (offset >= fullLength){
            break;
        }

    }
    return [headers,bodies]
}

function repackSpeechBlendshapes(buffer){
    const vtxCount = buffer.length/5/2;
    const buffer0 = new Float32Array(vtxCount*4);
    const buffer1 = new Float32Array(vtxCount*4);
    const buffer2 = new Float32Array(vtxCount*4);
    for (let i = 0; i < vtxCount; i++) {
        for (let j = 0; j < 5; j++) {
            for (let k = 0; k < 2; k++) {
                if (j == 0 || j == 1){
                    buffer0[i*4 + j*2 +k] = buffer[i*2*5 + j*2 + k];
                }else if (j == 2 || j == 3){
                    buffer1[i*4 + (j%2)*2 +k] = buffer[i*2*5 + j *2 + k];
                }else if (j == 4){
                    buffer2[i*4 + (j%2)*2 +k] = buffer[i*2*5 + j *2 + k];
                }
            }
        }
    }
    return [buffer0,buffer1,buffer2];
}
function accessByShape(arr,shape,idx){
    var flatIdx = 0;
    for (let i = 0; i < shape.length; i++) {

        var m = 1;
        for (let j = i + 1; j < shape.length; j++) {
            m *= shape[j]
        }
        flatIdx += m*idx[i]
    }
    return arr[flatIdx]
}

function unpackMouthDataDict(data){
//    console.log("UnpackMouthData");
    var offset = 0;
    const fullLength = data.length;

    const ret = {};
    var counter = 0
    var entry = null;
    while (true){
        const headerView = new DataView(data.buffer, data.byteOffset+offset, 8);
        const dataLength = unpackLengthHeader(headerView);

        offset += 8;

        if (counter%2 == 0){
            const bodyUint8Array = new Uint8Array(data.buffer, data.byteOffset + offset, dataLength);

            entry = new TextDecoder('utf-8').decode(bodyUint8Array);
//            console.log(entry);
        }else{
            const floatBuffer = data.slice(offset,offset+dataLength)

            if (entry === "index"){
                ret[entry] = new Uint16Array(floatBuffer.buffer, floatBuffer.byteOffset, dataLength/2);
            }else{
                ret[entry] = new Float32Array(floatBuffer.buffer, floatBuffer.byteOffset, dataLength/4);
            }
        }
        offset += dataLength;
        counter+=1;
        if (offset >= fullLength){
            break;
            entry = null
        }
    }
    return ret;

}
function unpackToDataDict(data){
    var offset = 0;
    const fullLength = data.length;

    const ret = {};
    var counter = 0
    var entry = null;
    while (true){
        const headerView = new DataView(data.buffer, data.byteOffset+offset, 8);
        const dataLength = unpackLengthHeader(headerView);
        offset += 8;

        if (counter%2 == 0){
            const bodyUint8Array = new Uint8Array(data.buffer, data.byteOffset + offset, dataLength);

            entry = new TextDecoder('utf-8').decode(bodyUint8Array);
//            console.log(entry);
        }else{
            if (entry === "uv"){


                const floatBuffer = data.slice(offset,offset+dataLength)
                ret[entry] = new Float32Array(floatBuffer.buffer, floatBuffer.byteOffset, dataLength/4);
            }else if (entry === "idx"){
                const int16Buffer = data.slice(offset,offset+dataLength)
                ret[entry] = new Uint16Array(int16Buffer.buffer, int16Buffer.byteOffset, dataLength/2);
            }else if (entry === "anim1" || entry === "anim2"){
                const floatBuffer = data.slice(offset,offset+dataLength)
                ret[entry] = new Float32Array(floatBuffer.buffer, floatBuffer.byteOffset, dataLength/4);
//                console.log(entry);
//                console.log(ret[entry]);
            }else if (entry === "speech_bsh"){
                const floatBuffer = data.slice(offset,offset+dataLength)
                ret[entry] = new Float32Array(floatBuffer.buffer, floatBuffer.byteOffset, dataLength/4);
            }else if (entry === "eyebrow_bsh"){
                const floatBuffer = data.slice(offset,offset+dataLength)
                ret[entry] = new Float32Array(floatBuffer.buffer, floatBuffer.byteOffset, dataLength/4);
            }else if (entry === "blink_pat"){
                const floatBuffer = data.slice(offset,offset+dataLength)
                ret[entry] = new Float32Array(floatBuffer.buffer, floatBuffer.byteOffset, dataLength/4);
            }else if (entry === "mouth_default"){
                ret[entry] = data.slice(offset,offset+dataLength)
            }

        }
        offset += dataLength;
        counter+=1;
        if (offset >= fullLength){
            break;
            entry = null
        }

    }
    return ret
}

class IdxBuffer{
    constructor(gl,int16Array){
        this.id = gl.createBuffer();
        this.gl = gl
        this.length = int16Array.length
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, int16Array, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
    bind(){
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.id);
    }
}
class VtxBuffer{

    constructor(gl,floatArray){
        this.gl = gl
        this.id = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
        gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.size = null;
        this.location = null;
    }
    makeLocation(shaderProgram,name,size){
        this.size=size;
        this.location = this.gl.getAttribLocation(shaderProgram, name);
    }
    bind(){
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.id);
        this.gl.vertexAttribPointer(this.location, this.size, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(this.location);
    }
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
class FlexatarCommonData {
    constructor(url){
    this.isReady = false;
    this.readyCallback = null;

    this.uvGlBuffer = null;
    this.idxGlBuffer = null;
    this.animationPattern = null;
    this.animationPatternLen = null;
    this.speechBshp = null;
    this.speechBshpChoosenIdx = null;
    this.blinkPat = null;
    this.mouthDefault = null;
    fetch(url)
           .then(response => {
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                return response.arrayBuffer();
            })
           .then(arrayBuffer => {
                const uint8Array = new Uint8Array(arrayBuffer);
                const dataDict = unpackToDataDict(uint8Array);
                this.makeGpuBuffers(dataDict);
           }) .catch(error => {
                console.error('Fetch error:', error);
            });
    }
    makeGpuBuffers(dataDict){
        this.uvGlBuffer = dataDict["uv"];
        this.idxGlBuffer = dataDict["idx"];
        this.animationPattern = dataDict["anim1"];
        this.animationPatternLen = this.animationPattern.length/10;

        this.speechBshp = repackSpeechBlendshapes(dataDict["speech_bsh"]);
        this.eyebrowBshp = dataDict["eyebrow_bsh"];

        this.speechBshpChoosenIdx = this.makeBshpForIdx([50])

        this.blinkPat = dataDict["blink_pat"];
        this.fillAPatternWithBlinks();
        this.mouthDefault = dataDict["mouth_default"];
        this.isReady = true;
        if (this.readyCallback) {
            this.readyCallback();
        }
    }

    fillAPatternWithBlinks(){
        var currentBlinkPos = 0
        for (let i = 0; i < this.animationPatternLen; i++) {
            const fullPatIdx = (currentBlinkPos + i)*10 + 8;
            this.animationPattern[fullPatIdx] = 0;
        }
        while (true){
            currentBlinkPos += getRandomInt(50,200)
            if (currentBlinkPos + this.blinkPat.length >= this.animationPatternLen){
                break
            }else{
                for (let i = 0; i < this.blinkPat.length; i++) {
                    const fullPatIdx = (currentBlinkPos + i)*10 + 8;
                    this.animationPattern[fullPatIdx] = this.blinkPat[i];
                }
            }
        }
    }
    makeBshpForIdx(idxList){
        const [b0,b1,b2] = this.speechBshp;
        const vtxBshp = []
        for (const idx of idxList){
            const vtxPos =  idx*4;
            const speechCurVtx = [[b0[vtxPos+0],b0[vtxPos+1]],[b0[vtxPos+2],b0[vtxPos+3]],[b1[vtxPos+0],b1[vtxPos+1]],[b1[vtxPos+2],b1[vtxPos+3]],[b2[vtxPos+0],b1[vtxPos+1]]];
            vtxBshp.push(speechCurVtx);
        }
        return vtxBshp;
    }
    async awaitResources() {
        if (this.isReady) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          this.readyCallback = resolve;
        });
    }

    getAnimationFrame(idx){
        const aFrame = new Float32Array(10);

        var idx1 = idx % this.animationPatternLen * 2;
        if (idx1>=this.animationPatternLen){
            idx1  = this.animationPatternLen - idx1 % this.animationPatternLen-1;
        }
        aFrame.set(this.animationPattern.subarray(10*idx1,10*idx1+9), 0);
        return aFrame;
    }
}

class Texture{
    constructor(gl,image){
        this.gl = gl;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          srcFormat,
          srcType,
          image,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    bind(textureUnit,shaderProgram,samplerName){
        const gl = this.gl;
        const samplerLoc = gl.getUniformLocation(shaderProgram, samplerName);
        gl.activeTexture(gl.TEXTURE0+textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(samplerLoc, textureUnit);
    }

}
class TextureArray{
    constructor(textureList,gl){
        this.textureList = textureList
        this.gl = gl
        this.samplerLoc = null;
    }
    makeLocation(shaderProgram,samplerName){
        this.samplerLoc = this.gl.getUniformLocation(shaderProgram, samplerName);
    }
    bind(textureUnit){
        const gl = this.gl
        const locations = [];
        for (let i = 0; i < this.textureList.length; i++) {
            gl.activeTexture(gl.TEXTURE0+textureUnit+i);
            gl.bindTexture(gl.TEXTURE_2D, this.textureList[i].texture);
            locations.push(textureUnit+i)
        }
        gl.uniform1iv(this.samplerLoc, locations);

    }
}



class FlexatarUnit{
    constructor(arrayBuffer,flexatarCommon){
        this.isReady = false;
        this.readyCallback = null;

        this.mandalaTexturesPromise = [];
        this.mandalaMouthTexturesPromise = [];
        this.mandalaTextures = [];
        this.mandalaMouthTextures = [];
        this.mandalaMouthGLTextures = [];
        this.mandalaGLTextures = [];
        this.mandalaTextureArray = null;
        this.mandalaGLBshpBuffers = []
        this.mandalaCheckpoints = null;
        this.mandalaFaces = null;
        this.mandalaBorderIdx = null;
        this.mandalaBorder = null;
        this.mouthBlendshapes = null;
        this.mouthUV = null;
        this.mouthIdx = null;
        this.keyVtx = null;
        this.eyelidBlendshape = null;
        const uint8Array = new Uint8Array(arrayBuffer);
        var blocks = unpackToBlocks(uint8Array);

        if (this.checkIfNeedInsertMouth(blocks)){
            const mouthBlocks = unpackToBlocks(flexatarCommon.mouthDefault);
            blocks = this.repackWithMouth(blocks,mouthBlocks)
        }

        this.makeFlxData(blocks,null);
        this.makeTextures();
        /*fetch(url)
            .then(response => {
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {

                const uint8Array = new Uint8Array(arrayBuffer);
                var blocks = unpackToBlocks(uint8Array);

                if (this.checkIfNeedInsertMouth(blocks)){
                    const mouthBlocks = unpackToBlocks(flexatarCommon.mouthDefault);
                    blocks = this.repackWithMouth(blocks,mouthBlocks)
                }

                this.makeFlxData(blocks,null);
                this.makeTextures();
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });*/

    }
    async makeTextures(){
        const images = await Promise.all(this.mandalaTexturesPromise);
        for (const image of images) {
            URL.revokeObjectURL(image[1]);
            this.mandalaTextures.push(image[0])
        }

        const imagesMouth = await Promise.all(this.mandalaMouthTexturesPromise);
        for (const image of imagesMouth) {
            URL.revokeObjectURL(image[1]);
            this.mandalaMouthTextures.push(image[0]);
        }
        this.makeKeyVertex();
        this.dataLoaded();
    }
    makeKeyVertex(){
        const keyVtxIdx = [88,97,50,43,54,46];
        const keyVtx = [];
        for (const idx of keyVtxIdx) {
            const vtxBshpList = [];
            keyVtx.push(vtxBshpList);
            for (const vtxBuf of  this.mandalaGLBshpBuffers) {
                const vtx = [vtxBuf[idx*4],vtxBuf[idx*4+1],vtxBuf[idx*4+2],vtxBuf[idx*4+3]];
                vtxBshpList.push(vtx);
            }
        }
        this.keyVtx = keyVtx;
    }
    checkIfNeedInsertMouth(blocks){
        for (let i = 0; i < blocks[0].length; i++) {
                const header = blocks[0][i];
                if (header["type"] === "mouthData"){
                    return false
                }
        }
        return true;
    }
    repackWithMouth(headBlocks,mouthBlocks){
        const headers = []
        const bodies = []
        var isDelimiterFound = false;
        for (let i = 0; i < headBlocks[0].length; i++) {
            const header = headBlocks[0][i];
            const body = headBlocks[1][i];
            if (header["type"] === "Delimiter"){
                break;
            }
            headers.push(header)
            bodies.push(body)
        }
        headers.push({"type":"Delimiter"})
        bodies.push(new TextEncoder().encode('{"type":"mouth"}'))
        for (let i = 0; i < mouthBlocks[0].length; i++) {
            const header = mouthBlocks[0][i];
            const body = mouthBlocks[1][i];

            headers.push(header)
            bodies.push(body)
        }
        return [headers,bodies]
    }

    makeFlxData(blocks){
        var isFirstFlexatar = true;
        var delimiterName = "exp1";
        for (let i = 0; i < blocks[0].length; i++) {
            const header = blocks[0][i];
            const body = blocks[1][i];

            if (isFirstFlexatar) {
                if (header["type"] === "mandalaTextureBlurBkg"){
                    const imgPromise = new Promise((resolve, reject) => {
                        const blob = new Blob([body], { type: 'image/png' });
                        const url = URL.createObjectURL(blob);
                        const img = new Image();

                        img.onload = () => resolve([img,url]);
                        img.src = url;
                     });
                    this.mandalaTexturesPromise.push(imgPromise);
                }else if (header["type"] === "mandalaBlendshapes"){

                    const floatBuffer = body.slice(0,body.length);
                    const floatsCount = floatBuffer.byteLength/4;
                    const vtxCount = floatsCount/4;
                    const perBshVtxCount = vtxCount/5;
                    const mandalaBlendshapes = new Float32Array(floatBuffer.buffer, floatBuffer.byteOffset, floatBuffer.byteLength/4);
                    const bshp = [];
                    for (let i = 0; i < 5; i++) {
                        bshp.push(new Float32Array(perBshVtxCount * 4));
                        for (let j = 0; j < perBshVtxCount; j++) {
                            for (let k = 0; k < 4; k++) {
                                const positionInRaw = k + i * 4 + j * 5 * 4;
                                const positionInRepack = k + j * 4 ;
                                bshp[i][positionInRepack] = accessByShape(mandalaBlendshapes,[-1,5,4],[j,i,k]);
                            }
                        }
                    }

                    for (let i = 0; i < 5; i++) {
                        this.mandalaGLBshpBuffers.push(bshp[i]);
                    }

                }else if (header["type"] === "mandalaCheckpoints"){
                    const floatBuffer = body.slice(0,body.length);
                    this.mandalaCheckpoints = new Float32Array(floatBuffer.buffer, floatBuffer.byteOffset, floatBuffer.byteLength/4);
                }else if (header["type"] === "mandalaFaces"){
                    const floatBuffer = body.slice(0,body.length);
                    const int64Array = new Int32Array(floatBuffer.buffer, floatBuffer.byteOffset, floatBuffer.byteLength/4);
                    this.mandalaFaces = new Int32Array(int64Array.length/2);
                    for (let i = 0; i < int64Array.length/2; i++) {
                        this.mandalaFaces[i] = int64Array[i*2];
                    }

                }else if (header["type"] === "mandalaBorder"){
                    const floatBuffer = body.slice(0,body.length);
                    const int64Array = new Int32Array(floatBuffer.buffer, floatBuffer.byteOffset, floatBuffer.byteLength/4);
                    this.mandalaBorderIdx = new Int32Array(int64Array.length/2);
                    for (let i = 0; i < int64Array.length/2; i++) {
                        this.mandalaBorderIdx[i] = int64Array[i*2];
                    }
                }else if (header["type"] === "eyelidBlendshape"){
                    const floatBuffer = body.slice(0,body.length);
                    this.blinkBlendshape = new Float32Array(floatBuffer.buffer, floatBuffer.byteOffset, floatBuffer.byteLength/4);


                }
            }

            if (header["type"] === "Delimiter"){
                const text = new TextDecoder('utf-8').decode(body);
                const jsonObject = JSON.parse(text);
                isFirstFlexatar = false;
                delimiterName = jsonObject["type"]
            }
            if (delimiterName === "mouth"){
                if (header["type"] === "mandalaTexture"){
                    const imgPromise = new Promise((resolve, reject) => {
                    const blob = new Blob([body], { type: 'image/png' });
                    const url = URL.createObjectURL(blob);
                    const img = new Image();

                    img.onload = () => resolve([img,url]);
                    img.src = url;
                    });
                    this.mandalaMouthTexturesPromise.push(imgPromise);
                } else if (header["type"] === "mouthData"){
                    const mouthData = unpackMouthDataDict(body);
                    const bshpMouth = mouthData["marker_list"];
                    const perBshVtxCount = bshpMouth.length/2/5;
                    const bshp = [];
                    for (let i = 0; i < 5; i++) {
                        bshp.push(new Float32Array(perBshVtxCount * 2));
                        for (let j = 0; j < perBshVtxCount; j++) {
                            for (let k = 0; k < 2; k++) {
                                const positionInRepack = k + j * 2 ;
                                bshp[i][positionInRepack] = accessByShape(bshpMouth,[-1,5,2],[j,i,k]);
                            }
                        }
                    }

                    this.mouthBlendshapes = bshp;
                    this.mouthUV = mouthData["uv"];
                    this.mouthIdx = mouthData["index"];
                    const lipAnchorsFlat = mouthData["lip_anchors"];

                    const lipAnchors = [];
                    for (let i = 0; i < 5; i++) {
                        const perBshp = [];
                        lipAnchors.push(perBshp)
                        for (let j = 0; j < 2; j++) {
                            const perPivot = [];
                            perBshp.push(perPivot)
                            for (let k = 0; k < 2; k++) {
                                perPivot.push(accessByShape(lipAnchorsFlat,[-1,2,2],[i,j,k]));
                            }
                        }
                    }
                    this.lipAnchors = lipAnchors;

                    this.lipSize = mouthData["lip_size"]
                    this.teethGap = [1-mouthData["teeth_gap"][1],1 - (mouthData["teeth_gap"][1]+mouthData["teeth_gap"][3])];


                }else if (header["type"] === "FlxInfo"){
                    const text = new TextDecoder('utf-8').decode(body);
                    const fi = JSON.parse(text);
                    const yRatio =  fi["camFovX"]/fi["camFovY"]*fi["bbox"][3]/fi["bbox"][2];
                    this.mouthRatio = 1.0/yRatio;
                }
            }
        }
    }

    dataLoaded(){

        this.mandalaTriangles = [];
        for (let i = 0; i < this.mandalaFaces.length/3; i++) {
            const triangle = [];
            this.mandalaTriangles.push(triangle);
            for (let j = 0; j < 3; j++) {
                const arrayIndex = j + i * 3;
                const checkpointIdx = this.mandalaFaces[arrayIndex];
                triangle.push([this.mandalaCheckpoints[checkpointIdx * 2],this.mandalaCheckpoints[checkpointIdx * 2+1]]);
            }

        }

        this.mandalaBorder = [];
        for (let i = 0; i < this.mandalaBorderIdx.length-1; i++) {
            const i1 = this.mandalaBorderIdx[i];
            const i2 = this.mandalaBorderIdx[i+1];
            const cp = this.mandalaCheckpoints;
            this.mandalaBorder.push([[cp[i1 * 2],cp[i1 * 2 +1]],[cp[i2 * 2],cp[i2 * 2 +1]]]);
        }
        const i1 = this.mandalaBorderIdx[this.mandalaBorderIdx.length-1];
        const i2 = this.mandalaBorderIdx[0];
        const cp = this.mandalaCheckpoints;
        this.mandalaBorder.push([[cp[i1 * 2],cp[i1 * 2 +1]],[cp[i2 * 2],cp[i2 * 2 +1]]]);

        this.isReady = true
        if (this.readyCallback) {
            this.readyCallback();
        }

    }
    async awaitResources() {
        if (this.isReady) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          this.readyCallback = resolve;
        });
    }
    makeInterUnit(point){
        const [bshpIdx,weights,rot] = makeInterUnit(point,this.mandalaTriangles,this.mandalaFaces,this.mandalaBorder);
        const headCtrl = new Float32Array([0,0,0,0,0]);
        headCtrl[bshpIdx[0]] = weights[0];
        headCtrl[bshpIdx[1]] = weights[1];
        headCtrl[bshpIdx[2]] = weights[2];
        const xScale = Math.abs(rot[0])/0.5;
        const yScale = Math.abs(rot[1])/0.5;
        const extForce = 0.5;
        const xRot = -0.3 * extForce*(1.0+yScale)*rot[0];
        const yRot = -0.5 * extForce*(1.0+xScale)*rot[1];

        return [headCtrl,[xRot,yRot]];

    }

}



class RenderEngine{
    constructor(canvas,gl,flexatarCustom,flexatarUnit){

    this.flexatarUnit = flexatarUnit;
    this.headCtrl = new Float32Array([1.0,0,0,0,0]);
    this.extraRot = [0.0,0.0];
    this.position = [0,0,0,0,0,0];
    this.speechState = [0.0,0.0,0.1,0.0,0];
    const [spBuff0,spBuff1,spBuff2] = flexatarCustom.speechBshp;
    this.spGpuBuff0 = new VtxBuffer(gl,spBuff0);
    this.spGpuBuff1 = new VtxBuffer(gl,spBuff1);
    this.spGpuBuff2 = new VtxBuffer(gl,spBuff2);
    this.eyebrowGpuBuff = new VtxBuffer(gl,flexatarCustom.eyebrowBshp);
    this.blinkGpuBuff = new VtxBuffer(gl,flexatarUnit.blinkBlendshape);
    this.flxScale = 5.0;


        /*================ Shaders Mouth Pipline====================*/
         var vertCode =
           'attribute vec2 bshp0;' +
           'attribute vec2 bshp1;' +
           'attribute vec2 bshp2;' +
           'attribute vec2 bshp3;' +
           'attribute vec2 bshp4;' +

           'attribute vec2 coordinates;' +
           'varying highp vec2 uv;' +

           'uniform vec4 parSet0;' +
           'uniform vec4 parSet1;' +
           'uniform vec4 parSet2;' +
           'uniform vec4 parSet3;' +
           'uniform mat4 zRotMatrix;' +

           'void main(void) {' +

              ' vec2 bshp[5];' +
              ' bshp[0] = bshp0;' +
              ' bshp[1] = bshp1;' +
              ' bshp[2] = bshp2;' +
              ' bshp[3] = bshp3;' +
              ' bshp[4] = bshp4;' +
              ' float weights[5];' +
              ' weights[0] = parSet0.x;' +
              ' weights[1] = parSet0.y;' +
              ' weights[2] = parSet0.z;' +
              ' weights[3] = parSet0.w;' +
              ' weights[4] = parSet1.x;' +
              ' float screenRatio = parSet1.y;' +
              ' float px = parSet1.z;' +
              ' float py = parSet1.w;' +
              ' float topPivX = parSet2.x;' +
              ' float topPivY = parSet2.y;' +
              ' float mouthRatio = parSet3.x;' +
              ' float mouthScale = parSet3.y;' +


              ' vec2 result = vec2(0);' +
              ' for (int i = 0; i < 5; i++) {' +
              '     result += weights[i]*bshp[i];' +
              ' }' +
              ' result.x -= topPivX;' +
              ' result.y -= topPivY;' +



              ' result *= -1.0;' +
              ' result.y *= mouthRatio;' +
              ' result *= mouthScale;' +
              ' result = (zRotMatrix*vec4(result,0.0,1.0)).xy;' +
                ' result.y *= screenRatio;' +
              ' result += vec2(px,py);' +


              ' uv = coordinates;' +
              ' uv.y = 1.0 - uv.y;' +
              ' gl_Position = vec4(result,0.0,1.0);' +
           '}';
        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vertCode);
        gl.compileShader(vertShader);
        var fragCode =
           'varying highp vec2 uv;' +
           'uniform sampler2D uSampler[5];' +
           'uniform highp vec4 parSet0;' +
           'uniform highp vec4 parSet1;' +
           'uniform highp vec4 parSet3;' +
           'uniform int isTop;' +
           'void main(void) {' +
              ' highp float weights[5];' +
              ' weights[0] = parSet0.x;' +
              ' weights[1] = parSet0.y;' +
              ' weights[2] = parSet0.z;' +
              ' weights[3] = parSet0.w;' +
              ' weights[4] = parSet1.x;' +
              ' highp float teethTopKeyPointY = parSet3.z;' +
              ' highp float teethBotKeyPointY = parSet3.w;' +
              ' highp vec4 result = vec4(0);' +
              ' for (int i = 0; i < 5; i++) {' +
              '     result += weights[i]*texture2D(uSampler[i], uv).bgra;' +
              ' }' +

              ' if (isTop == 1) {' +
                ' if (uv.y<teethTopKeyPointY) {result.a = 0.0;}' +
              ' }else{' +
                ' if (uv.y>teethBotKeyPointY) {' +
                    ' result.xyz *= uv.y/(teethBotKeyPointY - teethTopKeyPointY)  - teethTopKeyPointY/(teethBotKeyPointY - teethTopKeyPointY) ;' +
                ' }' +
              ' }' +
              ' highp float xDarken = pow(cos((uv.x-0.5)*3.14),3.0);' +
              ' result.xyz*=xDarken;' +
              ' gl_FragColor = result;' +
           '}';

        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragShader, fragCode);
        gl.compileShader(fragShader);
        var shaderProgramMouth = gl.createProgram();
        gl.attachShader(shaderProgramMouth, vertShader);
        gl.attachShader(shaderProgramMouth, fragShader);
        gl.linkProgram(shaderProgramMouth);
        this.mouthProgram = shaderProgramMouth
        /*================ Shaders Head Pipline====================*/

        var vertCode =
           'attribute vec4 bshp0;' +
           'attribute vec4 bshp1;' +
           'attribute vec4 bshp2;' +
           'attribute vec4 bshp3;' +
           'attribute vec4 bshp4;' +

           'attribute vec4 speechBuff0;' +
           'attribute vec4 speechBuff1;' +
           'attribute vec4 speechBuff2;' +

           'attribute vec2 eyebrowBshp;' +
           'attribute vec2 blinkBshp;' +
           'attribute vec2 coordinates;' +


           'varying highp vec2 uv;' +
           'uniform vec4 parSet0;' +
           'uniform vec4 parSet1;' +
           'uniform vec4 parSet2;' +
           'uniform vec4 parSet3;' +
           'uniform mat4 vmMatrix;' +
           'uniform mat4 zRotMatrix;' +
           'uniform mat4 extraRotMatrix;' +

           'void main(void) {' +
              ' vec2 speechBshp[5];' +
              ' speechBshp[0] = speechBuff0.xy;' +
              ' speechBshp[1] = speechBuff0.zw;' +
              ' speechBshp[2] = speechBuff1.xy;' +
              ' speechBshp[3] = speechBuff1.zw;' +
              ' speechBshp[4] = speechBuff2.xy;' +

              ' vec4 bshp[5];' +
              ' bshp[0] = bshp0;' +
              ' bshp[1] = bshp1;' +
              ' bshp[2] = bshp2;' +
              ' bshp[3] = bshp3;' +
              ' bshp[4] = bshp4;' +
              ' float weights[5];' +
              ' weights[0] = parSet0.x;' +
              ' weights[1] = parSet0.y;' +
              ' weights[2] = parSet0.z;' +
              ' weights[3] = parSet0.w;' +
              ' weights[4] = parSet1.x;' +
              ' float screenRatio = parSet1.y;' +
              ' float xPos = parSet1.z;' +
              ' float yPos = parSet1.w;' +
              ' float scale = parSet2.x;' +

              ' float speechWeights[5];' +
              ' speechWeights[0] = parSet2.y;' +
              ' speechWeights[1] = parSet2.z;' +
              ' speechWeights[2] = parSet2.w;' +
              ' speechWeights[3] = parSet3.x;' +
              ' speechWeights[4] = parSet3.y;' +
              ' float eyebrowWeight = parSet3.z;' +
              ' float blinkWeight = parSet3.w;' +


              ' vec4 result = vec4(0);' +
              ' for (int i = 0; i < 5; i++) {' +
              '     result += weights[i]*bshp[i];' +
              ' }' +
               ' for (int i = 0; i < 5; i++) {' +
              '     result.xy += speechWeights[i]*speechBshp[i];' +
              ' }' +
              ' result.xy += eyebrowBshp*eyebrowWeight;' +
              ' result.xy += blinkBshp*blinkWeight;' +

              ' result = extraRotMatrix*result;' +
              ' result = vmMatrix*result;' +
              ' result.x = atan(result.x/result.z)*5.0;' +
              ' result.y = atan(result.y/result.z)*5.0;' +
              ' result.z = (1.0 - result.z)*0.01 +0.21;' +


              ' result.y -= 4.0;' +
              ' result = zRotMatrix*result;' +
              ' result.y += 4.0;' +

              ' result.x += xPos;' +
              ' result.y -= yPos;' +
              ' result.xy *= 1.0+scale;' +
              ' result.y *= -screenRatio;' +

              ' uv = (coordinates*vec2(1.0,-1.0) + vec2(1.0,1.0))*vec2(0.5,0.5);' +
              ' gl_Position = result;' +
           '}';

        var vertShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertShader, vertCode);
        gl.compileShader(vertShader);
        var fragCode =
           'varying highp vec2 uv;' +
           'uniform sampler2D uSampler[5];' +
           'uniform highp vec4 parSet0;' +
           'uniform highp vec4 parSet1;' +
           'void main(void) {' +
              ' highp float weights[5];' +
              ' weights[0] = parSet0.x;' +
              ' weights[1] = parSet0.y;' +
              ' weights[2] = parSet0.z;' +
              ' weights[3] = parSet0.w;' +
              ' weights[4] = parSet1.x;' +
              ' highp vec4 result = vec4(0);' +
              ' for (int i = 0; i < 5; i++) {' +
              '     result += weights[i]*texture2D(uSampler[i], uv).bgra;' +
              ' }' +
              ' gl_FragColor = result;' +

           '}';


        var fragShader = gl.createShader(gl.FRAGMENT_SHADER);

        gl.shaderSource(fragShader, fragCode);

        gl.compileShader(fragShader);
        var shaderProgram = gl.createProgram();
        gl.attachShader(shaderProgram, vertShader);
        gl.attachShader(shaderProgram, fragShader);
        gl.linkProgram(shaderProgram);
        gl.useProgram(shaderProgram);
        this.headProgram = shaderProgram
        /*======= Associating shaders to buffer objects =======*/

        this.blinkGpuBuff.makeLocation(shaderProgram, "blinkBshp",2);
        this.eyebrowGpuBuff.makeLocation(shaderProgram, "eyebrowBshp",2);

        this.spGpuBuff0.makeLocation(shaderProgram, "speechBuff0",4);
        this.spGpuBuff1.makeLocation(shaderProgram, "speechBuff1",4);
        this.spGpuBuff2.makeLocation(shaderProgram, "speechBuff2",4);


//        flexatarCustom.uvGlBuffer.makeLocation(shaderProgram, "coordinates",2);
        this.uvGlBufferHead = new VtxBuffer(gl,flexatarCustom.uvGlBuffer);
        this.uvGlBufferHead.makeLocation(shaderProgram, "coordinates",2);
        this.idxGlBufferHead = new IdxBuffer(gl,flexatarCustom.idxGlBuffer);

        const mandalaGLTexturesHead = []
        for (const image of flexatarUnit.mandalaTextures) {
            mandalaGLTexturesHead.push(new Texture(gl,image));
        }
        this.mandalaTextureArrayHead = new TextureArray(mandalaGLTexturesHead,gl);
        this.mandalaTextureArrayHead.makeLocation(shaderProgram,"uSampler");

        this.headMandalaBshpGLBuffers = []
        for (let i = 0; i < 5; i++) {
            const headMandalaBshp = flexatarUnit.mandalaGLBshpBuffers[i];
            const headMandalaBshpGLBuffer = new VtxBuffer(gl,headMandalaBshp)
            headMandalaBshpGLBuffer.makeLocation(shaderProgram, "bshp"+i.toString(),4);
            this.headMandalaBshpGLBuffers.push(headMandalaBshpGLBuffer)
        }
        this.parSet0Location = gl.getUniformLocation(shaderProgram, 'parSet0');
        this.parSet1Location = gl.getUniformLocation(shaderProgram, 'parSet1');
        this.parSet2Location = gl.getUniformLocation(shaderProgram, 'parSet2');
        this.parSet3Location = gl.getUniformLocation(shaderProgram, 'parSet3');

        this.flexatarCustom = flexatarCustom;
        this.gl = gl;
        this.canvas = canvas;
        this.ratio = canvas.width/canvas.height;

        const scaleMat = m4.scaling(1,-1,1);
        const viewMat = m4.translation(0,0,-2.5);
        const viewModelMat = m4.multiply(viewMat,scaleMat);

        const vmMatrixLoc = gl.getUniformLocation(shaderProgram, 'vmMatrix');
        gl.uniformMatrix4fv(vmMatrixLoc, false, viewModelMat);

        this.zRotMatrixLoc = gl.getUniformLocation(shaderProgram, 'zRotMatrix');
        this.extraRotMatrixLoc = gl.getUniformLocation(shaderProgram, 'extraRotMatrix');
        this.viewModelMatrix = viewModelMat;

//    ------MOUTH BUFFER CONNECTION BLOCK-----
        const mouthTextures = []
        for (const image of this.flexatarUnit.mandalaMouthTextures){
            mouthTextures.push(new Texture(this.gl,image));
        }
        this.mandalaTextureArrayMouth = new TextureArray(mouthTextures,gl);
        this.mandalaTextureArrayMouth.makeLocation(shaderProgramMouth,"uSampler");

        this.mandalaBshpGlMouth = []
        for (let i = 0; i < 5; i++) {
            const gpuBuff = new VtxBuffer(gl,flexatarUnit.mouthBlendshapes[i]);
            gpuBuff.makeLocation(shaderProgramMouth,"bshp"+i.toString(),2);
            this.mandalaBshpGlMouth.push(gpuBuff);
        }
        this.uvBufferMouth = new VtxBuffer(gl,this.flexatarUnit.mouthUV);
        this.uvBufferMouth.makeLocation(shaderProgramMouth,"coordinates",2);

        this.idxGlBufferMouth = new IdxBuffer(this.gl,this.flexatarUnit.mouthIdx);

        this.parSet0MouthLocation = gl.getUniformLocation(shaderProgramMouth, 'parSet0');
        this.parSet1MouthLocation = gl.getUniformLocation(shaderProgramMouth, 'parSet1');
        this.parSet2MouthLocation = gl.getUniformLocation(shaderProgramMouth, 'parSet2');
        this.parSet3MouthLocation = gl.getUniformLocation(shaderProgramMouth, 'parSet3');
        this.isTopLocation = gl.getUniformLocation(shaderProgramMouth, 'isTop');
        this.zRotMatrixLocMouth = gl.getUniformLocation(shaderProgramMouth, 'zRotMatrix');

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    }
    render(){
        if (this.headCtrl != null){
            const hc = this.headCtrl;
            const gl = this.gl;
            const canvas = this.canvas;
            gl.clearColor(0.0, 0.0, 0.0, 1.0);

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.viewport(0,0,canvas.width,canvas.height);
//            this.speechState[2] = -0.7

            const parSet0 = new Float32Array([hc[0],hc[1],hc[2],hc[3]]);
            const parSet1 = new Float32Array([hc[4],this.ratio,this.position[0],this.position[1]]);
            const parSet2 = new Float32Array([this.position[2],this.speechState[0],this.speechState[1],this.speechState[2]]);
            const parSet3 = new Float32Array([this.speechState[3],this.speechState[4],this.position[4],this.position[5]]);
            const zRotMat = m4.zRotation(-this.position[3]);
            const zRotMatMouth = m4.zRotation(this.position[3]);
            const extraRotMatrix = m4.multiply(m4.yRotation(this.extraRot[0]),m4.xRotation(this.extraRot[1]))

            const keyVtx = this.calcKeyVtx(zRotMat,extraRotMatrix);
            const [topMPivot,botMPivot,lipSize] = this.calcMouthPivot();
            const mouthScale = (keyVtx[5][0]-keyVtx[4][0])/lipSize;


//------------MOUTH RENDER BLOCK------------
            gl.useProgram(this.mouthProgram);

            for (let i = 0; i < 5; i++) {
                this.mandalaBshpGlMouth[i].bind();
            }
            this.mandalaTextureArrayMouth.bind(0);
            this.uvBufferMouth.bind();
            this.idxGlBufferMouth.bind();
            const parSet1M = new Float32Array([hc[4],this.ratio,keyVtx[3][0],keyVtx[2][1]]);


            const parSet2Mouth = new Float32Array([topMPivot[0],botMPivot[1],botMPivot[0],botMPivot[1]]);
            const parSet3Mouth = new Float32Array([this.flexatarUnit.mouthRatio,mouthScale,this.flexatarUnit.teethGap[0],this.flexatarUnit.teethGap[1]]);

            gl.uniform4fv(this.parSet0MouthLocation, parSet0);
            gl.uniform4fv(this.parSet1MouthLocation, parSet1M);
            gl.uniform4fv(this.parSet2MouthLocation, parSet2Mouth);
            gl.uniform4fv(this.parSet3MouthLocation, parSet3Mouth);

            gl.uniformMatrix4fv(this.zRotMatrixLocMouth, false, zRotMatMouth);

            gl.uniform1i(this.isTopLocation, 0);
            gl.drawElements(gl.TRIANGLES, this.idxGlBufferMouth.length, gl.UNSIGNED_SHORT,0);

            const parSet2MouthTop = new Float32Array([topMPivot[0],topMPivot[1],botMPivot[0],botMPivot[1]]);
            const parSet1MTop = new Float32Array([hc[4],this.ratio,keyVtx[1][0],keyVtx[0][1]]);
            gl.uniform4fv(this.parSet1MouthLocation, parSet1MTop);
            gl.uniform4fv(this.parSet2MouthLocation, parSet2MouthTop);
            gl.uniform1i(this.isTopLocation, 1);
            gl.drawElements(gl.TRIANGLES, this.idxGlBufferMouth.length, gl.UNSIGNED_SHORT,0);
//            ----HEAD RENDER BLOCK-----
            gl.useProgram(this.headProgram);
            this.spGpuBuff0.bind();
            this.spGpuBuff1.bind();
            this.spGpuBuff2.bind();
            this.eyebrowGpuBuff.bind();
            this.blinkGpuBuff.bind();
            for (let i = 0; i < 5; i++) {
                this.headMandalaBshpGLBuffers[i].bind();
            }
            this.uvGlBufferHead.bind();
            this.idxGlBufferHead.bind();

            this.mandalaTextureArrayHead.bind(0);

            gl.uniform4fv(this.parSet0Location, parSet0);
            gl.uniform4fv(this.parSet1Location, parSet1);
            gl.uniform4fv(this.parSet2Location, parSet2);
            gl.uniform4fv(this.parSet3Location, parSet3);

            gl.uniformMatrix4fv(this.zRotMatrixLoc, false, zRotMat);
            gl.uniformMatrix4fv(this.extraRotMatrixLoc, false, extraRotMatrix);

            gl.drawElements(gl.TRIANGLES, this.flexatarCustom.idxGlBuffer.length, gl.UNSIGNED_SHORT,0);



        }

    }
    calcMouthPivot(){

        const la = this.flexatarUnit.lipAnchors;
        const hc = this.headCtrl;
        var topPivot = [0,0];
        var botPivot = [0,0];
        var lipSize = 0
        for (let i = 0; i < 5; i++) {

            topPivot = v2.add(v2.mulScalar(la[i][0],hc[i]),topPivot);
            botPivot = v2.add(v2.mulScalar(la[i][1],hc[i]),botPivot);
            lipSize += hc[i] * this.flexatarUnit.lipSize[i];
        }

        return [topPivot,botPivot,lipSize];

    }
    calcKeyVtx(zRotMatrix,extraRotMatrix){

        const hc = this.headCtrl;
        const p = this.position;
        const calculatedVtx = [];


        var cntr = 0;
        for (const vtxBshpList of this.flexatarUnit.keyVtx){
            var vtx = [0,0,0,0];
            for (let i = 0; i < 5; i++) {
                vtx = v4.add(v4.mulScalar(vtxBshpList[i],hc[i]),vtx);
            }
            if (cntr == 2){
                var speechBshp = 0;
                for (let i = 0; i < 5; i++) {
                    speechBshp += 0.7 *this.speechState[i]*this.flexatarCustom.speechBshpChoosenIdx[0][i][1];
                }
                vtx[1]+=speechBshp;
            }

            vtx = m4.multiplyByV4(extraRotMatrix,vtx);
            vtx = m4.multiplyByV4(this.viewModelMatrix,vtx);

            vtx[0] = this.flxScale * Math.atan(vtx[0]/vtx[2]);
            vtx[1] = this.flxScale * Math.atan(vtx[1]/vtx[2]);

            vtx[1] -= 4;
            vtx = m4.multiplyByV4(zRotMatrix,vtx);
            vtx[1] += 4;
            vtx[0] += p[0];
            vtx[1] -= p[1];
            vtx[0] *= 1 + p[2];
            vtx[1] *= 1 + p[2];
            vtx[1] *= -this.ratio;
            calculatedVtx.push(vtx);
            cntr += 1;

        }
        return calculatedVtx;
    }

}

let flexatarCommon;
async function loadCommonData(){
    flexatarCommon = new FlexatarCommonData("https://raw.githubusercontent.com/dmisol/flexatar-virtual-webcam/main/raw/flx_static.p");
//    flexatarCommon = new FlexatarCommonData("/file/flexatars/static.p");
}
loadCommonData();

async function makeFlexatar(canvas,url){

    await flexatarCommon.awaitResources();
//    console.log("makeFlexatar")
    const flexatar = new FlexatarUnit(url,flexatarCommon);
    await flexatar.awaitResources();
    const gl = canvas.getContext('experimental-webgl');
    const rEngine = new RenderEngine(canvas,gl,flexatarCommon,flexatar);
    function renderLoop(){
        rEngine.render();
        requestAnimationFrame(renderLoop);


    }
    renderLoop();
    var animFrameCounter = 0;
    function animationTimer(){
        animFrameCounter += 1;

        const animationFrame = flexatarCommon.getAnimationFrame(animFrameCounter);
//        const rx = (animationFrame[3]-0.5)*4.0+0.5;
//        const ry = (animationFrame[4]-0.45)*4.0 +0.45;
        const rx = animationFrame[3];
        const ry = animationFrame[4];
        const interU = flexatar.makeInterUnit([rx,ry]);
        rEngine.headCtrl = interU[0];
        rEngine.extraRot = interU[1];
        rEngine.position = [animationFrame[0],animationFrame[1],animationFrame[2],animationFrame[5],animationFrame[6],animationFrame[8]];
    }
    const timerId = setInterval(animationTimer, 1000/30);
    return rEngine;

}




const speechNN = new SpeechNN();
const animCalc = new AnimCalc(speechNN);


function combineStreams(videoStream, audioStream) {
    var combinedStream = new MediaStream();
    var videoTrack = videoStream.getVideoTracks()[0];
    combinedStream.addTrack(videoTrack);
    var audioTrack = audioStream.getAudioTracks()[0];
    combinedStream.addTrack(audioTrack);
    return combinedStream;
  }

function connectFlexatarToCanvas(flxCanvas,flexatarData,micSrc,audioContext){
    

    // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    audioContext.audioWorklet.addModule("https://cdn.jsdelivr.net/gh/dmisol/flexatar-virtual-webcam/jslib/audio_processor.min.js").then(() => {
        // audioContext.audioWorklet.addModule("js/audio_processor.js").then(() => {

        makeFlexatar(flxCanvas,flexatarData).then(eng => {
            processorNode = new AudioWorkletNode(audioContext,"my-audio-processor",);
            micSrc.connect(processorNode);
            processorNode.port.postMessage(true);
            processorNode.port.onmessage = (event) => {
                if (event.data){
                    const speechState = animCalc.getAnim(event.data)
                    eng.speechState = speechState;
                
                }
            }
        });
        
    });
    

}
function flexatarVirtualCameraStream(flexatarLink,width,height,audioStream){
    const flxCanvas = document.createElement("canvas");
    flxCanvas.width = width;
    flxCanvas.height = height;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var delayNode = audioContext.createDelay(1);
    delayNode.delayTime.value = 0.5;
    micSrc = audioContext.createMediaStreamSource(audioStream);

    fetch(flexatarLink)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.arrayBuffer();
        })
        .then(flexatarData => {
            connectFlexatarToCanvas(flxCanvas,flexatarData,micSrc,audioContext)
        })
        .catch((err) => {
            console.error(`The following getUserMedia error occurred: ${err}`);
        });
    
    micSrc.connect(delayNode);
    const flxAudioStreamSource = audioContext.createMediaStreamDestination();
    delayNode.connect(flxAudioStreamSource);
    
    const flxStreamAudio = flxAudioStreamSource.stream;

    const flxStreamVideo = flxCanvas.captureStream();
    return combineStreams(flxStreamVideo,flxStreamAudio);

}