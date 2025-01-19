/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _list_item_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./list-item.js */ \"./src/list-item.js\");\n/* harmony import */ var _sub_create_container_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./sub-create-container.js */ \"./src/sub-create-container.js\");\n/* harmony import */ var _util_popup_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../util/popup.js */ \"../util/popup.js\");\n/* harmony import */ var _util_drop_zone_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../util/drop-zone.js */ \"../util/drop-zone.js\");\n\n\n\n\n\nfunction getToken(){\n    return userTokenPlaceHolder.innerText\n}\n\nbuySybscription.onclick = async() => {\n\n    const containerElements = (0,_sub_create_container_js__WEBPACK_IMPORTED_MODULE_1__.createContainer)();\n    (0,_util_popup_js__WEBPACK_IMPORTED_MODULE_2__.showPopup)({\n        customElement:containerElements.container,\n        buttons:[\n            {\n                text:\"BUY\",\n                onclick:async closeHandler =>{\n                    closeHandler()\n                    const reqBody = {\n                        authtype:containerElements.authTypeInput.value,\n                        user:containerElements.userInput.value,\n                        testing:containerElements.checkbox.checked,\n                        crt:crypto.randomUUID()\n                    }\n                   \n                    // todo fetch with retry\n                    const resp = await fetch(\"/buysubscription\",{\n                        method: 'POST',\n                        headers:{\"Content-Type\":\"application/json\"},\n                        body: JSON.stringify(reqBody)\n                    })\n                    if (!resp.ok){\n                        console.log(await resp.json())\n                    }else{\n                        console.log(\"buy subscription success\")\n                    }\n\n                }\n               \n            },{\n                text:\"CANCEL\",\n                onclick:async closeHandler =>{\n                    closeHandler()\n                }\n            }\n        ]\n\n    })\n  \n}\n\nlet flexatarSDK\nasync function showListElements(body){\n    if (!body) body = {}\n    const resp = await fetch(\"/listsubscription\",{\n        method: 'POST',\n        headers:{\"Content-Type\":\"application/json\"},\n        body:JSON.stringify(body)\n    })\n    if (resp.error){\n        return\n    }\n    const respJson = await resp.json()\n    for (const entry of respJson.list){\n        const subscription = (0,_list_item_js__WEBPACK_IMPORTED_MODULE_0__.listItem)(entry,()=>{\n            flexatarSDK = new FtarView.SDK(getToken())\n        })\n\n        subscriptionsContainer.appendChild(subscription)\n    }\n\n    if (respJson.continue){\n        showMoreButton.style.display = \"block\"\n        showMoreButton.onclick =  () =>{\n            showListElements({continue:respJson.continue})\n        }\n    }else{\n        showMoreButton.style.display = \"none\"\n    }\n    \n}\n\nlistSubscription.onclick = async() => {\n    showListElements()\n}\n\n\nlet renderer\nasync function addPreview(ftarLink){\n    const previewImg = await FtarView.getPreview(ftarLink);\n            \n    const preview = document.createElement(\"img\")\n    preview.src = previewImg\n    preview.style.cursor = \"pointer\"\n    preview.style.width = '75px'; \n    preview.style.height = 'auto'; \n    preview.style.objectFit = 'contain';\n    flexatarPreviewContainer.appendChild(preview)\n    preview.onclick = async () =>{\n        if (!flexatarSDK) return\n        if (!renderer){\n            renderer = await flexatarSDK.getRenderer()\n        }\n        const ftarEntry = await FtarView.flexatarEntry(getToken(),ftarLink.id,{ftar:true})\n        const ftar = await FtarView.getFlexatar(ftarEntry);\n\n        renderer.slot1 = ftar\n        renderer.start()\n        renderer.canvas.width=240\n        renderer.canvas.height=320\n        ;(0,_util_popup_js__WEBPACK_IMPORTED_MODULE_2__.showPopup)({\n            customElement:renderer.canvas,\n            buttons:[\n                {\n                    text:\"REMOVE\",\n                    onclick:async closeHandler =>{\n                        closeHandler()\n                        if (await FtarView.deleteFlexatar(ftarLink,getToken())){\n                            preview.remove()\n                            console.log(\"deletion success\")\n                        }else{\n                            console.log(\"deletion error\")\n                        }\n                    }\n                },\n                {\n                    text:\"CLOSE\",\n                    onclick:async closeHandler =>{\n                        closeHandler()\n                    }\n                }\n            ]\n    \n        })\n\n    }\n}\n\nconst imageDropZone = new _util_drop_zone_js__WEBPACK_IMPORTED_MODULE_3__.DropZone(\"Drag & drop frontal photo here or click to upload\")\nimageDropZone.handleFiles = (e) =>{\n    const file = e.target.files[0];\n   \n    const fileType = file.type;\n    if ((0,_util_drop_zone_js__WEBPACK_IMPORTED_MODULE_3__.checkFileType)(fileType,_util_drop_zone_js__WEBPACK_IMPORTED_MODULE_3__.imageMimeTypes)){\n        (0,_util_popup_js__WEBPACK_IMPORTED_MODULE_2__.showConfirm)(\"Make flexatar?\",async () =>{\n\n            const ftarLink = await FtarView.makeFlexatar(getToken(),file,\"noname\",{ftar:true,preview:true})\n            if (!ftarLink){\n                console.log(\"Unknown error\")\n            }\n            if (ftarLink.err){\n                if (ftarLink.reason){\n                    if (ftarLink.reason === \"queue_limit\"){\n                        console.log(\"Only one process at time allowed\")\n                    }else if (ftarLink.reason === \"subscription_limit\") {\n                        console.log(\"Out of Subscription Limit\")\n                    }else if (ftarLink.reason === \"bad_photo\") {\n                        console.log(\"Bad Photo\")\n                    }\n                }\n                return\n            }\n            console.log(\"ftar-sucess\")\n            addPreview(ftarLink)\n            \n            return\n\n        })\n\n    }\n}\nflexatarImageDropDownContainer.appendChild(imageDropZone.dropZone)\n\n\nshowFlexatarPreview .onclick = async() => {\n\n    const ftarList = await FtarView.flexatarList(getToken(),{preview:true})\n   \n    for (const listElement of ftarList){\n        await addPreview(listElement)\n    }\n}\n\n\n\n\n//# sourceURL=webpack://server/./src/index.js?");

/***/ }),

/***/ "./src/list-item.js":
/*!**************************!*\
  !*** ./src/list-item.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   listItem: () => (/* binding */ listItem)\n/* harmony export */ });\n/* harmony import */ var _util_popup_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../util/popup.js */ \"../util/popup.js\");\n\n\n\nfunction listItem(entry,tokenReady){\n    const container = document.createElement(\"span\")\n    container.style.display = \"flex\"\n    container.style.flexDirection = \"row\"\n    container.style.gap = \"20px\"\n\n    const arrow = document.createElement(\"span\")\n    arrow.innerText = \"->\"\n\n    const authtype = document.createElement(\"span\")\n    authtype.innerText = entry.authtype\n    \n    const user = document.createElement(\"span\")\n    user.innerText = entry.user\n\n    const button = document.createElement(\"button\")\n    button.innerText = \"...\"\n    container.appendChild(arrow)\n    container.appendChild(authtype)\n    container.appendChild(user)\n    container.appendChild(button)\n    const reqBody = {authtype:entry.authtype,user:entry.user}\n    button.onclick = () =>{\n        ;(0,_util_popup_js__WEBPACK_IMPORTED_MODULE_0__.showPopup)({\n            buttons:[\n                {\n                    text:\"Get User Token\",\n                    onclick:async closeHandler =>{\n                        closeHandler()\n                        const resp = await fetch(\"/usertoken\",{\n                            method: 'POST',\n                            headers:{\"Content-Type\":\"application/json\"},\n                            body: JSON.stringify(reqBody)\n                        })\n\n                        if (resp.ok){\n                            const respJson = await resp.json()\n                            \n                            userTokenPlaceHolder.innerText = respJson.token\n                            if (tokenReady) tokenReady()\n\n                        }else{\n                            console.log(await resp.text())\n                        }\n                        \n                    }\n                },\n                {\n                    text:\"Delete Subscription\",\n                    onclick:async closeHandler =>{\n                        closeHandler()\n                        const resp = await fetch(\"/delsubscription\",{\n                            method: 'POST',\n                            headers:{\"Content-Type\":\"application/json\"},\n                            body: JSON.stringify(reqBody)\n                        })\n                        if (resp.ok){\n                            console.log(\"deletion success\")\n                            container.remove()\n                        }\n                        \n                    }\n                },{\n                    text:\"Cancel\",\n                    onclick:async closeHandler =>{\n                        closeHandler()\n                    }\n                }\n            ]\n        })\n    }\n    return container\n\n}\n\n//# sourceURL=webpack://server/./src/list-item.js?");

/***/ }),

/***/ "./src/sub-create-container.js":
/*!*************************************!*\
  !*** ./src/sub-create-container.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createContainer: () => (/* binding */ createContainer)\n/* harmony export */ });\nfunction createContainer() {\n    // Create a div to hold the elements\n    const container = document.createElement('div');\n    container.className = 'container';\n\n    // Create the authtype input\n    const authTypeInput = document.createElement('input');\n    authTypeInput.type = 'text';\n    authTypeInput.placeholder = 'authtype';\n    authTypeInput.name = 'authtype';\n    authTypeInput.value = \"test\"\n    container.appendChild(authTypeInput);\n\n    // Create the user input\n    const userInput = document.createElement('input');\n    userInput.type = 'text';\n    userInput.placeholder = 'user';\n    userInput.name = 'user';\n    userInput.value = 'test@user.email';\n    userInput.style.marginLeft = '10px'; // Add spacing\n    container.appendChild(userInput);\n\n    // Create the checkbox\n    const checkbox = document.createElement('input');\n    checkbox.type = 'checkbox';\n    checkbox.id = 'testingCheckbox';\n    checkbox.name = 'testing';\n    checkbox.checked = 'true';\n\n    // Create the label for the checkbox\n    const label = document.createElement('label');\n    label.htmlFor = 'testingCheckbox';\n    label.textContent = 'testing';\n\n    // Append checkbox and label to container\n    container.appendChild(checkbox);\n    container.appendChild(label);\n\n    return {container,checkbox,authTypeInput,userInput}\n}\n\n//# sourceURL=webpack://server/./src/sub-create-container.js?");

/***/ }),

/***/ "../util/drop-zone.js":
/*!****************************!*\
  !*** ../util/drop-zone.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DropZone: () => (/* binding */ DropZone),\n/* harmony export */   checkFileType: () => (/* binding */ checkFileType),\n/* harmony export */   imageMimeTypes: () => (/* binding */ imageMimeTypes)\n/* harmony export */ });\nclass DropZone {\n\n    constructor(text,accept){\n        this.dropZone = document.createElement(\"div\")\n        this.dropZone.className = \"drop-zone\"\n        this.dropZoneText = document.createElement(\"p\")\n        this.dropZoneText.innerText = text\n        this.dropZone.appendChild(this.dropZoneText)\n        const input=document.createElement('input');\n        input.type=\"file\";\n        if (accept){\n            input.accept = accept\n        }else{\n            input.accept=\"image/*\"\n        }\n        input.onchange = e => this.handleFiles(e)\n\n        this.dropZone.onclick = () =>{\n            input.click()\n        }\n        this.dropZone.ondragover = (e)=>{\n            e.preventDefault();\n            this.dropZone.classList.add('hover');\n        }\n        \n        this.dropZone.ondragleave = (e)=>{\n            this.dropZone.classList.remove('hover');\n        }\n        this.dropZone.ondrop = e =>{\n            e.preventDefault();\n            this.dropZone.classList.remove('hover');\n            const files = e.dataTransfer.files;\n            this.handleFiles({ target: { files } });\n        }\n\n    }\n    hide(){\n        this.dropZone.style.display = \"none\"\n    }\n    show(){\n        this.dropZone.style.display = \"\"\n    }\n}\n\nconst imageMimeTypes = [\n    \"image/jpeg\",\"image/png\",\"image/bmp\",\"image/webp\",\"image/avif\",\"image/x-portable-bitmap\",\n    \"image/x-portable-anymap\",\"image/x-portable-pixmap\",\"image/tiff\"\n]\nfunction checkFileType(fileType, typelist){\n    for (const mimeType of typelist){\n        \n        if (fileType == mimeType) {\n            return true\n        }\n    }\n    return false\n}\n\n//# sourceURL=webpack://server/../util/drop-zone.js?");

/***/ }),

/***/ "../util/popup.js":
/*!************************!*\
  !*** ../util/popup.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   showAlert: () => (/* binding */ showAlert),\n/* harmony export */   showConfirm: () => (/* binding */ showConfirm),\n/* harmony export */   showPopup: () => (/* binding */ showPopup)\n/* harmony export */ });\n\nconst popupBlockingOverlay = document.createElement(\"div\")\npopupBlockingOverlay.className = \"popup-overlay\"\n\nconst popupWindow = document.createElement(\"div\")\npopupWindow.className = \"popup-window\"\npopupBlockingOverlay.appendChild(popupWindow)\n\nconst confirmTextElement = document.createElement(\"span\")\npopupWindow.appendChild(confirmTextElement)\n\nconst customElementPlaceHolder = document.createElement(\"span\")\ncustomElementPlaceHolder.id = \"customElementPlaceHolder\"\npopupWindow.appendChild(customElementPlaceHolder)\n\nconst buttonContainer = document.createElement(\"span\")\npopupWindow.appendChild(buttonContainer)\nbuttonContainer.style.display = \"flex\"\nbuttonContainer.style.flexDirection = \"row\"\nbuttonContainer.style.gap = \"20px\"\nbuttonContainer.style.justifyContent = \"center\"\nbuttonContainer.style.alignItems = \"center\"\ndocument.body.appendChild(popupBlockingOverlay)\nconsole.log(\"popup ready\")\n\nfunction showPopup(opts){\n    const allElements = []\n    popupBlockingOverlay.style.display = \"flex\"\n    if (opts.text)\n        confirmTextElement.innerText = opts.text\n    else\n        confirmTextElement.innerText = \"\"\n    if (opts.customElement){\n        customElementPlaceHolder.appendChild(opts.customElement)\n        allElements.push(opts.customElement)\n    }\n\n    for (const button of opts.buttons){\n        const buttonElement = document.createElement(\"button\")\n        buttonElement.className = \"button-flexatar-style\"\n        buttonElement.innerText = button.text\n        buttonContainer.appendChild(buttonElement)\n        allElements.push(buttonElement)\n        buttonElement.onclick = () =>{\n            button.onclick(()=>{\n                // console.log(\"b click\")\n                for (const el of allElements){\n                    el.remove()\n                }\n                confirmTextElement.innerText = \"\"\n                popupBlockingOverlay.style.display = \"none\"\n            })\n        }\n    }\n\n}\n\nfunction showAlert(alertText,action){\n    showPopup({text:alertText,\n        buttons:[\n            {\n                text:\"OK\",\n                onclick:closeHandler =>{\n                   \n                    closeHandler()\n                    if (action) action()\n                }\n            }\n        ]\n    })\n}\n\nfunction showConfirm(alertText,action){\n    showPopup({text:alertText,\n        buttons:[\n            {\n                text:\"OK\",\n                onclick:closeHandler =>{\n                   \n                    closeHandler()\n                    if (action) action()\n                }\n            },\n            {\n                text:\"CANCEL\",\n                onclick:closeHandler =>{\n                   \n                    closeHandler()\n                    \n                }\n            }\n        ]\n    })\n}\n\n//# sourceURL=webpack://server/../util/popup.js?");

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
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
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