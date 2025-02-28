

const self = {name:"logger"}
export const logger = async (inputs) => {
    

let {isLoggingOn, logMessageCallback} = inputs;

const logFunction = async ({functionName, messageToLog}) => {
    if (typeof isLoggingOn !== 'boolean') {
        console.log(inputs);
        return;
    }

    if (isLoggingOn && typeof functionName === 'string' && typeof messageToLog === 'string') {
        await logMessageCallback({functionName, messageToLog});
    } else {
        console.log(inputs);
    }
};

return {logFunction};

    
}
