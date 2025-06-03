


    

export function createSubscriptionElement(lineNumber, authTypeValue, userValue, authTypeWidth, userWidth, callbacks, itemRemovedUpdateCache) {
  try {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'row';

    const lineNumberElement = document.createElement('div');
    lineNumberElement.style.width = '20px';
    lineNumberElement.textContent = lineNumber;
    container.appendChild(lineNumberElement);

    const authTypeElement = document.createElement('div');
    authTypeElement.style.width = `${authTypeWidth}px`;
    authTypeElement.textContent = authTypeValue;
    container.appendChild(authTypeElement);

    const userElement = document.createElement('div');
    userElement.style.width = `${userWidth}px`;
    userElement.textContent = userValue;
    container.appendChild(userElement);

    const buttonsContainer = document.createElement('div');
    container.appendChild(buttonsContainer);

    const vCamButton = document.createElement('button');
    vCamButton.textContent = 'v-cam';
    vCamButton.onclick = () => callbacks.onVCam(authTypeValue, userValue);
    buttonsContainer.appendChild(vCamButton);

    // const vGenButton = document.createElement('button');
    // vGenButton.textContent = 'v-gen';
    // vGenButton.onclick = () => callbacks.onVGen(authTypeValue, userValue);
    // buttonsContainer.appendChild(vGenButton);

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'delete';
    deleteButton.onclick = async () => {
      if (await callbacks.onDelete(authTypeValue, userValue)) {
        container.remove();
        itemRemovedUpdateCache(authTypeValue, userValue);
      }
    };
    buttonsContainer.appendChild(deleteButton);

    return { initializationError: false, container };
  } catch (error) {
    return { initializationError: error.message, container: null };
  }
}

    

