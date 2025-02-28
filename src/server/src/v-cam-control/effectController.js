


    

export function effectController(containerId, stateChangeCallback, sliderChangeCallback, checkboxChangeCallback) {
    const DEFAULT_STATE = "no";
    const DEFAULT_SLIDER_VALUE = 0.5;
    const DEFAULT_CHECKBOX_STATUS = true;
    const STATE_LIST = ["no", "morph", "hybrid"];

    try {
        const container = document.getElementById(containerId);
        if (!container) {
            return { initError: "Container ID does not exist in the DOM" };
        }

        if (typeof stateChangeCallback !== 'function' || 
            typeof sliderChangeCallback !== 'function' || 
            typeof checkboxChangeCallback !== 'function') {
            return { initError: "Invalid callback functions provided" };
        }

        const stateSelect = document.createElement('select');
        STATE_LIST.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.text = state;
            stateSelect.appendChild(option);
        });
        stateSelect.value = DEFAULT_STATE;
        stateSelect.addEventListener('change', () => stateChangeCallback(stateSelect.value));

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.01;
        slider.value = DEFAULT_SLIDER_VALUE;
        slider.addEventListener('input', () => sliderChangeCallback(parseFloat(slider.value)));

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = DEFAULT_CHECKBOX_STATUS;
        checkbox.addEventListener('change', () => checkboxChangeCallback(checkbox.checked));

        container.appendChild(stateSelect);
        container.appendChild(slider);
        container.appendChild(checkbox);

        return { initError: "" };
    } catch (error) {
        return { initError: "An unexpected error occurred during initialization" };
    }
}

    

