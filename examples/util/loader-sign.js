
const loaderSign = document.createElement("div")
loaderSign.className = "popup-overlay"
loaderSign.style.display = "none"

const loaderFrame = document.createElement("div")
loaderFrame.className = "loader-frame"
loaderSign.appendChild(loaderFrame)


const loader = document.createElement("div")
loader.className = "loader"
loaderFrame.appendChild(loader)
document.body.appendChild(loaderSign)

export function showLoader(){
    loaderSign.style.display = "flex"

}

export function hideLoader(){
    loaderSign.style.display = "none"

}