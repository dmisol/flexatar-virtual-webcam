


    

export const ERROR_CONTAINER_NOT_FOUND = "Container not found";
export const ERROR_EMOTION_IDS_EMPTY = "Emotion IDs array is empty";

export function initVCamEmoCtl(containerId, emotionIds, onButtonClickCallback) {
    let initializationError = "";

    try {
        if (typeof containerId !== 'string' || containerId.trim() === '') {
            throw new Error(ERROR_CONTAINER_NOT_FOUND);
        }

        const container = document.getElementById(containerId);
        if (!container) {
            throw new Error(ERROR_CONTAINER_NOT_FOUND);
        }

        if (!Array.isArray(emotionIds) || emotionIds.length === 0) {
            throw new Error(ERROR_EMOTION_IDS_EMPTY);
        }

        if (typeof onButtonClickCallback !== 'function' && onButtonClickCallback !== undefined) {
            throw new Error("Invalid callback function");
        }

        emotionIds.forEach(emotionId => {
            const button = document.createElement('button');
            button.textContent = emotionId;

            if (onButtonClickCallback) {
                button.addEventListener('click', () => onButtonClickCallback(emotionId));
            }
            container.appendChild(button);
        });

    } catch (error) {
        console.log("error",error)
        initializationError = error.message;
    }

    return initializationError;
}

    

