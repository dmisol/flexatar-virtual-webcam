

const self = {name:"timer"}
export const timer = async (inputs) => {
    

let { tickCallback } = inputs;

let startTime = Date.now();
let intervalId;
let isStopped = false;

async function callTickCallback() {
    while (!isStopped) {
        let duration = Math.floor((Date.now() - startTime) / 1000);
        await tickCallback({ duration });
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

intervalId = setInterval(callTickCallback, 1000);

async function stopTimer() {
    if (!isStopped) {
        clearInterval(intervalId);
        isStopped = true;
        let totalDuration = Math.floor((Date.now() - startTime) / 1000);
        return { totalDuration };
    }
}

return { stopTimer };

    
}
