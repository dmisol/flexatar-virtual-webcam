export class DropZone {

    constructor(text, accept) {
        this.dropZone = document.createElement("div")
        this.form = document.createElement("form")
        this.dropZone.className = "drop-zone"
        this.dropZoneText = document.createElement("p")
        this.dropZoneText.innerText = text
        this.dropZone.appendChild(this.dropZoneText)
        const input = document.createElement('input');
        this.input = input
        input.type = "file";
        if (accept) {
            input.accept = accept
        } else {
            input.accept = "image/*"
        }
        input.onchange = e => this.handleFiles(e)
        this.form.appendChild(input);
        this.dropZone.onclick = () => {
            input.value = ""; // Reset input value to allow re-selecting the same file
            this.form.reset()
            input.click()
        }
        this.dropZone.ondragover = (e) => {
            e.preventDefault();
            this.dropZone.classList.add('hover');
        }

        this.dropZone.ondragleave = (e) => {
            this.dropZone.classList.remove('hover');
        }
        this.dropZone.ondrop = e => {
            e.preventDefault();
            this.dropZone.classList.remove('hover');
            const files = e.dataTransfer.files;
            this.handleFiles({ target: { files } });
        }

    }
    hide() {
        this.dropZone.classList.add("invisible")
        // this.dropZone.style.display = "none"
    }
    show() {
        this.dropZone.classList.remove("invisible")
        // this.dropZone.style.display = ""
    }
}