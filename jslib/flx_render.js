// const nnWorkerUrl = "/js/service_worker.js"
// const audioProcessorUrl = "/js/audio_processor.js"
const nnWorkerUrl = "https://cdn.jsdelivr.net/gh/dmisol/flexatar-virtual-webcam@latest/jslib/service_worker.js"
const audioProcessorUrl = "https://cdn.jsdelivr.net/gh/dmisol/flexatar-virtual-webcam@latest/jslib//audio_processor.js"


var v2 = {
    mulScalar: function(v, s) {
        return [v[0]*s,v[1]*s];
    },
    add: function(v1, v2) {
        return [v1[0]+v2[0],v1[1]+v2[1]];
    }
}
var v3 = {
    mulScalar: function(v, s) {
        return [v[0]*s,v[1]*s,v[2]*s];
    },
    add: function(v1, v2) {
        return [v1[0]+v2[0],v1[1]+v2[1],v1[2]+v2[2]];
    },
    cross:function(a, b) {
        if (a.length !== 3 || b.length !== 3) {
            throw new Error("Input vectors must have three components each.");
        }
    
        const ax = a[0], ay = a[1], az = a[2];
        const bx = b[0], by = b[1], bz = b[2];
    
        const cx = ay * bz - az * by;
        const cy = az * bx - ax * bz;
        const cz = ax * by - ay * bx;
    
        return [cx, cy, cz];
    },
    dot:function(a, b) {
        if (a.length !== 3 || b.length !== 3) {
            throw new Error("Input vectors must have three components each.");
        }
    
        const ax = a[0], ay = a[1], az = a[2];
        const bx = b[0], by = b[1], bz = b[2];
    
        return ax * bx + ay * by + az * bz;
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


    const littleEndian = true
    const left =  data.getUint32(0, littleEndian);
    const right = data.getUint32(4, littleEndian);

    const combined = littleEndian? left + 2**32*right : 2**32*left + right;
    return combined;
}

function unpackPreviewImage(data){
    var offset = 0;
    const fullLength = data.length;

    // const headers = [];
    // const bodies = [];
    var counter = 0
    var previewFound = false;
    while (true){
        const headerView = new DataView(data.buffer, data.byteOffset+offset, 8);
        const dataLength = unpackLengthHeader(headerView);
        offset += 8;
        const bodyUint8Array = new Uint8Array(data.buffer, data.byteOffset + offset, dataLength);
        offset += dataLength;
        if (counter%2 == 0){
            const text = new TextDecoder('utf-8').decode(bodyUint8Array);
            const jsonObject = JSON.parse(text);
            if (jsonObject["type"] == "PreviewImage") {previewFound = true}
            // headers.push(jsonObject);
        //    console.log(jsonObject);
        }else{
            if (previewFound)
                return bodyUint8Array;
            // bodies.push(bodyUint8Array);
        }
        counter+=1;
        if (offset >= fullLength){
            break;
        }

    }
    return;
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
        //    console.log(jsonObject);
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
        this.gl = gl;
        this.length = int16Array.length;
        this.type = gl.ELEMENT_ARRAY_BUFFER;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.id);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, int16Array, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
    bind(){
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.id);
    }
    destroy(){
        this.gl.deleteBuffer(this.id);
    }
}
class VtxBuffer{

    constructor(gl,floatArray){
        this.gl = gl
        this.id = gl.createBuffer();
        this.type = gl.ARRAY_BUFFER;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
        gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        this.size = null;
        this.location = null;
    }
    reload(floatArray){
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.id);
        gl.bufferData(gl.ARRAY_BUFFER, floatArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
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
    destroy(){
        if (this.id){
            this.gl.deleteBuffer(this.id);
        }
        this.id = null;
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
    this.keyUV = null;
                const uint8Array = new Uint8Array(url);
                const dataDict = unpackToDataDict(uint8Array);
                this.makeGpuBuffers(dataDict);
                this.makeKeyUv()
                this.isReady = true;
                if (this.readyCallback) {
                    this.readyCallback();
                }
    // fetch(url)
    //        .then(response => {
    //             if (!response.ok) {
    //               throw new Error('Network response was not ok');
    //             }
    //             return response.arrayBuffer();
    //         })
    //        .then(arrayBuffer => {
    //             const uint8Array = new Uint8Array(arrayBuffer);
    //             const dataDict = unpackToDataDict(uint8Array);
    //             this.makeGpuBuffers(dataDict);
    //        }) .catch(error => {
    //             console.error('Fetch error:', error);
    //         });
    }
    makeKeyUv(){
        const keyVtxIdx = [50];
        const keyVtx = [];
        for (const idx of keyVtxIdx) {
            const vtx = [this.uvGlBuffer[idx*2],this.uvGlBuffer[idx*2+1]];
            keyVtx.push(vtx);
        }

        this.keyUV = keyVtx;
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
        // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    bind(textureUnit,shaderProgram,samplerName){
        const gl = this.gl;
        const samplerLoc = gl.getUniformLocation(shaderProgram, samplerName);
        gl.activeTexture(gl.TEXTURE0+textureUnit);
        
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(samplerLoc, textureUnit);
    }
    destroy(){
        this.gl.deleteTexture(this.texture);
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
    destroy(){
        this.textureList.forEach(function(tex) {
            tex.destroy();
          });
    }
}

function makeQuadVtxArray(rect,mirror){
    const vtx1_x = mirror*(rect[0][0]*2.0-1.0);
    const vtx1_y = -1.0*(rect[0][1]*2.0-1.0);
    const vtx2_x = mirror*(rect[1][0]*2.0-1.0);
    const vtx2_y = -1.0*(rect[1][1]*2.0-1.0);
    return new Float32Array([ 
        vtx1_x,vtx1_y, 
        vtx1_x,vtx2_y, 
        vtx2_x,vtx1_y, 
        vtx2_x,vtx1_y, 
        vtx1_x,vtx2_y,
        vtx2_x,vtx2_y,
    ]);

}
function makeQuadUVArray(){
    const vtx1_x = 0;
    const vtx1_y = 0;
    const vtx2_x = 1;
    const vtx2_y = 1;
    return new Float32Array([ 
        vtx1_x,vtx1_y, 
        vtx1_x,vtx2_y, 
        vtx2_x,vtx1_y, 
        vtx2_x,vtx1_y, 
        vtx1_x,vtx2_y,
        vtx2_x,vtx2_y,
    ]);

}

class FlexatarFaceUnit{
    constructor(){
        this.mandalaTexturesPromise = []
        this.mandalaTextures = []
        this.mandalaGLBshpBuffers = []
        this.mandalaCheckpoints = null
        this.mandalaFaces = null
        this.mandalaBorderIdx = null
        this.blinkBlendshape = null
        this.keyVtx = null
    }
    addPackagePart(header,body){
        if (header["type"] === "mandalaTextureBlurBkg"){
            const imgPromise = new Promise((resolve, reject) => {
                const blob = new Blob([body], { type: 'image/png' });
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.crossOrigin = "anonymous"
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

        
        }else if (header["type"] === "eyelidBlendshape"){
            const floatBuffer = body.slice(0,body.length);
            this.blinkBlendshape = new Float32Array(floatBuffer.buffer, floatBuffer.byteOffset, floatBuffer.byteLength/4);


        }
    }
    async makeTextures(){
        const images = await Promise.all(this.mandalaTexturesPromise);
        for (const image of images) {
            URL.revokeObjectURL(image[1]);
            this.mandalaTextures.push(image[0])
        }
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
}

class FlexatarMouthUnit{
    static #mouthDefault = null;
    constructor(flexatarCommon){
        this.mandalaMouthTexturesPromise = [];
        this.mandalaMouthTextures = [];
        this.mouthUV = null;
        this.mouthIdx = null;
        this.mouthBlendshapes = null;
        this.lipAnchors = null;
        this.lipSize = null;
        this.teethGap = null;
        this.mouthRatio = null;
        this.flexatarCommon = flexatarCommon;
    }

    addPackagePart(header,body){
        if (header["type"] === "mandalaTexture"){
            const imgPromise = new Promise((resolve, reject) => {
            const blob = new Blob([body], { type: 'image/png' });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.crossOrigin = "anonymous"
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
    loadDefault(){
        if (FlexatarMouthUnit.#mouthDefault == null){
            const mouthBlocks = unpackToBlocks(this.flexatarCommon.mouthDefault);
            for (let i = 0; i < mouthBlocks[0].length; i++) {
                const header = mouthBlocks[0][i];
                const body = mouthBlocks[1][i];
                this.addPackagePart(header,body);
            
            }
            FlexatarMouthUnit.#mouthDefault = this;
        }
        return FlexatarMouthUnit.#mouthDefault;
    }
    async makeTextures(){
        if (this.mandalaMouthTextures.length>0){
            return;
        }
        const imagesMouth = await Promise.all(this.mandalaMouthTexturesPromise);
        for (const image of imagesMouth) {
            URL.revokeObjectURL(image[1]);
            this.mandalaMouthTextures.push(image[0]);
        }
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
        this.mouthPackage = null;
        this.facePackages = {};

        const uint8Array = new Uint8Array(arrayBuffer);
        var blocks = unpackToBlocks(uint8Array);
        this.mouthPackage  = new FlexatarMouthUnit(flexatarCommon)
        if (this.checkIfNeedInsertMouth(blocks)){

            this.mouthPackage  = this.mouthPackage.loadDefault()

        }

        this.makeFlxData(blocks,null);
        this.makeTextures();
        

    }
    async makeTextures(){
       
        for (const [key, value] of Object.entries(this.facePackages)) {
            await value.makeTextures()
            value.makeKeyVertex()
        }
       
        await this.mouthPackage.makeTextures();
        
        this.dataLoaded();
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
        var delimiterName = "exp-neu";
        var currentFaceUnit = new FlexatarFaceUnit()
        this.facePackages[delimiterName] = currentFaceUnit
        for (let i = 0; i < blocks[0].length; i++) {
            const header = blocks[0][i];
            const body = blocks[1][i];
            currentFaceUnit.addPackagePart(header,body)
            if (isFirstFlexatar) {
  
                if (header["type"] === "mandalaCheckpoints"){
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
                }
                
            }

            if (header["type"] === "Delimiter"){
                const text = new TextDecoder('utf-8').decode(body);
                const jsonObject = JSON.parse(text);
                isFirstFlexatar = false;
                delimiterName = jsonObject["type"]
                if (delimiterName.startsWith("exp")){
                    currentFaceUnit = new FlexatarFaceUnit()
                    this.facePackages[delimiterName] = currentFaceUnit

                }
                // console.log("delimiterName",delimiterName)
            }
            if (delimiterName === "mouth"){
                this.mouthPackage.addPackagePart(header,body)
                /*
                if (header["type"] === "mandalaTexture"){
                    const imgPromise = new Promise((resolve, reject) => {
                    const blob = new Blob([body], { type: 'image/png' });
                    const url = URL.createObjectURL(blob);
                    const img = new Image();
                    img.crossOrigin = "anonymous"
                    img.onload = () => resolve([img,url]);
                    img.onerror = () =>{
                        console.log("delimage load error")
                    }
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
                    */
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
        if (this.mouthPackage != null){
            this.mandalaMouthTextures = this.mouthPackage.mandalaMouthTextures
            this.mouthUV = this.mouthPackage.mouthUV
            this.mouthIdx = this.mouthPackage.mouthIdx
            this.mouthBlendshapes = this.mouthPackage.mouthBlendshapes
            this.lipAnchors = this.mouthPackage.lipAnchors
            this.lipSize = this.mouthPackage.lipSize
            this.teethGap = this.mouthPackage.teethGap
            this.mouthRatio = this.mouthPackage.mouthRatio
        }

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
const mouthShaderCode = {
    vert:'attribute vec2 bshp0;' +
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



       
       ' result.y *= -mouthRatio;' +
       ' result *= mouthScale;' +
       ' result = (zRotMatrix*vec4(result,0.0,1.0)).xy;' +
         ' result.y *= screenRatio;' +
       ' result += vec2(px,py);' +


       ' uv = coordinates;' +
       ' uv.y = 1.0 - uv.y;' +
     //   ' uv.x = 1.0 - uv.x;' +
       ' gl_Position = vec4(result,0.0,1.0);' +
    '}',
    frag:
    'varying highp vec2 uv;' +
    'uniform sampler2D uSampler[5];' +
    'uniform highp vec4 parSet0;' +
    'uniform highp vec4 parSet1;' +
    'uniform highp vec4 parSet3;' +
    'uniform highp vec4 parSet4;' +
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
    ' highp float alpha = parSet4.x;' +
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
    
    
    ' result.a *= alpha;' +
    ' gl_FragColor = result;' +
    
    '}'
};

const mouthMixShaderCode = {
    vert:
    'attribute vec2 bshp0;' +
    'attribute vec2 bshp1;' +
    'attribute vec2 bshp2;' +
    'attribute vec2 bshp3;' +
    'attribute vec2 bshp4;' +

    'attribute vec2 bshp0o;' +
    'attribute vec2 bshp1o;' +
    'attribute vec2 bshp2o;' +
    'attribute vec2 bshp3o;' +
    'attribute vec2 bshp4o;' +

    'attribute vec2 coordinates;' +


    'varying highp vec2 uv;' +

    'uniform vec4 parSet0;' +
    'uniform vec4 parSet1;' +
    'uniform vec4 parSet2;' +
    'uniform vec4 parSet3;' +
    'uniform mat4 zRotMatrix;' +
    'uniform float mixWeight;' +

    'void main(void) {' +

       ' vec2 bshp[5];' +
       ' bshp[0] = bshp0;' +
       ' bshp[1] = bshp1;' +
       ' bshp[2] = bshp2;' +
       ' bshp[3] = bshp3;' +
       ' bshp[4] = bshp4;' +

       ' vec2 bshp1[5];' +
       ' bshp1[0] = bshp0o;' +
       ' bshp1[1] = bshp1o;' +
       ' bshp1[2] = bshp2o;' +
       ' bshp1[3] = bshp3o;' +
       ' bshp1[4] = bshp4o;' +
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
       '     result += weights[i]*bshp[i]*mixWeight + weights[i]*bshp1[i]*(1.0-mixWeight);' +
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
    '}',
    frag:
    'varying highp vec2 uv;' +
    'uniform sampler2D uSampler[5];' +
    'uniform sampler2D uSampler1[5];' +
    'uniform highp vec4 parSet0;' +
    'uniform highp vec4 parSet1;' +
    'uniform highp vec4 parSet3;' +
    'uniform int isTop;' +
    'uniform highp float mixWeight;' +
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
    '     result += weights[i]*texture2D(uSampler[i], uv).bgra * mixWeight + weights[i]*texture2D(uSampler1[i], uv).bgra * (1.0 - mixWeight);' +
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
    '}'
};

const headShaderCode = {
    vert:'attribute vec4 bshp0;' +
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
       ' result.z = 0.5;' +


       ' result.y -= 4.0;' +
       ' result = zRotMatrix*result;' +
       ' result.y += 4.0;' +

       ' result.x += xPos;' +
       ' result.y -= yPos;' +
       ' result.xy *= 0.8+scale;' +
       ' result.y *= -screenRatio;' +
       ' result.x *= -1.0;' +
      


       ' uv = (coordinates*vec2(1.0,-1.0) + vec2(1.0,1.0))*vec2(0.5,0.5);' +
       ' gl_Position = result;' +
    '}',
    frag:
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

    '}',
};
const headMixShaderCode = {
    vert:
    'attribute vec4 bshp0;' +
    'attribute vec4 bshp1;' +
    'attribute vec4 bshp2;' +
    'attribute vec4 bshp3;' +
    'attribute vec4 bshp4;' +

    'attribute vec4 bshp0o;' +
    'attribute vec4 bshp1o;' +
    'attribute vec4 bshp2o;' +
    'attribute vec4 bshp3o;' +
    'attribute vec4 bshp4o;' +

    'attribute vec4 speechBuff0;' +
    'attribute vec4 speechBuff1;' +
    'attribute vec4 speechBuff2;' +

    'attribute vec2 eyebrowBshp;' +
    'attribute vec2 blinkBshp;' +
    'attribute vec2 coordinates;' +


    'varying highp vec2 uv;' +
    'varying highp float wHybrid;' +
    'uniform vec4 parSet0;' +
    'uniform vec4 parSet1;' +
    'uniform vec4 parSet2;' +
    'uniform vec4 parSet3;' +
    'uniform mat4 vmMatrix;' +
    'uniform mat4 zRotMatrix;' +
    'uniform mat4 extraRotMatrix;' +
    'uniform float mixWeight;' +
    'uniform int effectId;' +

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

       ' vec4 bshp1[5];' +
       ' bshp1[0] = bshp0o;' +
       ' bshp1[1] = bshp1o;' +
       ' bshp1[2] = bshp2o;' +
       ' bshp1[3] = bshp3o;' +
       ' bshp1[4] = bshp4o;' +


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
       ' if (effectId == 0) {' +
       
       '    for (int i = 0; i < 5; i++) {' +
       '        result += weights[i]*bshp[i]*mixWeight + weights[i]*bshp1[i]*(1.0-mixWeight);' +
       '    }' +
       ' }else{' +
       
       '    float theta = mixWeight*6.28;'+
       '    vec3 linePoint = vec3(sin(theta),cos(theta),1.0);'+
       '    vec3 curPoint = vec3(coordinates+vec2(0.0,-0.15),1.0);'+
       '    float s = dot(cross(linePoint,curPoint),vec3(0.0,0.0,1.0));'+
       '    float w = clamp(s/0.15,-1.0,1.0);'+
       '    w+=1.0;'+
       '    w/=2.0;'+
       '    float weightHybrid = w; wHybrid = w;'+
      
       '    for (int i = 0; i < 5; i++) {' +
       '        result += weights[i]*bshp[i]*weightHybrid + weights[i]*bshp1[i]*(1.0-weightHybrid);' +
       '    }' +

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
       ' result.xy *= 0.8+scale;' +
       ' result.y *= -screenRatio;' +
       ' result.x *= -1.0;' +

       ' uv = (coordinates*vec2(1.0,-1.0) + vec2(1.0,1.0))*vec2(0.5,0.5);' +
       ' gl_Position = result;' +
    '}',
    frag:
    'varying highp vec2 uv;' +
    'varying highp float wHybrid;' +
    'uniform sampler2D uSampler[5];' +
    'uniform sampler2D uSampler1[5];' +
    'uniform highp vec4 parSet0;' +
    'uniform highp vec4 parSet1;' +
    'uniform highp float mixWeight;' +
    'uniform highp int effectId;' +
    'void main(void) {' +
       ' highp float weights[5];' +
       ' weights[0] = parSet0.x;' +
       ' weights[1] = parSet0.y;' +
       ' weights[2] = parSet0.z;' +
       ' weights[3] = parSet0.w;' +
       ' weights[4] = parSet1.x;' +
       ' highp vec4 result = vec4(0);' +
       ' if (effectId == 0) {' +
       '    for (int i = 0; i < 5; i++) {' +
       '        result += weights[i]*texture2D(uSampler[i], uv).bgra * mixWeight + weights[i]*texture2D(uSampler1[i], uv).bgra * (1.0 - mixWeight);' +
       '    }' +
       ' }else{' +
       '    for (int i = 0; i < 5; i++) {' +
       '        result += weights[i]*texture2D(uSampler[i], uv).bgra * wHybrid + weights[i]*texture2D(uSampler1[i], uv).bgra * (1.0 - wHybrid);' +
       '    }' +
       ' }' +
       ' gl_FragColor = result;' +

    '}',
};

const overlayShaderCode = {
    vert:`
    attribute vec2 vtx; 
    attribute vec2 uv;
    varying highp vec2 UV;
    
    void main(void) { 
         UV=uv;
        gl_Position = vec4(vtx,0.0,1.0); 
    }
    `,
    frag:`
    precision highp float;
    varying highp vec2 UV;
    uniform sampler2D uSampler;
    void main(void) {
        //vec4 result = vec4(UV, 0.0, 1.0);
        vec4 result =  texture2D(uSampler, UV);
        gl_FragColor = result;
    } 
    `
}

class ShaderProgram{
    constructor(gl,shaderCode){
        this.gl = gl;
        this.vertShader = gl.createShader(gl.VERTEX_SHADER);
        
        gl.shaderSource(this.vertShader, shaderCode.vert);
        gl.compileShader(this.vertShader);
        if (!gl.getShaderParameter(this.vertShader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(this.vertShader));
        }
        this.fragShader = gl.createShader(gl.FRAGMENT_SHADER);
        
        gl.shaderSource(this.fragShader, shaderCode.frag);
        gl.compileShader(this.fragShader);
        if (!gl.getShaderParameter(this.fragShader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(this.fragShader));
        }
        this.id = gl.createProgram();
        gl.attachShader(this.id, this.vertShader);
        gl.attachShader(this.id, this.fragShader);
        gl.linkProgram(this.id);
        const linkLog = gl.getProgramInfoLog(this.id);
        if (linkLog)
            console.log(linkLog);
        this.textureArrays = [null,null];
        this.attributes = {};
        this.uniform4fvDict = {};
        this.uniform1iDict = {};
        this.uniform1fDict = {};
        this.uniformMatrix4fvDict = {}
    }
    reset(){
        this.textureArrays[0] = null
        // this.uniform4fvDict = {};
        // this.uniform1iDict = {};
        // this.uniform1fDict = {};
        // this.uniformMatrix4fvDict = {}
    }
    resetSlot1(){
        this.textureArrays[1] = null
       
    }
    use(){
        this.gl.useProgram(this.id);
    }
    attribute(name,buffer,size){
        const location = this.gl.getAttribLocation(this.id, name);
        const attribElement = {location:location,buffer:buffer,size:size}
        // console.log(name);
        // console.log(this.attributes[name]);
        this.attributes[name] = attribElement;
        // console.log(this.attributes[name]);

    }
    textureArray(textureArray,name,textureUnit,slot){
        const location = this.gl.getUniformLocation(this.id, name);
        const textureElement = {location:location,textureArray:textureArray,textureUnit:textureUnit}
        this.textureArrays[slot] = textureElement
    }

    addUniform4fv(name){
        this.uniform4fvDict[name] = this.gl.getUniformLocation(this.id, name);
    }
    uniform4fv(name,value){
        this.gl.uniform4fv(this.uniform4fvDict[name], value);
    }
    addUniform1f(name){
        this.uniform1fDict[name] = this.gl.getUniformLocation(this.id, name);
    }
    uniform1f(name,value){
        this.gl.uniform1f(this.uniform1fDict[name], value);
    }
    addUniform1i(name){
        this.uniform1iDict[name] = this.gl.getUniformLocation(this.id, name);
    }
    uniform1i(name,value){
        this.gl.uniform1i(this.uniform1iDict[name], value);
    }
    addUniformMatrix4fv(name){
        this.uniformMatrix4fvDict[name] = this.gl.getUniformLocation(this.id, name);
    }
    uniformMatrix4fv(name,value){
        this.gl.uniformMatrix4fv(this.uniformMatrix4fvDict[name], false, value);
    }
    bind(){
        const gl = this.gl;
        // var blinkBshpFound=false;
        for (const [key, value] of Object.entries(this.attributes)) {
            // if (key == "blinkBshp"){
            //     blinkBshpFound = true;
            // }
            this.gl.bindBuffer(value.buffer.type, value.buffer.id);
            if (value.size){
                this.gl.vertexAttribPointer(value.location, value.size, this.gl.FLOAT, false, 0, 0);
                this.gl.enableVertexAttribArray(value.location);
            }
        }
        // if (!blinkBshpFound) console.log("blinkBshpNotFound");

        for (const textureElement of this.textureArrays){
            if (!textureElement) continue
            const locations = [];
            for (let i = 0; i < textureElement.textureArray.textureList.length; i++) {
                gl.activeTexture(gl.TEXTURE0+textureElement.textureUnit+i);
                gl.bindTexture(gl.TEXTURE_2D, textureElement.textureArray.textureList[i].texture);
                
                locations.push(textureElement.textureUnit+i)
            }
            gl.uniform1iv(textureElement.location, locations);
            // console.log("bindtexture",locations.length)
        }
    }
    
    destroy(){
        this.gl.deleteShader(this.vertShader);
        this.gl.deleteShader(this.fragShader);
        this.gl.deleteProgram(this.id);
    }

}
class RenderEngine{
    #effectFn = null
    expFn = null
    #startTime = null
    constructor(canvas,gl,flexatarCustom){

        // var maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        // console.log("Max Vertex Attributes: " + maxVertexAttribs);
       
        this.timerId = null;
        // this.flexatarUnit = flexatarUnit;
        this.headCtrl = new Float32Array([1.0,0,0,0,0]);
        this.extraRot = [0.0,0.0];
        this.position = [0,0,0,0,0,0];
        this.speechState = [0.0,0.0,0.1,0.0,0];
       
        this.flxScale = 5.0;
        this.renderIsOn = true;
        this.stopFunction =null;
        this.shaders = [];
        this.flexatarCustom = flexatarCustom;
        this.gl = gl;
        this.canvas = canvas;
        this.vpWidth = canvas.height;
        this.marg = (canvas.width - this.vpWidth)/2;
        this.ratio = this.vpWidth/canvas.height;
        this.heads = {head0:null,head1:null};
        this.flexatarUnits = {head0:null,head1:null};
        this.newHeadBuffers = null;
        this.newHeadFlexatarUnit = null;
        this.headBuffersToDestroy = null;
        this.mixWeight = 1.0;
        this.mouthMixWeight = 1.0;
        this.mixTimer = null;
        this.reloadFuncs = [];
        this.isTransition = false;
        this.nextHead = null;
        this.effectID = 0;
        this.isMix = false;
        this.effectRendering = false;
        this.commitRenderThreadCommands=false;
        this.skipFrame = false;
        this.headCounter = 0;
        
       
        this.blinkGpuBuffer = null;
        const [spBuff0,spBuff1,spBuff2] = flexatarCustom.speechBshp;
        this.spGpuBuff0 = new VtxBuffer(gl,spBuff0);
        this.spGpuBuff1 = new VtxBuffer(gl,spBuff1);
        this.spGpuBuff2 = new VtxBuffer(gl,spBuff2);

        this.eyebrowGpuBuff = new VtxBuffer(gl,flexatarCustom.eyebrowBshp);
        this.uvGlBufferHead = new VtxBuffer(gl,flexatarCustom.uvGlBuffer);
        this.idxGlBufferHead = new IdxBuffer(gl,flexatarCustom.idxGlBuffer);
      
        this.#effectFn = Effect.no().fn
      
        const scaleMat = m4.scaling(1,-1,1);
        const viewMat = m4.translation(0,0,-2.5);
        this.viewModelMatrix = m4.multiply(viewMat,scaleMat);
        
        this.faceProviderExp = null
        this.faceProvider0 = null
        this.mouthProvider0 = null
        this.faceProvider1 = null
        this.mouthProvider1 = null
      
        this.headProgram = new ShaderProgram(gl,headShaderCode);
        this.headProgram.use();
       
        this.headStaticBindings(this.headProgram);
       
        

        this.headMixProgram = new ShaderProgram(gl,headMixShaderCode);
        this.headMixProgram.use();
        this.headMixProgram.addUniform1f('mixWeight');
        this.headMixProgram.addUniform1i('effectId');
        
        
        this.headStaticBindings(this.headMixProgram);
        

//    ------MOUTH BUFFER CONNECTION BLOCK-----
        this.mouthProgram = new ShaderProgram(gl,mouthShaderCode);
        
        this.mouthStaticBindings(this.mouthProgram)

        this.mouthMixProgram = new ShaderProgram(gl,mouthShaderCode);
        
        this.mouthStaticBindings(this.mouthProgram)
        // this.mouthMixProgram.addUniform1f('mixWeight');

        
        // this.setHead(flexatarUnit,"head0");


        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // === Text overlay part ===

        

        /*================ Shaders Overlay Pipline====================*/
       

        this.shaderProgramOverlay = new ShaderProgram(gl,overlayShaderCode);
        this.shaderProgramOverlay.use()
        const ocMeasure = new OffscreenCanvas(1, 1);
        this.contextMeasure = ocMeasure.getContext('2d');
        this.overlays = [];

        const overlayUV = makeQuadUVArray();
        this.overlayUV = new VtxBuffer(gl,overlayUV);

        this.overlayUV.makeLocation(this.shaderProgramOverlay.id,"uv",2);
        this.overlaysImage = [];

        

    }
    mouthStaticBindings(program){
        program.addUniform4fv('parSet0');
        program.addUniform4fv('parSet1');
        program.addUniform4fv('parSet2');
        program.addUniform4fv('parSet3');
        program.addUniform4fv('parSet4');
        program.addUniform1i('isTop');
        program.addUniformMatrix4fv('zRotMatrix');
    }
    headStaticBindings(program){
        program.attribute("eyebrowBshp",this.eyebrowGpuBuff,2);
        program.attribute("speechBuff0",this.spGpuBuff0,4);
        program.attribute("speechBuff1",this.spGpuBuff1,4);
        program.attribute("speechBuff2",this.spGpuBuff2,4);
        program.attribute("coordinates",this.uvGlBufferHead,2);
        program.attribute("index",this.idxGlBufferHead,null);
        
        program.addUniform4fv('parSet0');
        program.addUniform4fv('parSet1');
        program.addUniform4fv('parSet2');
        program.addUniform4fv('parSet3');
        program.addUniformMatrix4fv('zRotMatrix');
        program.addUniformMatrix4fv('extraRotMatrix');
        program.addUniformMatrix4fv('vmMatrix');
        program.uniformMatrix4fv("vmMatrix",this.viewModelMatrix);
    }
    setToSlot(slotIdx,flexatarConnection){
        
        flexatarConnection.then(result => {
            const flexatarUnit = result[0]
            const gpuBuffers = result[1]

            this.headCounter+=1;
           
            if (slotIdx == 0) {
                this.flexatarUnits.head0 = flexatarUnit;
                this.heads.head0 = gpuBuffers;
                this.setupHeads();
            }else{
                this.flexatarUnits.head1 = flexatarUnit;
                this.heads.head1 = gpuBuffers;
                this.setupHead1();
            }
            
        })
        
    }
    
    activateExpressionSlot0(head){
        
        let currentFace = head
        this.headProgram.reset();
        this.headProgram.use();
        
        this.headProgram.attribute("blinkBshp",currentFace.blinkGpuBuffer,2);
        for (let i = 0; i < 5; i++) {
            this.headProgram.attribute("bshp"+i.toString(),currentFace.headMandalaBshpGLBuffers[i],4);
        }
        this.headProgram.textureArray(currentFace.mandalaTextureArrayHead,"uSampler",0,0);

        this.headMixProgram.reset();
        this.headMixProgram.use();

        this.headMixProgram.attribute("blinkBshp",currentFace.blinkGpuBuffer,2);
        for (let i = 0; i < 5; i++) {
            this.headMixProgram.attribute("bshp"+i.toString(),currentFace.headMandalaBshpGLBuffers[i],4);
        }
        this.headMixProgram.textureArray(currentFace.mandalaTextureArrayHead,"uSampler",0,0);
        
    }
    activateExpressionSlot1(head){
        
        let currentFace = head
        this.headMixProgram.resetSlot1();
        this.headMixProgram.use();
        for (let i = 0; i < 5; i++) {
            this.headMixProgram.attribute("bshp"+i.toString()+"o",currentFace.headMandalaBshpGLBuffers[i],4);
        }
        this.headMixProgram.textureArray(currentFace.mandalaTextureArrayHead,"uSampler1",5,1);
    }
    activatMouth(program,head,slot){
        program.reset();
        program.use()
        program.textureArray(head.mandalaTextureArrayMouth,"uSampler",0,slot);
        for (let i = 0; i < 5; i++) {
            program.attribute("bshp"+i.toString(),head.mandalaBshpGlMouth[i],2);
        }
        program.attribute("coordinates",head.uvBufferMouth,2);
        program.attribute("index",head.idxGlBufferMouth,null);
    }

    setupHeads(){
        const head = this.heads.head0;
        this.activateExpressionSlot0(head,"exp-neu")
        this.activatMouth(this.mouthProgram,head)
        
    }

    setupHead1(){
        this.headMixProgram.use();
        const head = this.heads.head1
        // this.headMixProgram.attribute("blinkBshp",head.blinkGpuBuff,2);
        for (let i = 0; i < 5; i++) {
            this.headMixProgram.attribute("bshp"+i.toString()+"o",head.headMandalaBshpGLBuffers[i],4);
        }
        this.headMixProgram.textureArray(head.mandalaTextureArrayHead,"uSampler1",5);
        
    
        this.mouthMixProgram.reset();
        this.mouthMixProgram.use()
        this.mouthMixProgram.textureArray(head.mandalaTextureArrayMouth,"uSampler",0);
        for (let i = 0; i < 5; i++) {
            this.mouthMixProgram.attribute("bshp"+i.toString(),head.mandalaBshpGlMouth[i],2);
        }
        this.mouthMixProgram.attribute("coordinates",head.uvBufferMouth,2);
        this.mouthMixProgram.attribute("index",head.idxGlBufferMouth,null);

        // this.mouthMixProgram.use()
        // this.mouthMixProgram.textureArray(this.heads.head1.mandalaTextureArrayMouth,"uSampler1",5);
        // for (let i = 0; i < 5; i++) {
        //     this.mouthMixProgram.attribute("bshp"+i.toString()+"o",this.heads.head1.mandalaBshpGlMouth[i],2);
        // }
    }
    destroyMixTimer(){
        if (this.mixTimer){
            clearInterval(this.mixTimer);
            this.mixTimer = null 
        }
        this.nextHead = null;
    }
    
    setEffect(effect){
        // console.log("Effect rend" + effect)
        this.#effectFn = effect.fn;
        // console.log("Effect rend" + effect.fn)
    }
    // setNoEffect(){
    //     this.destroyMixTimer();
    //     this.isTransition = false;
    //     this.effectRendering = false;
    // }
    // setMixEffect(mixWeight){
    //     this.destroyMixTimer();
    //     if (this.headCounter>1){
    //         this.isTransition = false;
    //         this.effectID = 0;
            
    //         this.mixWeight = mixWeight;
    //         this.effectRendering = true;
    //     }
    // }
    
  
    // setHybridEffect(){
    //     // if (this.headCounter>1){
    //         this.destroyMixTimer();
    //         this.effectRendering = true;
    //         this.effectID = 1;
    //         this.mixWeight = 1.0;
    //         const mixChange = 0.0025;

    //         this.mixTimer = setInterval(() =>{
    //             this.mixWeight -= mixChange
    //             if (this.mixWeight<=0){

    //                 this.mixWeight=1.0;
                
    //             }
    //         }, 1000/30);
    //     // }
    // }


    
    // setNextHead(flxData){
    //     this.nextHead = flxData;
    // }
    
    destroyHead1(head){
        if (head){
            // head.blinkGpuBuff.destroy();
            head.mandalaTextureArrayHead.destroy();
            head.uvBufferMouth.destroy();
            head.mandalaTextureArrayMouth.destroy();
            head.idxGlBufferMouth.destroy();
            for (let i = 0; i < 5; i++) {
                head.headMandalaBshpGLBuffers[i].destroy();
                head.mandalaBshpGlMouth[i].destroy()
            }
        }
    }
    
    addText(position,textSize,mirror,text){
        const gl = this.gl;
        const fontSize = 40;
        const fontFace = 'Arial';
        this.contextMeasure.font = fontSize + 'px ' + fontFace;
        const textWidth = this.contextMeasure.measureText(text).width;
        var offscreenCanvas = new OffscreenCanvas(Math.trunc( textWidth), Math.trunc(fontSize*1.2));
        var offscreenContext = offscreenCanvas.getContext('2d');

        offscreenContext.font = fontSize + 'px ' + fontFace;
        offscreenContext.fillStyle = 'white';
        offscreenContext.textAlign = 'center';
        offscreenContext.shadowColor = 'rgba(0, 0, 0, 0.5)'; // Shadow color (black with 50% opacity)
        offscreenContext.shadowBlur = 5; // Shadow blur radius
        offscreenContext.shadowOffsetX = 3; // Shadow offset along the X-axis
        offscreenContext.shadowOffsetY = 3; // Shadow offset along the Y-axis

        offscreenContext.fillText(text, offscreenCanvas.width/2 , offscreenCanvas.height*0.8 );
        const overlayTexture = new Texture(gl,offscreenCanvas);

        const overlayHeight = textSize;
        const overlayWidth = overlayHeight/fontSize*textWidth/this.ratio;
        const overlayVtx = makeQuadVtxArray([[position[0],position[1]],[position[0]+overlayWidth,position[1]+overlayHeight]],mirror);
        
        const overlayVtxBuffer = new VtxBuffer(gl,overlayVtx);
        overlayVtxBuffer.makeLocation(this.shaderProgramOverlay.id,"vtx",2);
        this.overlays.push([overlayVtxBuffer,overlayTexture]);
    }
    addImageOverlay(imgSrc){
        const gl = this.gl;
        const overlayVtx = makeQuadVtxArray([[0,0],[1,1]],1.0);
        
        const overlayVtxBuffer = new VtxBuffer(gl,overlayVtx);
        overlayVtxBuffer.makeLocation(this.shaderProgramOverlay.id,"vtx",2);
        var image = new Image();
        image.src = imgSrc
        const self = this;
        image.onload = function() {
            const overlayTexture = new Texture(gl,image);
            self.overlaysImage.push([overlayVtxBuffer,overlayTexture]);
        }

    }
    
    renderMouth(shaderProgram,head,parSet0,keyVtx,headUnit,zRotMatMouth,alpha){
        const hc = this.headCtrl
        const gl = this.gl
        const [topMPivot,botMPivot,lipSize] = this.calcMouthPivot(headUnit);
        const mouthScale = -(keyVtx[5][0]-keyVtx[4][0])/lipSize;
        const parSet1M = new Float32Array([hc[4],this.ratio,keyVtx[3][0],keyVtx[2][1]]);
        const parSet2Mouth = new Float32Array([topMPivot[0],botMPivot[1],botMPivot[0],botMPivot[1]]);
        const parSet3Mouth = new Float32Array([headUnit.mouthRatio,mouthScale,headUnit.teethGap[0],headUnit.teethGap[1]]);
        const parSet4Mouth = new Float32Array([alpha,0.0,0,0]);
       

        shaderProgram.use();
        shaderProgram.bind();
        shaderProgram.uniform4fv("parSet0",parSet0);
        shaderProgram.uniform4fv("parSet1",parSet1M);
        shaderProgram.uniform4fv("parSet2",parSet2Mouth);
        shaderProgram.uniform4fv("parSet3",parSet3Mouth);
        shaderProgram.uniform4fv("parSet4",parSet4Mouth);

        shaderProgram.uniformMatrix4fv("zRotMatrix",zRotMatMouth);
        shaderProgram.uniform1i("isTop",0);

        gl.drawElements(gl.TRIANGLES, head.idxGlBufferMouth.length, gl.UNSIGNED_SHORT,0);
       
        const parSet2MouthTop = new Float32Array([topMPivot[0],topMPivot[1],botMPivot[0],botMPivot[1]]);
        const parSet1MTop = new Float32Array([hc[4],this.ratio,keyVtx[1][0],keyVtx[0][1]]);
        shaderProgram.uniform4fv("parSet1",parSet1MTop);
        shaderProgram.uniform4fv("parSet2",parSet2MouthTop);
        shaderProgram.uniform1i("isTop",1);
        gl.drawElements(gl.TRIANGLES, head.idxGlBufferMouth.length, gl.UNSIGNED_SHORT,0);
 
    }
    #faceContent0 = null
    #faceContent1 = null
    #faceContentExp = null
    #mouthContent0 = null
    #mouthContent1 = null
    // #flx0FlxUnit = null
    getFlexatarUnit(){
        if (this.#faceContent0)
            return this.#mouthContent0.flexatarUnit
    }
    render(){
        
        
        
        const endTime = window.performance.now();
        const elapsedTime = (endTime - this.#startTime) / 1000;
        
        if (!this.faceProvider0){
            return
        }
        if (!this.mouthProvider0){
            return
        }
        const faceContent0 = this.faceProvider0(elapsedTime)
        const mouthContent0 = this.mouthProvider0(elapsedTime)
       
        if (!faceContent0){
            return
        }
        if (!mouthContent0){
            return
        }

        if (this.#faceContent0 !== faceContent0){
            this.#faceContent0 = faceContent0
            

            this.activateExpressionSlot0(faceContent0)
        }
        if (this.#mouthContent0 !== mouthContent0){
            this.#mouthContent0 = mouthContent0
            this.activatMouth(this.mouthProgram,mouthContent0,0)
        }
        var faceContent1
        var mouthContent1
        if (this.faceProvider1 && this.mouthProvider1){
            faceContent1 = this.faceProvider1(elapsedTime)
            mouthContent1 = this.mouthProvider1(elapsedTime)
            
        
            if (this.#faceContent1 !== faceContent1){
                this.#faceContent1 = faceContent1
                this.activateExpressionSlot1(faceContent1)
            }
            if (this.#mouthContent1 !== mouthContent1){
                this.#mouthContent1 = mouthContent1
                this.activatMouth(this.mouthMixProgram,mouthContent1,1)
            }
            // console.log("faceContent1",faceContent1)
        }else{
            this.#faceContent1 = null
            this.#mouthContent1 = null
            if (this.faceProviderExp){
                const faceContentExp = this.faceProviderExp(elapsedTime)
                
                if (this.#faceContentExp !== faceContentExp){
                    this.#faceContentExp = faceContentExp
                    this.activateExpressionSlot1(faceContentExp)
                }
                faceContent1 = this.#faceContentExp
                mouthContent1 = this.#mouthContent0
                
            }

        }
        
        if (this.headCtrl != null && this.renderIsOn ){
            const currentFaceUnit = this.#faceContent0
            var effect = this.#effectFn(elapsedTime)
            // effect.parameter = 1 - effect.parameter
            if (this.#mouthContent0 === mouthContent1){
                // console.log("faceContent1",mouthContent1)
                if (this.expFn){
                    effect = this.expFn(elapsedTime)
                }else{
                    effect.mode = 0
                }
                // console.log(faceContentExp)
            }
            if (!mouthContent1){
                effect.mode = 0
            }
            
            effect.parameter = 1 - effect.parameter
            const hc = this.headCtrl;
            const gl = this.gl;
            const canvas = this.canvas;

            gl.clearColor(0.0, 0.0, 0.0, 1.0);

            gl.clear(gl.COLOR_BUFFER_BIT);
            
            gl.viewport(this.marg,0,this.vpWidth,canvas.height);
            
            // this.speechState[2] = -1
            const parSet0 = new Float32Array([hc[0],hc[1],hc[2],hc[3]]);
            const parSet1 = new Float32Array([hc[4],this.ratio,this.position[0],this.position[1]]);
            const parSet2 = new Float32Array([this.position[2],this.speechState[0],this.speechState[1],this.speechState[2]]);
            const parSet3 = new Float32Array([this.speechState[3],this.speechState[4],this.position[4],this.position[5]]);
            const zRotMat = m4.zRotation(-this.position[3]);
            const zRotMatMouth = zRotMat;
            const extraRotMatrix = m4.multiply(m4.yRotation(this.extraRot[0]),m4.xRotation(this.extraRot[1]))

            var keyVtx;
            if (effect.mode !=0){
                
                const keyVtx0 = this.calcKeyVtx(zRotMat,extraRotMatrix,this.#faceContent0.keyVtx);
                const keyVtx1 = this.calcKeyVtx(zRotMat,extraRotMatrix,faceContent1.keyVtx);
                if (effect.mode == 2){
                    this.mouthMixWeight =  this.calcWeightByKeyUv(this.flexatarCustom.keyUV,effect.parameter);

                }else{
                    this.mouthMixWeight = effect.parameter;
                }
                

                keyVtx = []
                for (let index = 0; index < keyVtx0.length; index++) {
                    const v0 = keyVtx0[index];
                    const v1 = keyVtx1[index];
                    const v = v4.add(v4.mulScalar(v0,this.mouthMixWeight),v4.mulScalar(v1,1.0-this.mouthMixWeight));
                    keyVtx.push(v);
                }
            }else{
                keyVtx = this.calcKeyVtx(zRotMat,extraRotMatrix,currentFaceUnit.keyVtx);
            }
            


//            ----HEAD RENDER BLOCK-----
            if (effect.mode != 0){
                // console.log(this.#faceContent0.flexatarUnit)
                this.renderMouth(this.mouthProgram,this.#mouthContent0,parSet0,keyVtx,this.#mouthContent0.flexatarUnit,zRotMatMouth,1.0);
                this.renderMouth(this.mouthMixProgram,mouthContent1,parSet0,keyVtx,mouthContent1.flexatarUnit,zRotMatMouth,this.mouthMixWeight);
                
                this.headMixProgram.use();
                this.headMixProgram.bind();
                this.headMixProgram.uniform1f("mixWeight", effect.parameter);
                this.headMixProgram.uniform4fv("parSet0", parSet0);
                this.headMixProgram.uniform4fv("parSet1", parSet1);
                this.headMixProgram.uniform4fv("parSet2", parSet2);
                this.headMixProgram.uniform4fv("parSet3", parSet3);
                this.headMixProgram.uniformMatrix4fv("zRotMatrix", zRotMat);
                this.headMixProgram.uniformMatrix4fv("extraRotMatrix", extraRotMatrix);
                if (effect.mode == 1){
                    this.headMixProgram.uniform1i("effectId", 0);
                }else{
                    this.headMixProgram.uniform1i("effectId", 1);
                }
                
                gl.drawElements(gl.TRIANGLES, this.flexatarCustom.idxGlBuffer.length, gl.UNSIGNED_SHORT,0);
                gl.getError();
            }else{
             

                this.renderMouth(this.mouthProgram,this.#mouthContent0,parSet0,keyVtx,this.#mouthContent0.flexatarUnit,zRotMatMouth,1);

                this.headProgram.use();
                this.headProgram.bind();
                this.headProgram.uniform4fv("parSet0", parSet0);
                this.headProgram.uniform4fv("parSet1", parSet1);
                this.headProgram.uniform4fv("parSet2", parSet2);
                this.headProgram.uniform4fv("parSet3", parSet3);
                this.headProgram.uniformMatrix4fv("zRotMatrix", zRotMat);
                this.headProgram.uniformMatrix4fv("extraRotMatrix", extraRotMatrix);
                gl.drawElements(gl.TRIANGLES, this.flexatarCustom.idxGlBuffer.length, gl.UNSIGNED_SHORT,0);
            }

            
 
            

// -------------- OVERLAY RENDER BLOCK ------------------
            this.shaderProgramOverlay.use()
            for (const overlay of this.overlaysImage) {
                const [vtxBuffer,texture] = overlay;
                vtxBuffer.bind();
                this.overlayUV.bind();
                texture.bind(0,this.shaderProgramOverlay.id,"uSampler");
                gl.drawArrays(gl.TRIANGLES, 0, 6); 
            }  
            for (const overlay of this.overlays) {
                const [vtxBuffer,texture] = overlay;
                vtxBuffer.bind();
                this.overlayUV.bind();
                texture.bind(0,this.shaderProgramOverlay.id,"uSampler");
                gl.drawArrays(gl.TRIANGLES, 0, 6); 
            }  
            

        }
        

    }
    start(){
        
        this.#startTime = window.performance.now();
        this.renderIsOn = true;
        const self = this;
        function renderLoop(){
            self.render();
            if (self.renderIsOn){
                requestAnimationFrame(renderLoop);
            }
   
        }
        renderLoop();
    }
    pause(){
        this.renderIsOn = false;
    }
    calcMouthPivot(head){
        
        const la = head.lipAnchors;
        const hc = this.headCtrl;
        var topPivot = [0,0];
        var botPivot = [0,0];
        var lipSize = 0
        for (let i = 0; i < 5; i++) {

            topPivot = v2.add(v2.mulScalar(la[i][0],hc[i]),topPivot);
            botPivot = v2.add(v2.mulScalar(la[i][1],hc[i]),botPivot);
            lipSize += hc[i] * head.lipSize[i];
        }
        return [topPivot,botPivot,lipSize];

    }
    calcWeightByKeyUv(keyUV,mixWeight){
        const kuv = keyUV[0];
        const theta = mixWeight*6.28;
        const linePoint = [Math.sin(theta),Math.cos(theta),1.0];
        const curPoint = [kuv[0],kuv[1]-0.15,1.0];
        const s = v3.dot(v3.cross(linePoint,curPoint),[0.0,0.0,1.0]);
        var w = s/0.15;
        if (w<-1.0) w = -1;
        if (w>1.0) w = 1;
        w+=1.0;
        w/=2.0;
        return w;

    }
    calcKeyVtx(zRotMatrix,extraRotMatrix,keyVtx){

        const hc = this.headCtrl;
        const p = this.position;
        const calculatedVtx = [];


        var cntr = 0;
        for (const vtxBshpList of keyVtx){
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
            vtx[0] *= 0.8 + p[2];
            vtx[1] *= 0.8 + p[2];
            vtx[1] *= -this.ratio;
            vtx[0] *= -1;
            calculatedVtx.push(vtx);
            cntr += 1;

        }
        return calculatedVtx;
    }
    stop(){
        this.renderIsOn = false;
    }
    destroy(){
        clearInterval(this.timerId)
        this.mandalaTextureArrayHead.destroy();
        this.mandalaTextureArrayMouth.destroy();
        this.spGpuBuff0.destroy();
        this.spGpuBuff1.destroy();
        this.spGpuBuff2.destroy();
        this.eyebrowGpuBuff.destroy();
        this.blinkGpuBuffer.destroy();
        this.uvGlBufferHead.destroy();
        this.idxGlBufferHead.destroy(); 
        this.headMandalaBshpGLBuffers.forEach(function(buffer) {
            buffer.destroy();
        });
        this.mandalaBshpGlMouth.forEach(function(buffer) {
            buffer.destroy();
        });
        this.uvBufferMouth.destroy(); 
        this.idxGlBufferMouth.destroy(); 
        const gl = this.gl;

        this.headProgram.destroy();
        this.mouthProgram.destroy();
        this.shaderProgramOverlay.destroy();

        this.overlayUV.destroy();
        for (const overlay of this.overlays) {
            const [vtxBuffer,texture] = overlay;
            vtxBuffer.destroy();
            texture.destroy();
        }
        for (const overlay of this.overlaysImage) {
            const [vtxBuffer,texture] = overlay;
            vtxBuffer.destroy();
            texture.destroy();
        }

    }

}

// var flexatarStaicUrl = "/file/raw/static.p"
var flexatarStaicUrl = "https://raw.githubusercontent.com/dmisol/flexatar-virtual-webcam/main/raw/flx_static.p"



function fetchArrayBuffer(url){
    return fetch(url)
    .then(response => {
         if (!response.ok) {
           throw new Error('Network response was not ok');
         }
         return response.arrayBuffer();
     })
}

class FlexatarClient{
    #token = null
    static route = "/"
    constructor(token) {
       this.#token = token
      
    }

    getFlexatar(flexatarLink){
        
        const data = {
            token: this.#token,
            ftar: flexatarLink
        };
        
        return new Flexatar(data);
    }
}
function getAllSupportedMimeTypes(...mediaTypes) {
    if (!mediaTypes.length) mediaTypes.push('video', 'audio')
    const CONTAINERS = ['webm', 'ogg', 'mp3', 'mp4', 'x-matroska', '3gpp', '3gpp2', '3gp2', 'quicktime', 'mpeg', 'aac', 'flac', 'x-flac', 'wave', 'wav', 'x-wav', 'x-pn-wav', 'not-supported']
    const CODECS = ['vp9', 'vp9.0', 'vp8', 'vp8.0', 'avc1', 'av1', 'h265', 'h.265', 'h264', 'h.264', 'opus', 'vorbis', 'pcm', 'aac', 'mpeg', 'mp4a', 'rtx', 'red', 'ulpfec', 'g722', 'pcmu', 'pcma', 'cn', 'telephone-event', 'not-supported']
    
    return [...new Set(
      CONTAINERS.flatMap(ext =>
          mediaTypes.flatMap(mediaType => [
            `${mediaType}/${ext}`,
          ]),
      ),
    ), ...new Set(
      CONTAINERS.flatMap(ext =>
        CODECS.flatMap(codec =>
          mediaTypes.flatMap(mediaType => [
            // NOTE: 'codecs:' will always be true (false positive)
            `${mediaType}/${ext};codecs=${codec}`,
          ]),
        ),
      ),
    ), ...new Set(
      CONTAINERS.flatMap(ext =>
        CODECS.flatMap(codec1 =>
        CODECS.flatMap(codec2 =>
          mediaTypes.flatMap(mediaType => [
            `${mediaType}/${ext};codecs="${codec1}, ${codec2}"`,
          ]),
        ),
        ),
      ),
    )].filter(variation => MediaRecorder.isTypeSupported(variation))
  }

class Flexatar{
    #signalFlexatarReady = null;
    #flexatarReady = new Promise((resolve,reject)=>{
        this.#signalFlexatarReady = resolve;
    });
    #bufferStorage = {};
    constructor(flexatarLink) {
        Flexatar.initiateStaticPackageDownload()
        const options = {
            method: 'POST', // Use 'POST', 'PUT', or 'PATCH' instead of 'GET'
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(flexatarLink) // Convert the data object to a JSON string
        };
            fetch(FlexatarClient.route+"ftar", options)
                .then(response => {
                    return response.arrayBuffer();
                    
                }).then(flexatarPackage =>{
                    Flexatar.#staticPackageReady.then(()=>{
                        const flexatarUnit = new FlexatarUnit(flexatarPackage,Flexatar.#staticPackage);
                        flexatarUnit.awaitResources().then(()=>{
                            this.#signalFlexatarReady(flexatarUnit);
                        })
                    });
                })
            
       
    }

    static #staticPackage = null
    static #staticPackageReady = null
    static initiateStaticPackageDownload(){
        if (Flexatar.#staticPackageReady == null){
            Flexatar.#staticPackageReady = new Promise((resolve, reject) => {
                Flexatar.#loadStaticPackage(resolve,reject)
        
            });
        }
        return  Flexatar.#staticPackageReady
    }
    static getStaticPackage(){
        if (Flexatar.#staticPackage != null){
            return Flexatar.#staticPackageReady
        }else{
            return new Promise((resolve,reject) => {
                
                    resolve(Flexatar.#staticPackage);
            
            })
        }
    }

    static #loadStaticPackage(resolve,reject){
        return fetchArrayBuffer(flexatarStaicUrl).then(flexatarStaticBuffer=>{
            const flexatarCommon = new FlexatarCommonData(flexatarStaticBuffer);
            flexatarCommon.awaitResources().then(() => {
                    Flexatar.#staticPackage = flexatarCommon;
                    resolve(flexatarCommon)
                })
            }).catch(error => {
                Flexatar.#staticPackageReady = null;
                console.error('Fetch error:', error);
                reject()
            });
    }
   
    #connections = {}
    connectTo(flexatarAnimator,slotId){
        if (!(flexatarAnimator.id in this.#connections)){
            this.#connections[flexatarAnimator.id] = true
            
            this.#flexatarReady.then(flexatarUnit=>{
                
                this.#makeGlBuffers(flexatarAnimator.gl,flexatarUnit,flexatarAnimator.id)
            })
       
        }
        let didSetToSlot = null
        const connectedPromise = new Promise(resolve => {
            didSetToSlot = resolve
        })
        if (!slotId){
            slotId = flexatarAnimator.currentEmptySlot
        }
        if (slotId>=0){
            var slot = flexatarAnimator.currentEmptySlot
            if (slotId !== undefined && slotId !== null){
                if (slotId == 0){
                    flexatarAnimator.currentEmptySlot = 0
                }else{
                    flexatarAnimator.currentEmptySlot = -1
                }
                slot = slotId
            }
            
            if (flexatarAnimator.currentEmptySlot!=2){
                this.setToSlot(slot,flexatarAnimator,null,didSetToSlot)
                flexatarAnimator.currentEmptySlot += 1
            }
        }
        return connectedPromise
    }
    static #setToSlotFuns = []

    setToSlot(slotIdx,flexatarAnimator,expressionKey,didSetToSlot){
        
        const setToSlotFn = ready => {
            this.#flexatarReady.then(flexatarUnit=>{
                const keys = Object.keys(flexatarUnit.facePackages);
                keys.shift()
                let expKey = "exp-neu"
                if (expressionKey){
                    expKey = expressionKey
                }
                flexatarAnimator.getRenderer().then(renderer =>{

                    const faceProvider = (time) => {
                        const fc = this.faceContents[flexatarAnimator.id]
                        if (fc)
                            return fc[expKey]
                    }
                    const mouthProvider = (time) => {
                        
                        return this.mouthContent[flexatarAnimator.id]
                    }
                    if (slotIdx==0){
                        // console.log("provider0",slotIdx)
                        renderer.faceProvider0 = faceProvider
                        renderer.mouthProvider0 = mouthProvider
                        // keys.length = 0
                        if (keys.length>0){
                            let randomExpKey = keys[getRandomInt(0, keys.length-1)]
                            let startTime
                            let elapsedTime 
                            let emoDuration = getRandomInt(6, 10)
                            renderer.faceProviderExp = (time) => {
                                if (!startTime) 
                                    if (!startTime) startTime = time
                                elapsedTime = time - startTime
                                if (elapsedTime > emoDuration){
                                    startTime = time
                                    elapsedTime = 0
                                    
                                    randomExpKey = keys[getRandomInt(0, keys.length-1)]
                                }
                                const fc = this.faceContents[flexatarAnimator.id]
                                if (fc)
                                    return fc[randomExpKey]
                            }
                            
                            const fade_in_dur = emoDuration/getRandomInt(6, 10)
                            const flat_dur = emoDuration/4
                            const fade_out_dur = emoDuration/4

                            renderer.expFn = (time) => {
                                if (elapsedTime<fade_in_dur){
                                    const weight = Math.pow (1 - (Math.cos(elapsedTime/fade_in_dur * Math.PI)+1)/2,3)
                                    return {mode:1,parameter:weight}
                                }
                                const flatTime = elapsedTime - fade_in_dur
                                if (flatTime<flat_dur){
                                    
                                    return {mode:1,parameter:1}
                                }
                                const fadeOutTime = flatTime - flat_dur
                                if (fadeOutTime<fade_out_dur){
                                    const weight = Math.pow (1 - (Math.cos(fadeOutTime/fade_out_dur * Math.PI)+1)/2,3)
                                    return {mode:1,parameter:1 - weight}
                                }
                                return {mode:1,parameter:0}
                            }
                            
                        }
                        

                    }else{
                        // console.log("provider1",slotIdx)
                        renderer.faceProvider1 = faceProvider
                        renderer.mouthProvider1 = mouthProvider
                    }
                    ready()
                   
                    if (didSetToSlot){
                        
                        didSetToSlot()
                    }
                })
                
            })
        }
        
        Flexatar.#setToSlotFuns.push(setToSlotFn)
        if (!Flexatar.#isRuningSetToSlot){
            Flexatar.#isRuningSetToSlot = true
            this.#runSetToSlot()
        }
    }
    static #isRuningSetToSlot = false
    #runSetToSlot(){

        Flexatar.#isRuningSetToSlot = true
        if (Flexatar.#setToSlotFuns.length != 0){
            Flexatar.#setToSlotFuns[0](()=>{
                Flexatar.#setToSlotFuns.shift()
                this.#runSetToSlot()
            })
        }else{
            Flexatar.#isRuningSetToSlot = false
        }

    }
    faceContents = {}
    mouthContent = {}
    #makeGlBuffers(gl,flexatarUnit,animatorId){
        // console.log("loadBuffers")
        if (!(animatorId in this.faceContents)){
            this.faceContents[animatorId] = {}
           
        }
        for (const [key, value] of Object.entries(flexatarUnit.facePackages)) {
            const headMandalaBshpGLBuffers = []
            for (let i = 0; i < 5; i++) {
                const headMandalaBshp = value.mandalaGLBshpBuffers[i];
                
                const headMandalaBshpGLBuffer = new VtxBuffer(gl,headMandalaBshp)
                headMandalaBshpGLBuffers.push(headMandalaBshpGLBuffer)
            }
    
            const mandalaGLTexturesHead = []
            for (const image of value.mandalaTextures) {
             
                mandalaGLTexturesHead.push(new Texture(gl,image));
            }
            const mandalaTextureArrayHead = new TextureArray(mandalaGLTexturesHead,gl);
            
            
            this.faceContents[animatorId][key] = {
                blinkGpuBuffer:new VtxBuffer(gl,value.blinkBlendshape),
                headMandalaBshpGLBuffers:headMandalaBshpGLBuffers,
                mandalaTextureArrayHead:mandalaTextureArrayHead,
                keyVtx:value.keyVtx,
            }
        }

        const mandalaBshpGlMouth = [];
        for (let i = 0; i < 5; i++) {
            const gpuBuff = new VtxBuffer(gl,flexatarUnit.mouthBlendshapes[i]);
            mandalaBshpGlMouth.push(gpuBuff);
        }
        const mouthTextures = []
        for (const image of flexatarUnit.mandalaMouthTextures){
            mouthTextures.push(new Texture(gl,image));
        }
        const mandalaTextureArrayMouth = new TextureArray(mouthTextures,gl);
        this.mouthContent[animatorId] = {
            mandalaBshpGlMouth:mandalaBshpGlMouth,
            uvBufferMouth:new VtxBuffer(gl,flexatarUnit.mouthUV),
            mandalaTextureArrayMouth:mandalaTextureArrayMouth,
            idxGlBufferMouth:new IdxBuffer(gl,flexatarUnit.mouthIdx),
            flexatarUnit:flexatarUnit
        }
    }
    destroyGlBuffers(flexatartAnimator){
        const animatorId = flexatartAnimator.id
        for (const [key, value] of Object.entries(this.faceContents[animatorId])) {
            value.blinkGpuBuffer.destroy()
            value.mandalaTextureArrayHead.destroy()
            for (const buffer of value.headMandalaBshpGLBuffers){
                buffer.destroy()
            }
        }
        const mc = this.mouthContent[animatorId]
        mc.mandalaTextureArrayMouth.destroy()
        mc.idxGlBufferMouth.destroy()
        mc.uvBufferMouth.destroy()
        for(const buffer of mc.mandalaBshpGlMouth){
            buffer.destroy()
        }
        delete this.#connections[animatorId]
    }
}

class FlexatarAnimator {

    #videoStream = null
    #canvas = null;
    #renderer = null
    #rendererInstance = null
   
    constructor(canvas,width,height) {
        if (width)
            this.width = width 
        else
            this.width = 480 
        if (height)
            this.height = height 
        else
            this.height = 640 
        if (canvas) {
            this.#canvas = canvas
        }else{
            const canvas = document.createElement('canvas');
            canvas.width = this.width
            canvas.height = this.height;
            canvas.id = "flxCanvas";
            canvas.style.display = "none";
            this.#canvas = canvas
        }
        this.id = crypto.randomUUID();
        this.gl = this.#canvas.getContext('webgl');

            this.#renderer = new Promise((resolve,reject) => {
                Flexatar.initiateStaticPackageDownload().then(staticPackage=>{
                    resolve(new RenderEngine(this.#canvas,this.gl,staticPackage));
                })
            })
        this.currentEmptySlot = 0
        

        this.speechAnimator = new SpeechAnimator()
        this.audioContext = this.speechAnimator.audioContext
        this.speechAnimator.active = true
        this.speechAnimator.onFrame = animVector =>{
            if (this.#rendererInstance){
                this.#rendererInstance.speechState = animVector
            }
        }
        this.#videoStream = this.#canvas.captureStream(30)
       
    }
    removeAudioTrack(){
        this.speechAnimator.removeSource()
       
        let audioTracks =  this.#videoStream.getAudioTracks()
        if (audioTracks.length>0){
            this.#videoStream.removeTrack(audioTracks[0]);
        }
    }
    addMediaStream(mediaStream){
        const audioContext = this.audioContext
        this.removeAudioTrack()
        let micSrc = audioContext.createMediaStreamSource(mediaStream);
        this.speechAnimator.connectSource(micSrc)

        var delayNode = audioContext.createDelay(1);
        delayNode.delayTime.value = 0.5;
        micSrc.connect(delayNode);
        const flxAudioStreamSource = audioContext.createMediaStreamDestination();
        delayNode.connect(flxAudioStreamSource);
        const flxStreamAudio = flxAudioStreamSource.stream;
        let audioTrack = flxStreamAudio.getAudioTracks()[0];
        this.#videoStream.addTrack(audioTrack);
       
    }
   
    addAuidoTrack(url){

        const audioContext = this.audioContext

        const audioElement = new Audio(url);

        audioElement.crossOrigin = 'anonymous';
        audioElement.autoplay = true;

        const sourceNode = audioContext.createMediaElementSource(audioElement);

        const destination = audioContext.createMediaStreamDestination();

        sourceNode.connect(destination);

        const mediaStream = destination.stream;
        
        audioElement.oncanplaythrough = () => {
            this.addMediaStream(mediaStream)
        }
       
    }
    getRenderer(){
        return this.#renderer;
    }
    setEffect(effect){
        this.#renderer.then(renderer => {
            renderer.setEffect(effect)
        })
    }

    freeSlot(slotIdx){
        return this.#renderer.then(renderer => {
            if (slotIdx == 0){
                renderer.faceProvider0 = null
                renderer.mouthProvider0 = null
            }else{
                renderer.faceProvider1 = null
                renderer.mouthProvider1 = null
                console.log("free slot 1")
            }
        })
    }
    #timerId = null
    isActive = false
    start(){
        
        this.#renderer.then(renderer => {
            
            if (this.isActive) return
            this.isActive = true
            this.#rendererInstance = renderer
            renderer.start()
            
            var animFrameCounter = 0;
            function animationTimer(){
                animFrameCounter += 1;

                const animationFrame = renderer.flexatarCustom.getAnimationFrame(animFrameCounter);

                const rx = (animationFrame[3]-0.5)*1.0 + 0.5;
                const ry = (animationFrame[4]-0.45)*1.0 + 0.45;
                const flexatar = renderer.getFlexatarUnit()
                if (flexatar){
                    const interU = flexatar.makeInterUnit([rx,ry]);
                    renderer.headCtrl = interU[0];
                    renderer.extraRot = interU[1];
                    renderer.position = [animationFrame[0],animationFrame[1]-0.3,animationFrame[2]-0.1,animationFrame[5],animationFrame[6],animationFrame[8]];
                }
            }

            renderer.timerId = setInterval(animationTimer, 1000/30);
            this.#timerId = renderer.timerId 
        })
    }
    pause(){
        this.isActive = false
        this.#renderer.then(renderer => {
            renderer.pause()
            if (this.#timerId){
                clearInterval(this.#timerId)
                this.#timerId = null
            }
        })
    }

    getMediaStream() {
        
        return this.#videoStream;
    }

    recordedChunks = [];
    mediaRecorder = null;
    onRecordStop = null;
    currentRecordingType = null
    record(){
        this.currentRecordingType = getAllSupportedMimeTypes()
        const options = { mimeType: this.currentRecordingType[0] };
        console.log(this.currentRecordingType);
        this.mediaRecorder = new MediaRecorder(this.#videoStream, options);
        this.mediaRecorder.ondataavailable = event =>{
            console.log("data-available");
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
                console.log(event.data);
                
            }
        }
        this.mediaRecorder.onerror = e => {
            console.log(e);
        }
        this.mediaRecorder.start();
        this.mediaRecorder.onstop = () => {
            const blob = new Blob(this.recordedChunks, { type: this.currentRecordingType[0] });
            const url = URL.createObjectURL(blob);
            const file = new File([blob], 'recorded_video.mp4', { type: this.currentRecordingType[0] });
            if (this.onRecordStop != null ){
                this.onRecordStop(url,file)
            }
        };
    }
    
    stopRecord(){
        this.mediaRecorder.stop();

    }

    destroy() {
        this.#renderer.destroy()
    }
}




class SpeechAnimator{
    active = false
    
    constructor(){
        this.onFrame = null
        const myWorker = new Worker(nnWorkerUrl);
        myWorker.onmessage = (e) => {
            
            if (this.onFrame) this.onFrame(e.data.anim)
        };

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.processorNode = Promise.all([
            this.audioContext.audioWorklet.addModule("https://cdn.jsdelivr.net/gh/aolsenjazz/libsamplerate-js/dist/libsamplerate.worklet.js"),
            this.audioContext.audioWorklet.addModule(audioProcessorUrl)
        ]).then(()=>{
            const processorNode = new AudioWorkletNode(this.audioContext,"my-audio-processor",);
            processorNode.port.onmessage = (event) => {

                // console.log("data",event.data)
                const data = event.data  
                if (data && this.active && data instanceof Float32Array) {
                    myWorker.postMessage(data);
                }else{
                    this.onFrame([0.0,0.0,0.0,0.0,0.0])
                }
            }
            return processorNode
        })
    }
    #src = null
    connectSource(src){
        this.#src = src
 
        
        this.processorNode.then(processorNode => {
            
            src.connect(processorNode);
        })
    }
    removeSource(){
        if (this.#src) this.#src.disconnect()
    }

}



class Effect {

    constructor(fn) {
        this.fn = fn 
    }

    static no() {
        
        return new Effect(function calc(time) {
            return {mode:0,parameter:0}
          });

    }

    static mix(mixWeight) {
        return new Effect(function calc(time) {
            return {mode:1,parameter:mixWeight}
        });
    }

    static morph(duration) {
        var dur
        if (duration){
            dur = duration
        }
        dur = 4
        return new Effect(function calc(time) {
            const periods = time/dur
            const periodCounter = Math.floor(periods)
            const weight = periods - periodCounter
            if (periodCounter%2 == 0){
                return {mode:1,parameter:weight}
            }else{
                return {mode:1,parameter:1 - weight}
            }
            
        });

    }

    static hybrid(duration) {
        var dur
        if (duration){
            dur = duration
        }
        dur = 6
        return new Effect(function calc(time) {
            const periods = time/dur
            const periodCounter = Math.floor(periods)
            const weight = periods - periodCounter
            return {mode:2,parameter:weight}
         });
    }
}

class FlexatarSDK {
    static route = "/"
    constructor(token,canvas,width,height) {
        this.token = token
        this.client = new FlexatarClient(this.token)
        if (width)
            this.width = width 
        else
            this.width = 480 
        if (height)
            this.height = height 
        else
            this.height = 640 

        this.flexatarAnimator = new FlexatarAnimator(canvas,this.width,this.height);
    }

    // returns the list of flexatars
    availableFlexatars() {

    }

    // returns preview image and name 
    preview(ftar) {
        

    }

    // accepts a list of either single or couple flexatars
    // also downloads flexatars from the cloud
    // continuous rendering is ensured
    // models are updated when downloading in finished
    #flexatar1 = null
    #flexatar2 = null
    static SAME = "same"
    useFlexatars() {
        if (arguments.length >0){
            if (arguments[0]){
                
                if (arguments[0] !== FlexatarSDK.SAME){
                    
                    const flexatar1 = this.client.getFlexatar(arguments[0])
                    flexatar1.connectTo(this.flexatarAnimator,0).then(()=>{
                        if (this.#flexatar1){
                            console.log("destroy 1")
                            this.#flexatar1.destroyGlBuffers(this.flexatarAnimator)
                           
                        }
                        
                        this.#flexatar1 = flexatar1
                        
                    })
                    
                    this.flexatarAnimator.start()
                }
                
            }else{
                this.flexatarAnimator.freeSlot(0).then(()=>{
                    setTimeout(()=>{
                        if (this.#flexatar1){
                            console.log("destroy 1")
                            this.#flexatar1.destroyGlBuffers(this.flexatarAnimator)
                            this.#flexatar1 == null
                        }
                    },100)
                    
                })
                
            }
        }

        if (arguments.length == 2){
            if (arguments[1]){
                if (arguments[1] !== FlexatarSDK.SAME){
                    const flexatar2 = this.client.getFlexatar(arguments[1])
                    flexatar2.connectTo(this.flexatarAnimator,1).then(()=>{
                        if (this.#flexatar2){
                            console.log("destroy 2")
                            this.#flexatar2.destroyGlBuffers(this.flexatarAnimator)
                        }
                        this.#flexatar2 = flexatar2
                    })
                }
            }else{
                this.flexatarAnimator.freeSlot(1).then(()=>{
                    setTimeout(()=>{
                        if (this.#flexatar2){
                            console.log("destroy 2")
                            this.#flexatar2.destroyGlBuffers(this.flexatarAnimator)
                            this.#flexatar2 = null
                        }
                    },100)
                    
                })
            }

        }
        
    }

    useEffect(effect) {
        this.flexatarAnimator.setEffect(effect)
    }
    removeAudioTrack(){
        this.flexatarAnimator.removeAudioTrack()
    }

    // starts a+v streaming from the input audio
    audioInputByUrl(audioIn) {
        this.flexatarAnimator.addAuidoTrack(audioIn)
    }
    audioInputByMediaStrem(audioIn) {
        this.flexatarAnimator.addMediaStream(audioIn)
    }
    get mediaStream(){
        return this.flexatarAnimator.getMediaStream()
    }
    // free gpu resources
    destroy() {
        
    }
    get audioContext(){
        return this.flexatarAnimator.speechAnimator.audioContext
    }
}

class SafariWebRadio{
    active = true
    currentSampleSource = null
    stream = null
    readbleStream = null
    constructor(url,audioContext){
        const playbackRate = 1;
        let init = true
        let chunks = []
        let destination = audioContext.createMediaStreamDestination()
        this.mediaStream = destination.stream
        const mediaType = (navigator.userAgent.indexOf("Firefox") != -1) ? 'audio/mp4':'audio/mpeg'
        let self = this
        async function play(bufferCount){
            if (!bufferCount)
                bufferCount = 0
            if (chunks.length < bufferCount){
                setTimeout(() => {
                    console.log("no signal")
                    if (self.active) play(10)
                        
                }, 1000);
                return
            }
            const dataUrl = URL.createObjectURL(new Blob(chunks, { type: mediaType }));
            chunks = []  
            let buffer
            try{
                buffer = await audioContext.decodeAudioData(await (await fetch(dataUrl)).arrayBuffer())
            }catch{
                console.log("incorrect buffer")
                play(10)
                return
            }
            const sampleSource = new AudioBufferSourceNode(audioContext, {
                buffer: buffer,
                playbackRate,
            });
            sampleSource.start();
            self.currentSampleSource = sampleSource
            sampleSource.connect(destination);
            const duration = sampleSource.buffer.duration;
            
            setTimeout(() => {
                console.log('Playback finished');
                if (self.active)
                    play()
            }, duration * 1000 - 100);
        }
        
        
        function pump(stream){
            return stream.read().then(data => {
                if (!data.value) {return}
                chunks.push(data.value.buffer)
                
                if (chunks.length == 10 && init){
                    play()
                    init = false
                }
                console.log("pump")
                if (self.active)
                    pump(stream)
            })
        }
        console.log("fetch radio",self.active)
        fetch(url).then(res=>{
            console.log("res",res)
            this.readbleStream = res
            pump(this.stream = res.body.getReader())
        })

    }
    cancel(){
       
    }

    get stream(){
        return this.mediaStream
    }
    stop(){
        this.active = false
        if (this.currentSampleSource){
            console.log("Stop resource",this.stream)
            this.currentSampleSource.stop()
            this.currentSampleSource = null
            this.stream.cancel().then(() => {
                this.stream.releaseLock();
                console.log('Stream reading stopped and reader lock released.');
              }).catch((error) => {
                console.error('Error cancelling the stream:', error);
              });
            
        }
    }
}


