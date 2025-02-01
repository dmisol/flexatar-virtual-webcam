export function createContainer() {
    // Create a div to hold the elements
    const container = document.createElement('div');
    container.className = 'container';

    // Create the authtype input
    const authTypeInput = document.createElement('input');
    authTypeInput.type = 'text';
    authTypeInput.placeholder = 'authtype';
    authTypeInput.name = 'authtype';
    authTypeInput.value = "test"
    container.appendChild(authTypeInput);

    // Create the user input
    const userInput = document.createElement('input');
    userInput.type = 'text';
    userInput.placeholder = 'user';
    userInput.name = 'user';
    userInput.value = 'test@user.email';
    userInput.style.marginLeft = '10px'; // Add spacing
    container.appendChild(userInput);

    // Create the checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'testingCheckbox';
    checkbox.name = 'testing';
    checkbox.checked = 'true';

    // Create the label for the checkbox
    const label = document.createElement('label');
    label.htmlFor = 'testingCheckbox';
    label.textContent = 'testing';

    // Append checkbox and label to container
    container.appendChild(checkbox);
    container.appendChild(label);

    return {container,checkbox,authTypeInput,userInput}
}