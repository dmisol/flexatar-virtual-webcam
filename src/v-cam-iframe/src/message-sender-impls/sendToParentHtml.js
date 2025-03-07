

function isAndroidWebView() {
    return typeof AndroidInterface !== "undefined";
}

// if (isAndroidWebView()) {
//     console.log("Running inside Android WebView");
// } else {
//     console.log("Not running in Android WebView");
// }



export function sendToParent(payload,id){
    if (isAndroidWebView()){
        AndroidInterface.postMessage(JSON.stringify(payload));
    }else{
        let sendObject
        if (id){
            sendObject = {}
            sendObject[id] = payload
        }else{
            sendObject = payload
        }
        window.parent.postMessage({flexatar: sendObject }, '*');
    }
   
}

