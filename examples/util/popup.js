
const popupBlockingOverlay = document.createElement("div")
popupBlockingOverlay.className = "popup-overlay"

const popupWindow = document.createElement("div")
popupWindow.className = "popup-window"
popupBlockingOverlay.appendChild(popupWindow)

const confirmTextElement = document.createElement("span")
popupWindow.appendChild(confirmTextElement)

const customElementPlaceHolder = document.createElement("span")
customElementPlaceHolder.id = "customElementPlaceHolder"
popupWindow.appendChild(customElementPlaceHolder)

const buttonContainer = document.createElement("span")
popupWindow.appendChild(buttonContainer)
buttonContainer.style.display = "flex"
buttonContainer.style.flexDirection = "row"
buttonContainer.style.gap = "20px"
buttonContainer.style.justifyContent = "center"
buttonContainer.style.alignItems = "center"
document.body.appendChild(popupBlockingOverlay)
console.log("popup ready")

export function showPopup(opts){
    const allElements = []
    popupBlockingOverlay.style.display = "flex"
    if (opts.text)
        confirmTextElement.innerText = opts.text
    else
        confirmTextElement.innerText = ""
    if (opts.customElement){
        customElementPlaceHolder.appendChild(opts.customElement)
        allElements.push(opts.customElement)
    }

    for (const button of opts.buttons){
        const buttonElement = document.createElement("button")
        buttonElement.className = "button-flexatar-style"
        buttonElement.innerText = button.text
        buttonContainer.appendChild(buttonElement)
        allElements.push(buttonElement)
        buttonElement.onclick = () =>{
            button.onclick(()=>{
                // console.log("b click")
                for (const el of allElements){
                    el.remove()
                }
                confirmTextElement.innerText = ""
                popupBlockingOverlay.style.display = "none"
            })
        }
    }

}

export function showAlert(alertText,action){
    showPopup({text:alertText,
        buttons:[
            {
                text:"OK",
                onclick:closeHandler =>{
                   
                    closeHandler()
                    if (action) action()
                }
            }
        ]
    })
}

export function showConfirm(alertText,action){
    showPopup({text:alertText,
        buttons:[
            {
                text:"OK",
                onclick:closeHandler =>{
                   
                    closeHandler()
                    if (action) action()
                }
            },
            {
                text:"CANCEL",
                onclick:closeHandler =>{
                   
                    closeHandler()
                    
                }
            }
        ]
    })
}