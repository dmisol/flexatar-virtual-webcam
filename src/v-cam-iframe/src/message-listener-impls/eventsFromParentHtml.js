
function isAndroidWebView() {
    return typeof AndroidInterface !== "undefined";
}

let androidCallback
function receiveMessageFromAndroid(message) {
    console.log("====message===")
    console.log(message)
    if (androidCallback) androidCallback(JSON.parse(message))
    console.log("Received from Android:", message);
    // document.getElementById("responseText").innerText = "Android says: " + message;
}
window.receiveMessageFromAndroid = receiveMessageFromAndroid;
export function eventProvider(callback,withId){
    if (isAndroidWebView()){
        androidCallback = callback
    }else{
        window.addEventListener('message', async (event) => {

            // Access the message data
            let data = event.data;
            if (!data.flexatar){return}
            data = data.flexatar
            if (withId){
                data = data[withId]
            }
            callback(data)
    
        })

    }
   

}