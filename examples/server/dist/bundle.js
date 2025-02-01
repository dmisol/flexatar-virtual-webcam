/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/ftar-v-cam.js":
/*!***************************!*\
  !*** ./src/ftar-v-cam.js ***!
  \***************************/
/***/ (function(module) {

eval("!function(e,t){ true?module.exports=t():0}(this,(()=>(()=>{\"use strict\";var e={d:(t,i)=>{for(var o in i)e.o(i,o)&&!e.o(t,o)&&Object.defineProperty(t,o,{enumerable:!0,get:i[o]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{\"undefined\"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:\"Module\"}),Object.defineProperty(e,\"__esModule\",{value:!0})}},t={};function i(e,t){let i={};return t?i[t]=e:i=e,i}e.r(t),e.d(t,{default:()=>s});class o{constructor(e,t,o){this.iframeId=o,this.holderId=t,this.postMessageProvider=e,this.peerConnection=new RTCPeerConnection({iceServers:[],iceTransportPolicy:\"all\"}),this.peerConnection.ontrack=e=>{const i=e.track;\"iframe\"==t?\"audio\"==i.kind&&this.onaudioready&&this.onaudioready(i):\"host\"==t&&(\"video\"==i.kind?this.onflexatarready&&this.onflexatarready(i):this.ondelayedaudio&&this.ondelayedaudio(i))},this.peerConnection.onicecandidate=t=>{t.candidate&&e.postMessage({flexatar:i({type:\"ice-candidate\",candidate:JSON.stringify(t.candidate)},this.iframeId)},\"*\")},this.peerConnection.onconnectionstatechange=()=>{this.peerConnection.connectionState},this.isNegotiating=!0,this.peerConnection.onnegotiationneeded=async()=>{this.isNegotiating||(this.isNegotiating=!0,e.postMessage({flexatar:i(await this.offerMessage(),this.iframeId)},\"*\"))}}async recvOffer(e){const t=new RTCSessionDescription({type:\"offer\",sdp:e.sdp});await this.peerConnection.setRemoteDescription(t);const o=await this.peerConnection.createAnswer();await this.peerConnection.setLocalDescription(o),this.postMessageProvider.postMessage({flexatar:i({type:\"answer\",sdp:o.sdp},this.iframeId)},\"*\")}async recvAnswer(e){const t=new RTCSessionDescription({type:\"answer\",sdp:e.sdp});await this.peerConnection.setRemoteDescription(t)}async addIceCandidate(e){await this.peerConnection.addIceCandidate(JSON.parse(e.candidate))}async offerMessage(){const e=await this.peerConnection.createOffer();return await this.peerConnection.setLocalDescription(e),{type:\"offer\",sdp:e.sdp}}addAudioTrack(e){e?this.audioTransiver?this.audioTransiver.sender.replaceTrack(e).then((()=>{})).catch((e=>{console.error(\"Error replacing track:\",e)})):this.audioTransiver=this.peerConnection.addTransceiver(e,{direction:\"sendonly\"}):this.audioTransiver&&(this.peerConnection.getSenders().forEach((e=>{e.track&&\"audio\"===e.track.kind&&this.peerConnection.removeTrack(e)})),this.audioTransiver.stop(),this.audioTransiver=null)}addAllTraks(e){e.getTracks().forEach((e=>{this.peerConnection.addTransceiver(e,{direction:\"sendonly\"})}))}}class a{#e;#t=async()=>{};#i=()=>{};#o;setupTokenFetch(e,t){let i=!0;this.#t=async()=>{if(i&&this.#o?.token)return i=!1,this.#o.token;try{const i=await fetch(e,t);if(!i.ok)return void this.#i({response:i});const o=await i.json();if(!o.token)throw new ReferenceError(\"token field is undefined\");return o.token}catch(e){return void this.#i({exception:e})}}}set ontokenerror(e){this.#i=e}set background(e){(async()=>{const t=await fetch(e);if(!t.ok)return void console.error(\"can not fetch \",e);const i=await t.arrayBuffer();await this.#a,this.#s.contentWindow.postMessage({flexatar:{type:\"background\",imageBuffer:i}},\"*\")})()}#s;#a;#n;#r;constructor(e,t){let i;this.#n=crypto.randomUUID(),this.#o=t,t?.token&&(this.#t=()=>t.token),this.#s=document.createElement(\"iframe\"),this.#r=new Promise((e=>{i=e})),this.#d=i,window.addEventListener(\"message\",(async e=>{let t=e.data;if(t.flexatar&&(t=t.flexatar,t=t[this.#n],t))if(\"answer\"===t.type?this.#c.recvAnswer(t):\"ice-candidate\"===t.type&&this.#c.addIceCandidate(t),\"offer\"===t.type)this.#c.recvOffer(t);else if(\"request_audio\"===t.type)this.#u&&(this.#u(),this.#u);else if(\"reload_token\"===t.type){const e=await this.#t();this.#s.contentWindow.postMessage({flexatar:{type:\"reload_token\",token:e}},\"*\")}})),this.#a=new Promise((e=>{this.#s.onload=async()=>{this.#s.contentWindow.postMessage({flexatar:{token:!0}},\"*\"),this.#h(),e()}})),this.#s.src=`${e}?id=${this.#n}`,this.#s.style.width=\"100%\",this.#s.style.height=\"100%\",this.#s.style.border=\"none\",this.#s.style.position=\"absolute\",this.#s.style.top=\"0\",this.#s.style.left=\"0\",this.#f=this.#s.style}set resolution(e){(async()=>{await this.#r,this.#s.contentWindow.postMessage({flexatar:{type:\"resolution\",resolution:e}},\"*\")})()}#f;set style(e){this.#s.style=e}get style(){return this.#f}#l;set src(e){e||(this.audiotrack=null),e instanceof MediaStream?this.audiostream=e:\"string\"==typeof e?this.url=e:e instanceof ArrayBuffer?this.arraybuffer=e:e instanceof MediaStreamTrack&&\"audio\"==e.kind&&(this.audiotrack=e)}set url(e){e||(this.audiotrack=null),(async()=>{const t=await async function(e){const t=await fetch(e);if(!t.ok)return void console.error(`can't load from ${e}`);let i;try{i=await t.arrayBuffer()}catch(e){return void console.error(`Error while reading arrayBuffer: ${e.message}`)}return i}(e);t&&(this.arraybuffer=t)})()}set audiotrack(e){(async()=>{await this.#r,e&&(e.onended=()=>{this.#c.addAudioTrack(null),this.#c.isNegotiating=!1}),this.#c.addAudioTrack(e),this.#c.isNegotiating=!1})()}set arraybuffer(e){e||(this.audiotrack=null),(async()=>{this.#l&&this.#l.stopBufferSource(),this.#l=await async function(e,t){let i;try{i=await t.decodeAudioData(e)}catch(e){return void console.error(`Error while decoding audio data: ${e.message}`)}const o=t.createBufferSource();o.buffer=i;const a=t.createMediaStreamDestination();let s=!1;o.connect(a);const n=a.stream;return o.onended=()=>{if(!s){const e=n.getAudioTracks()[0];e&&(e.stop(),e.dispatchEvent(new Event(\"ended\")))}},o.start(),n.stopBufferSource=()=>{s=!0,o.stop()},n}(e,a.#m()),this.audiostream=this.#l})()}static#p;static#m(){return a.#p||(a.#p=new(window.AudioContext||window.webkitAudioContext)),a.#p}set audiostream(e){if(!e)return void(this.audiotrack=null);const t=e.getAudioTracks()[0];this.audiotrack=t}set onoutputstream(e){this.#e=e}mediastream=new MediaStream;#d;#c;#y;#h(){this.#c=new o(this.#s.contentWindow,\"host\"),this.#c.ondelayedaudio=e=>{this.#y&&this.mediastream.removeTrack(this.#y),this.#y=e,this.mediastream.addTrack(e)},this.#c.onflexatarready=e=>{this.#d(),this.mediastream.addTrack(e),this.#e&&this.#e(this.mediastream)}}#u;#k=!1;get isAudioReady(){return this.#k}async requestAudioPermition(e){this.#k||(this.#k=!0,console.log(\"post request audio\"),this.#s.contentWindow.postMessage({flexatar:{type:\"request_audio\"}},\"*\"),await new Promise((e=>{this.#u=e})),e())}mount(e){e.style.position=\"relative\",e.appendChild(this.#s)}get element(){return this.#s}unmount(){this.#s.remove()}destroy(){this.#s.parentNode&&this.#s.remove(),this.#s.src=null}}const s={getVCamElement:function(e,t){return new a(e,t)}};return t})()));\n\n//# sourceURL=webpack://server/./src/ftar-v-cam.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _list_item_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./list-item.js */ \"./src/list-item.js\");\n/* harmony import */ var _sub_create_container_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./sub-create-container.js */ \"./src/sub-create-container.js\");\n/* harmony import */ var _util_popup_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../util/popup.js */ \"../util/popup.js\");\n/* harmony import */ var _ftar_v_cam_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ftar-v-cam.js */ \"./src/ftar-v-cam.js\");\n/* harmony import */ var _ftar_v_cam_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_ftar_v_cam_js__WEBPACK_IMPORTED_MODULE_3__);\n\n\n\n\n\n\n\n\nbuySybscription.onclick = async() => {\n\n    const containerElements = (0,_sub_create_container_js__WEBPACK_IMPORTED_MODULE_1__.createContainer)();\n    (0,_util_popup_js__WEBPACK_IMPORTED_MODULE_2__.showPopup)({\n        customElement:containerElements.container,\n        buttons:[\n            {\n                text:\"BUY\",\n                onclick:async closeHandler =>{\n                    closeHandler()\n                    const reqBody = {\n                        authtype:containerElements.authTypeInput.value,\n                        user:containerElements.userInput.value,\n                        testing:containerElements.checkbox.checked,\n                        crt:crypto.randomUUID()\n                    }\n                   \n                    // todo fetch with retry\n                    const resp = await fetch(\"/buysubscription\",{\n                        method: 'POST',\n                        headers:{\"Content-Type\":\"application/json\"},\n                        body: JSON.stringify(reqBody)\n                    })\n                    if (!resp.ok){\n                        console.log(await resp.json())\n                    }else{\n                        console.log(\"buy subscription success\")\n                    }\n\n                }\n               \n            },{\n                text:\"CANCEL\",\n                onclick:async closeHandler =>{\n                    closeHandler()\n                }\n            }\n        ]\n\n    })\n  \n}\n\nasync function getSubList(body){\n    if (!body) body = {}\n    const resp = await fetch(\"/listsubscription\",{\n        method: 'POST',\n        headers:{\"Content-Type\":\"application/json\"},\n        body:JSON.stringify(body)\n    })\n    if (resp.error){\n        return\n    }\n    const respJson = await resp.json()\n    return respJson\n}\n\nfunction addEntriesToDocument(respJson){\n    for (const entry of respJson.list){\n        const subscription = (0,_list_item_js__WEBPACK_IMPORTED_MODULE_0__.listItem)(entry,{\n            vcam:(request)=>{\n                if (vCam){\n                    vCam.destroy()\n                }\n                vCam = createVCam(request,videoFromIframe,iframeHolder)\n            }\n        })\n\n        subscriptionsContainer.appendChild(subscription)\n    }\n\n    if (respJson.continue){\n        showMoreButton.style.display = \"block\"\n        showMoreButton.onclick =  () =>{\n            showListElements({continue:respJson.continue})\n        }\n    }else{\n        showMoreButton.style.display = \"none\"\n    }\n}\naddEntriesToDocument({list:[{authtype:\"test\",user:\"test@user.email\"}]})\nasync function showListElements(body){\n    const respJson = await getSubList(body)\n    if (!respJson) return\n    addEntriesToDocument(respJson)\n    \n    \n}\n\n\nlistSubscription.onclick = async() => {\n    showListElements()\n}\n\nfunction simulateClickOnElement(element) {\n    // Create a new MouseEvent\n    const iframePosition = vCam.element.getBoundingClientRect();\n    const mouseEvent = new MouseEvent('click', {\n        bubbles: true,           // Allow the event to bubble up through the DOM\n        cancelable: true,        // Allow the event to be canceled\n     \n        screenX: iframePosition.left,              // X coordinate of the mouse click (not needed, but set to 0)\n        screenY: iframePosition.top               // Y coordinate of the mouse click (not needed, but set to 0)\n    });\n\n    // Dispatch the event to the given element\n    vCam.element.dispatchEvent(mouseEvent);\n}\n\nfunction createVCam(request,videoelement,holder){\n    // const size = {width:\"50px\",height:\"320px\"}\n    // const iframeUrl = \"https://dev.flexatar-sdk.com/v-cam/index.html\"\n    const iframeUrl = \"http://localhost:8080\"\n    const vCam = _ftar_v_cam_js__WEBPACK_IMPORTED_MODULE_3___default().getVCamElement(iframeUrl)\n    vCam.element.scrollbarWidth=\"none\"\n    \n    vCam.style.display = \"none\"\n    vCam.resolution = {width:240,height:320}\n    vCam.setupTokenFetch(\"/usertoken\",\n        {\n            method: 'POST',\n            headers:{\"Content-Type\":\"application/json\"},\n            body: JSON.stringify(request)  \n        }\n    )\n    vCam.ontokenerror = (error)=>{\n        console.log(error)\n    }\n\n    vCam.onoutputstream = (mediaStream) => {\n        vCamTable.style.display = \"block\"\n        vCam.element.style.display = \"block\"\n        videoelement.srcObject = mediaStream\n        vCam.element.scrollbarColor = \"transparent transparent\"\n    }\n\n    vCam.background = \"./static/background0.jpg\"\n    vCam.mount(holder)\n\n\n   \n    return vCam\n}\nlet vCam\n\n\n\n\n\n\nlet overlay \n\n\nfunction createOverlay(callback){\n    if (vCam.isAudioReady){\n        callback()\n        return\n    }\n    const overlay = document.createElement(\"div\");\n    overlay.style.position = \"fixed\";\n    overlay.style.top = \"0\";\n    overlay.style.left = \"0\";\n    overlay.style.width = \"100vw\";\n    overlay.style.height = \"100vh\";\n    overlay.style.background = \"rgba(0, 0, 0, 0.8)\"; // Semi-transparent black\n    overlay.style.zIndex = \"9999\";\n    overlay.style.pointerEvents = \"auto\"; // Blocks interaction\n    function updateOverlay() {\n        let rect = iframeHolder.getBoundingClientRect();\n        let { left, top, width, height } = rect;\n    \n        // Update clip-path to match new position\n        overlay.style.clipPath = `polygon(\n            0% 0%, 100% 0%, 100% 100%, 0% 100%, \n            0% ${top}px, \n            ${left+1}px ${top+1}px, \n            ${left+1}px ${top + height}px, \n            ${left + width}px ${top + height}px, \n            ${left + width}px ${top+1}px, \n            0% ${top+1}px\n        )`;\n    }\n\n    updateOverlay()\n\n    document.body.appendChild(overlay);\n    window.addEventListener(\"resize\", updateOverlay);\n    window.addEventListener(\"scroll\", updateOverlay, { passive: true });\n    vCam.requestAudioPermition(()=>{\n        overlay.remove()\n        window.removeEventListener(\"resize\", updateOverlay);\n        window.removeEventListener(\"scroll\", updateOverlay);\n        // console.log(\"granted\")\n        callback()\n        \n    })\n}\n\nmicButton.onclick = async () => {\n    createOverlay(async ()=>{\n        vCam.src = await navigator.mediaDevices.getUserMedia({ audio: true });\n        videoFromIframe.muted = true\n    })\n   \n}\nspeakButton.onclick = async () => {\n\n    createOverlay(()=>{\n        vCam.src = \"./static/Mary.mp3\"\n        videoFromIframe.muted = false\n    })\n}\n\n\nstopButton.onclick = async () => {\n    vCam.src = null\n}\n\n\n\n\n//# sourceURL=webpack://server/./src/index.js?");

/***/ }),

/***/ "./src/list-item.js":
/*!**************************!*\
  !*** ./src/list-item.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   listItem: () => (/* binding */ listItem)\n/* harmony export */ });\n/* harmony import */ var _util_popup_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../util/popup.js */ \"../util/popup.js\");\n\n\n\nfunction listItem(entry,opts){\n    const container = document.createElement(\"span\")\n    container.style.display = \"flex\"\n    container.style.flexDirection = \"row\"\n    container.style.gap = \"20px\"\n\n    const arrow = document.createElement(\"span\")\n    arrow.innerText = \"->\"\n\n    const authtype = document.createElement(\"span\")\n    authtype.innerText = entry.authtype\n    \n    const user = document.createElement(\"span\")\n    user.innerText = entry.user\n\n    const button = document.createElement(\"button\")\n    button.innerText = \"...\"\n    container.appendChild(arrow)\n    container.appendChild(authtype)\n    container.appendChild(user)\n    container.appendChild(button)\n    const reqBody = {authtype:entry.authtype,user:entry.user}\n    button.onclick = () =>{\n        ;(0,_util_popup_js__WEBPACK_IMPORTED_MODULE_0__.showPopup)({\n            buttons:[\n                {\n                    text:\"Show V-Cam\",\n                    onclick:async closeHandler =>{\n                        closeHandler()\n                        if (opts.vcam) opts.vcam(reqBody)\n                        /*\n                        const resp = await fetch(\"/usertoken\",{\n                            method: 'POST',\n                            headers:{\"Content-Type\":\"application/json\"},\n                            body: JSON.stringify(reqBody)\n                        })\n\n                        if (resp.ok){\n                            const respJson = await resp.json()\n                            \n                            userTokenPlaceHolder.innerText = respJson.token\n                           \n\n                        }else{\n                            console.log(await resp.text())\n                        }*/\n                        \n                    }\n                },\n                {\n                    text:\"Delete Subscription\",\n                    onclick:async closeHandler =>{\n                        closeHandler()\n                        const resp = await fetch(\"/delsubscription\",{\n                            method: 'POST',\n                            headers:{\"Content-Type\":\"application/json\"},\n                            body: JSON.stringify(reqBody)\n                        })\n                        if (resp.ok){\n                            console.log(\"deletion success\")\n                            container.remove()\n                        }\n                        \n                    }\n                },{\n                    text:\"Cancel\",\n                    onclick:async closeHandler =>{\n                        closeHandler()\n                    }\n                }\n            ]\n        })\n    }\n    return container\n\n}\n\n//# sourceURL=webpack://server/./src/list-item.js?");

/***/ }),

/***/ "./src/sub-create-container.js":
/*!*************************************!*\
  !*** ./src/sub-create-container.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createContainer: () => (/* binding */ createContainer)\n/* harmony export */ });\nfunction createContainer() {\n    // Create a div to hold the elements\n    const container = document.createElement('div');\n    container.className = 'container';\n\n    // Create the authtype input\n    const authTypeInput = document.createElement('input');\n    authTypeInput.type = 'text';\n    authTypeInput.placeholder = 'authtype';\n    authTypeInput.name = 'authtype';\n    authTypeInput.value = \"test\"\n    container.appendChild(authTypeInput);\n\n    // Create the user input\n    const userInput = document.createElement('input');\n    userInput.type = 'text';\n    userInput.placeholder = 'user';\n    userInput.name = 'user';\n    userInput.value = 'test@user.email';\n    userInput.style.marginLeft = '10px'; // Add spacing\n    container.appendChild(userInput);\n\n    // Create the checkbox\n    const checkbox = document.createElement('input');\n    checkbox.type = 'checkbox';\n    checkbox.id = 'testingCheckbox';\n    checkbox.name = 'testing';\n    checkbox.checked = 'true';\n\n    // Create the label for the checkbox\n    const label = document.createElement('label');\n    label.htmlFor = 'testingCheckbox';\n    label.textContent = 'testing';\n\n    // Append checkbox and label to container\n    container.appendChild(checkbox);\n    container.appendChild(label);\n\n    return {container,checkbox,authTypeInput,userInput}\n}\n\n//# sourceURL=webpack://server/./src/sub-create-container.js?");

/***/ }),

/***/ "../util/popup.js":
/*!************************!*\
  !*** ../util/popup.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   showAlert: () => (/* binding */ showAlert),\n/* harmony export */   showConfirm: () => (/* binding */ showConfirm),\n/* harmony export */   showPopup: () => (/* binding */ showPopup)\n/* harmony export */ });\n\nconst popupBlockingOverlay = document.createElement(\"div\")\npopupBlockingOverlay.className = \"popup-overlay\"\n\nconst popupWindow = document.createElement(\"div\")\npopupWindow.className = \"popup-window\"\npopupBlockingOverlay.appendChild(popupWindow)\n\nconst confirmTextElement = document.createElement(\"span\")\npopupWindow.appendChild(confirmTextElement)\n\nconst customElementPlaceHolder = document.createElement(\"span\")\ncustomElementPlaceHolder.id = \"customElementPlaceHolder\"\npopupWindow.appendChild(customElementPlaceHolder)\n\nconst buttonContainer = document.createElement(\"span\")\npopupWindow.appendChild(buttonContainer)\nbuttonContainer.style.display = \"flex\"\nbuttonContainer.style.flexDirection = \"row\"\nbuttonContainer.style.gap = \"20px\"\nbuttonContainer.style.justifyContent = \"center\"\nbuttonContainer.style.alignItems = \"center\"\ndocument.body.appendChild(popupBlockingOverlay)\n// console.log(\"popup ready\")\n\nfunction showPopup(opts){\n    const allElements = []\n    popupBlockingOverlay.style.display = \"flex\"\n    if (opts.text)\n        confirmTextElement.innerText = opts.text\n    else\n        confirmTextElement.innerText = \"\"\n    if (opts.customElement){\n        customElementPlaceHolder.appendChild(opts.customElement)\n        allElements.push(opts.customElement)\n    }\n\n    for (const button of opts.buttons){\n        const buttonElement = document.createElement(\"button\")\n        buttonElement.className = \"button-flexatar-style\"\n        buttonElement.innerText = button.text\n        buttonContainer.appendChild(buttonElement)\n        allElements.push(buttonElement)\n        buttonElement.onclick = () =>{\n            button.onclick(()=>{\n                // console.log(\"b click\")\n                for (const el of allElements){\n                    el.remove()\n                }\n                confirmTextElement.innerText = \"\"\n                popupBlockingOverlay.style.display = \"none\"\n            })\n        }\n    }\n\n}\n\nfunction showAlert(alertText,action){\n    showPopup({text:alertText,\n        buttons:[\n            {\n                text:\"OK\",\n                onclick:closeHandler =>{\n                   \n                    closeHandler()\n                    if (action) action()\n                }\n            }\n        ]\n    })\n}\n\nfunction showConfirm(alertText,action){\n    showPopup({text:alertText,\n        buttons:[\n            {\n                text:\"OK\",\n                onclick:closeHandler =>{\n                   \n                    closeHandler()\n                    if (action) action()\n                }\n            },\n            {\n                text:\"CANCEL\",\n                onclick:closeHandler =>{\n                   \n                    closeHandler()\n                    \n                }\n            }\n        ]\n    })\n}\n\n//# sourceURL=webpack://server/../util/popup.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.js");
/******/ 	
/******/ })()
;