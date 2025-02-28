

const self = {name:"toggleRecordButtonIcon"}
export const toggleRecordButtonIcon = async (inputs) => {
    

let {recordIconElement, stopIconElement, invisibleClassName} = inputs;

async function makeRecordVisible() {
    if (recordIconElement.classList.contains(invisibleClassName)) {
        recordIconElement.classList.remove(invisibleClassName);
    }
}

async function makeStopVisible() {
    if (stopIconElement.classList.contains(invisibleClassName)) {
        stopIconElement.classList.remove(invisibleClassName);
    }
}

async function makeRecordInvisible() {
    if (!recordIconElement.classList.contains(invisibleClassName)) {
        recordIconElement.classList.add(invisibleClassName);
    }
}

async function makeStopInvisible() {
    if (!stopIconElement.classList.contains(invisibleClassName)) {
        stopIconElement.classList.add(invisibleClassName);
    }
}

return {makeRecordVisible, makeStopVisible, makeRecordInvisible, makeStopInvisible};

    
}
