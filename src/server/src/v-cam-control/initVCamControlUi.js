


    

export function initVCamControlUi(previewImageContainerId, flexatarItemList, onFlexatarClicked, onEffectClicked, onFlexatarDeleteClicked) {
    let initError = '';
    const container = document.getElementById(previewImageContainerId);

    if (!container) {
        initError = 'Container not found';
        return { initError, removeFlexatarItem, addFlexatarItem, clear };
    }

    if (!Array.isArray(flexatarItemList) || !flexatarItemList.every(item => item.id && item.previewImage)) {
        initError = 'Invalid flexatar item list';
        return { initError, removeFlexatarItem, addFlexatarItem, clear };
    }

    container.style.display = 'flex';
    container.style.flexDirection = 'row';

    function removeFlexatarItem(flexatarId) {
        const itemElement = container.querySelector(`[data-id="${flexatarId}"]`);
        if (itemElement) {
            container.removeChild(itemElement);
        }
    }

    function addFlexatarItem(flexatarId, previewImageBase64Url) {
        const itemElement = createFlexatarItemElement(flexatarId, previewImageBase64Url);
        container.insertBefore(itemElement, container.firstChild);
    }

    function clear() {
        container.innerHTML = '';
    }

    function createFlexatarItemElement(flexatarId, previewImageUrl) {
        const itemElement = document.createElement('div');
        itemElement.setAttribute('data-id', flexatarId);
        itemElement.style.display = 'flex';
        itemElement.style.flexDirection = 'column';
        itemElement.style.alignItems = 'center';

        const img = document.createElement('img');
        img.src = previewImageUrl;
        img.style.width = '60px';
        img.style.height = 'auto';
        img.addEventListener('click', () => onFlexatarClicked(flexatarId));

        const effectButton = document.createElement('button');
        effectButton.innerText = 'Effect';
        effectButton.addEventListener('click', () => onEffectClicked(flexatarId));

        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'Delete';
        deleteButton.addEventListener('click', () => onFlexatarDeleteClicked(flexatarId));

        itemElement.appendChild(img);
        itemElement.appendChild(effectButton);
        itemElement.appendChild(deleteButton);

        return itemElement;
    }

    flexatarItemList.forEach(item => {
        const itemElement = createFlexatarItemElement(item.id, item.previewImage);
        container.appendChild(itemElement);
    });

    return { initError, removeFlexatarItem, addFlexatarItem, clear };
}

    

