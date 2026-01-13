

export function moveToPosition(portSelf,position,pattern_length){
    lineOverlay.style.left =`${Math.trunc(100*position/pattern_length)}%`
    if (!portSelf) return
    portSelf.postMessage({ animationPatternRequest: { position:{value:position}} })
    


}
