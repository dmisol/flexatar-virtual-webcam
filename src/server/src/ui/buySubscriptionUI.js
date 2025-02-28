import {createContainer} from "../sub-create-container.js"
import {showPopup} from "../../../util/popup.js"

export function buySubscriptionUI(
    buyButtonId,
    subscriptionReadyCallback,
    addLog
){
    const buySybscription = document.getElementById(buyButtonId)
    buySybscription.onclick = async() => {

        const containerElements = createContainer();
        showPopup({
            customElement:containerElements.container,
            buttons:[
                {
                    text:"BUY",
                    onclick:async closeHandler =>{
                        closeHandler()
                        addLog("Start buy subscription.")
                        subscriptionReadyCallback(await handleBuySubscription(containerElements));
                    }
                   
                },{
                    text:"CANCEL",
                    onclick:async closeHandler =>{
                        closeHandler()
                    }
                }
            ]
    
        })
      
    }
}

async function handleBuySubscription(containerElements) {
    const reqBody = {
        authtype: containerElements.authTypeInput.value,
        user: containerElements.userInput.value,
        testing: containerElements.checkbox.checked,
        crt: crypto.randomUUID()
    };

    try {
        const resp = await fetch("/buysubscription", {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reqBody)
        });

        if (!resp.ok) {
            return {error: await resp.text()}
            // console.error
            // (await resp.json());
        } else {
            console.log("buy subscription success");
            return reqBody
            
        }
    } catch (error) {
        return {error:error}
        console.error("Error buying subscription:", error);
    }
}

