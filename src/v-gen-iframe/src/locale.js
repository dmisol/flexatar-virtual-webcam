

const locale = await (await fetch("./static/locale_en.json")).json()
const htmlTexts = locale.html
for (const elementId in htmlTexts){
    // console.log(elementId)
    document.getElementById(elementId).textContent = htmlTexts[elementId]
}
export const texts = locale.js