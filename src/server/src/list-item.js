import {showPopup} from "../../util/popup.js"


export function listItem(entry,opts){
    const container = document.createElement("span")
    container.style.display = "flex"
    container.style.flexDirection = "row"
    container.style.gap = "20px"

    const arrow = document.createElement("span")
    arrow.innerText = "->"

    const authtype = document.createElement("span")
    authtype.innerText = entry.authtype
    
    const user = document.createElement("span")
    user.innerText = entry.user

    const button = document.createElement("button")
    button.innerText = "..."
    container.appendChild(arrow)
    container.appendChild(authtype)
    container.appendChild(user)
    container.appendChild(button)
    const reqBody = {authtype:entry.authtype,user:entry.user}
    button.onclick = () =>{
        showPopup({
            buttons:[
                {
                    text:"Show V-Cam",
                    onclick:async closeHandler =>{
                        closeHandler()
                        if (opts.vcam) opts.vcam(reqBody)
                    }
                },
                {
                    text:"Show V-Gen",
                    onclick:async closeHandler =>{
                        closeHandler()
                        if (opts.vgen) opts.vgen(reqBody)
                    }
                },
                {
                    text:"Delete Subscription",
                    onclick:async closeHandler =>{
                        closeHandler()
                        const resp = await fetch("/delsubscription",{
                            method: 'POST',
                            headers:{"Content-Type":"application/json"},
                            body: JSON.stringify(reqBody)
                        })
                        if (resp.ok){
                            console.log("deletion success")
                            container.remove()
                        }
                        
                    }
                },{
                    text:"Cancel",
                    onclick:async closeHandler =>{
                        closeHandler()
                    }
                }
            ]
        })
    }
    return container

}