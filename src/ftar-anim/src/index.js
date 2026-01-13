import { ManagerConnection } from "../../flexatar-package/src/ftar-manager/ftar-connection.js"

import { FEATURE_PARAMETERS } from "./feature-config.js"
import { moveToPosition } from "./instruments.js"


function log() {
    console.log("[FTAR_ANIM_IFRAME]", ...arguments)
}

const instruments = {
    position: "position",
    draw: "draw",
    smooth: "smooth",
    move: "move",
}
let currentInstrument = "draw"
const topPanelButtons = {
    draw: {
        name: "✏️ DRAW",
        action: () => {
            log("draw pressed")
            currentInstrument = instruments.draw
        }
    },
    clear: {
        name: "✏️ CLEAR",
        action: () => {
            log("CLEAR pressed")
            currentPattern = new Array(PATTERN_LENGTH).fill(0);
            updatePattern()
            drawSegments(ctx, currentPattern, 0, PATTERN_LENGTH)
        }
    },
    clearAll: {
        name: "✏️ CLEAR ALL",
        action: async () => {
            log("CLEAR pressed")
            currentPattern = new Array(PATTERN_LENGTH).fill(0);
            updatePattern()
            drawSegments(ctx, currentPattern, 0, PATTERN_LENGTH)
            const selectedPattern = (await getSelectedPattern())
            for (let i = 0; i < selectedPattern.length; i++) {
                const element = selectedPattern[i]
                for (let j = 0; j < element.length; j++) {
                    element[j] = 0;

                }
            }
        }
    },
    smooth: {
        name: "🧼 SMOOTH",
        action: () => {
            log("smooth")
            currentInstrument = instruments.smooth

        }
    },
    move: {
        name: "MOVE",
        action: () => {
            log("move")
            currentInstrument = instruments.move

        }
    },
    position: {
        name: "Position",
        action: () => {
            log("position")
            if (currentInstrument === instruments.position) {
                currentInstrument = null
                portSelf.postMessage({ animationPatternRequest: { playAnimation: true } })
            } else {
                currentInstrument = instruments.position

            }
        }
    },
    download: {
        name: "download",
        action: () => {
            log("download")
            downloadPattren()
        }
    },
    upload: {
        name: "upload",
        action: () => {
            log("upload")
            uploadPattren()
        }
    },

}

let isPatternRecording = false
let recorded = []


let selectedAnimTrack = 0
let selectedPattern = {}
let allPaternResolve
const allPatternsPromise = new Promise(resolve => {
    allPaternResolve = resolve
})
let selectedPatternName

const PATTERN_LENGTH = 10 * 30
let currentPattern = new Array(PATTERN_LENGTH).fill(0);
log("currentPattern", currentPattern)
let backgroundTracks = {}

async function drawSegments(ctx, pattern, startX, endX, color = "red") {
    const clear = await drawBackgroundTracks(startX, endX)
    drawSegment(ctx, pattern, startX, endX, null, clear, color = "red")
}
async function drawBackgroundTracks(startX, endX) {
    const colors = ["green", "blue", "yellow"]
    let counter = 0
    log(backgroundTracks)
    const selectedPattern = await getSelectedPattern()
    let clear = true
    for (const key of Object.keys(backgroundTracks)) {
        const bkgPat = selectedPattern.map(x => x[key])
        log(bkgPat)
        drawSegment(ctx, bkgPat, startX, endX, key, clear, colors[counter % colors.length])
        clear = false
        counter++
    }
    return clear

}

function drawSegment(ctx, pattern, startX, endX, tarckIdx = null, clear = true, color = "red") {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Compute canvas coordinates for start and end
    const canvasStartX = startX * width / PATTERN_LENGTH;
    const canvasEndX = endX * width / PATTERN_LENGTH;
    const dotSize = 2; // size of the rectangle in pixels

    // Clear the columns for this segment
    const segmentWidth = canvasEndX - canvasStartX;
    if (clear) {
        ctx.clearRect(canvasStartX, 0, segmentWidth, height);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Draw a small rectangle at each pattern point
    for (let i = startX; i <= endX; i++) {
        const x = i * width / PATTERN_LENGTH;
        const y = (pattern[i] / getCurrentMultiplier(tarckIdx) + 0.5) * height;
        if (i === startX) {
            ctx.moveTo(x, y)
        } else {
            ctx.lineTo(x, y)

        }
        // ctx.fillStyle = "#000";
        // ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
    }
    ctx.stroke();
}


function getCurrentMultiplier(tarckIdx = null) {
    return -2 * FEATURE_PARAMETERS[tarckIdx ? tarckIdx : selectedAnimTrack].multiplier
}

function convertXToAnimSpace(x) {
    return Math.trunc(x / canvas.width * PATTERN_LENGTH)
}
const onLineSegmentDrawn = (ctx, xStart, yStart, xEnd, yEnd) => {
    const isPositive = FEATURE_PARAMETERS[selectedAnimTrack].isPositive
    // console.log("isPositive", isPositive)
    // log(xStart, xEnd)
    let xRange = xStart < xEnd ? [xStart, xEnd] : [xEnd, xStart]
    let yRange = xStart < xEnd ? [yStart, yEnd] : [yEnd, yStart]
    xRange = xRange.map(convertXToAnimSpace)
    yRange = yRange.map(y => getCurrentMultiplier() * (y / canvas.height - 0.5))
    const delta = xRange[1] - xRange[0]
    if (delta === 0) {
        if (yRange[0] < 0 && isPositive) {
            currentPattern[xRange[0]] = 0

        } else {
            currentPattern[xRange[0]] = yRange[0]

        }
    } else {
        const deltaY = yRange[1] - yRange[0]
        // log("deltaY",deltaY)
        for (let i = 0; i <= delta; i++) {
            let val = (i) / delta * deltaY + yRange[0]
            if (isPositive && val < 0) {
                val = 0
            }
            currentPattern[i + xRange[0]] = val
        }
    }

    // log(currentPattern)
    drawSegments(ctx, currentPattern, xRange[0], xRange[1])


    //     log("canvas width",canvas.width)
    //     ctx.beginPath();
    //     ctx.moveTo(xStart, yStart);
    //     ctx.lineTo(xEnd, yEnd);
    //     ctx.stroke();
}

function roll(arr, shift) {
    const n = arr.length;
    const k = ((shift % n) + n) % n; // normalize shift (handles negatives too)
    return arr.slice(-k).concat(arr.slice(0, n - k));
}

const onPatternMove = (ctx, xStart, yStart, xEnd, yEnd) => {
    const isPositive = FEATURE_PARAMETERS[selectedAnimTrack].isPositive
    // console.log("isPositive", isPositive)
    // log(xStart, xEnd)
    let xRange = [xStart, xEnd]
    let yRange = [yStart, yEnd]
    xRange = xRange.map(convertXToAnimSpace)
    yRange = yRange.map(y => getCurrentMultiplier() * (y / canvas.height - 0.5))
    const xShift = xRange[1] - xRange[0]
    const yShift = yRange[1] - yRange[0]

    currentPattern = roll(currentPattern, -xShift)
    currentPattern = currentPattern.map(x => x - yShift)

    drawSegments(ctx, currentPattern, 0, PATTERN_LENGTH)


}

const canvas = document.getElementById("editableCanvas");
const ctx = canvas.getContext("2d");

let drawing = false;
let lastX = 0;
let lastY = 0;

// Resize canvas to fill its container
function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    drawSegments(ctx, currentPattern, 0, PATTERN_LENGTH)

}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();


function detectXY(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    return [x, y]
}

const smoothKernel = [0.2, 0.2, 0.2, 0.2, 0.2]
let downX
let downY
canvas.addEventListener("mousedown", async (e) => {
    drawing = true;
    [lastX, lastY] = detectXY(e)
    downX = lastX
    downY = lastY

    if (currentInstrument === instruments.position) {
        moveToPosition(portSelf, convertXToAnimSpace(lastX), PATTERN_LENGTH)
    } else if (currentInstrument === instruments.smooth) {
        const smoothTarget = convertXToAnimSpace(lastX)
        let xStart = smoothTarget - 20
        let xEnd = smoothTarget + 20
        if (xStart < 0) xStart = 0;
        if (xEnd >= PATTERN_LENGTH) xEnd = PATTERN_LENGTH - 1;
        currentPattern = convolveSubArray(currentPattern, xStart, xEnd, smoothKernel)

        drawSegments(ctx, currentPattern, xStart, xEnd, "red")
        updatePattern()

    }
});

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;


    const [x, y] = detectXY(e)



    // call the callback
    if (currentInstrument === instruments.draw) {
        onLineSegmentDrawn(ctx, lastX, lastY, x, y);
    } else if (currentInstrument === instruments.move) {


    } else if (currentInstrument === instruments.position) {
        moveToPosition(portSelf, convertXToAnimSpace(x), PATTERN_LENGTH)
    }

    // update last position
    lastX = x;
    lastY = y;
});

async function getSelectedPattern() {
    const patternsDict = await allPatternsPromise
    // log("patternsDict",patternsDict)
    if (!selectedPatternName) {
        selectedPatternName = Object.keys(patternsDict)[0]
    }
    // log("selectedPatternName",selectedPatternName)
    // log("patternsDict[selectedPatternName]",patternsDict[selectedPatternName])
    return patternsDict[selectedPatternName]
}

async function uploadPattren() {
    // 1️⃣ Create input dynamically
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none'; // hide it

    // 2️⃣ Listen for file selection
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const obj = JSON.parse(e.target.result);
                const allPatterns = await allPatternsPromise
                for(const key of Object.keys(obj)){
                    allPatterns[key] = obj[key]
                }
                
                // callback(obj); // return object via callback
            } catch (err) {
                console.error('Invalid JSON', err);
            }
        };
        reader.readAsText(file);

        // 3️⃣ Remove input after use
        document.body.removeChild(input);
    });

    // 4️⃣ Add to DOM and trigger click
    document.body.appendChild(input);
    input.click();
}
async function downloadPattren(filename = 'animation-patterns.json') {
    const patternsDict = await allPatternsPromise
    const json = JSON.stringify(patternsDict);       // convert and format JSON
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url); // cleanup
}

async function setSelectedPattern(pattern) {
    const patternsDict = await allPatternsPromise

    if (!selectedPatternName) {
        selectedPatternName = Object.keys(patternsDict)[0]
    }

    patternsDict[selectedPatternName] = pattern
}

async function updatePattern(portToUpdate) {
    if (currentInstrument !== instruments.draw && currentInstrument !== instruments.smooth&& currentInstrument !== instruments.move) return;

    // if (!selectedPattern) return;
    let idx = 0
    log("currentPattern length",currentPattern.length)
    for (const val of currentPattern) {
        (await getSelectedPattern())[idx][selectedAnimTrack] = val
        idx++
    }

    if (!portToUpdate) return;
    const send = {}
    send[selectedPatternName] = await getSelectedPattern()
    portToUpdate.postMessage({ animationPatternRequest: { selectedPattern: send } })
}

canvas.addEventListener("mouseup", (e) => {
    drawing = false;
    if (currentInstrument === instruments.move) {
        const [x, y] = detectXY(e)
        onPatternMove(ctx, lastX, lastY, downX, downY)
    }else if (currentInstrument === instruments.draw){
        drawSegments(ctx, currentPattern, 0, PATTERN_LENGTH, "red")

    }


    updatePattern(portSelf)
});

canvas.addEventListener("mouseleave", () => {
    drawing = false;
    updatePattern(portSelf)
});


function populateTopPanel() {
    const panel = document.getElementById("buttonPanel");

    for (const key in topPanelButtons) {
        const btnInfo = topPanelButtons[key];

        const btn = document.createElement("button");
        btn.textContent = btnInfo.name;

        btn.addEventListener("click", btnInfo.action);

        panel.appendChild(btn);
    }
}

populateTopPanel();

function populateFeatureList(buttons) {
    const listContainer = document.getElementById("featureListScrollableAtTheLeftFixedWidth");
    listContainer.innerHTML = ""; // clear old content if any
    let oldItem
    buttons.forEach(({ name, action }, idx) => {
        const item = document.createElement("div");
        item.className = "feature-item";
        item.textContent = name;
        listContainer.appendChild(item);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', () => {
            console.log("Checkbox state:", checkbox.checked);
            if (checkbox.checked) {
                backgroundTracks[idx] = true
            } else {
                delete backgroundTracks[idx]
            }

        });
        item.appendChild(checkbox)
        item.onclick = () => {
            if (oldItem) oldItem.classList.remove("selected");
            oldItem = item
            item.classList.add("selected");
            action()
        }
    });
}

// populateFeatureList();


const connection = new ManagerConnection()
connection.ready.then(async () => {
    log("connection ready")
})

async function buildDummyPatternList() {
    // const pattern = Array.from({ length: PATTERN_LENGTH }, () => new Array(18).fill(0));

    allPaternResolve({
        Anger: Array.from({ length: PATTERN_LENGTH }, () => new Array(18).fill(0))
    })
    const selectedPattern = await getSelectedPattern()
    currentPattern = selectedPattern.map(x => x[selectedAnimTrack])
    const buttons = selectedPattern[0].map((val, idx) => {

        return {
            name: FEATURE_PARAMETERS[idx].name,
            action: async () => {
                selectedAnimTrack = idx
                currentPattern = (await getSelectedPattern()).map(x => x[idx])
                drawSegments(ctx, currentPattern, 0, PATTERN_LENGTH)

            }
        }
    })
    populateFeatureList(
        buttons
    )
}
// buildDummyPatternList()


let startTime
let lastFrameIndex = 0
async function portHandler(e) {
    const msg = e.data
    if (!msg) return
    // log("from manager", msg)
    if (msg.animationPatternResponse) {
        // const pattern = msg.animationPatternResponse.Anger
        if (msg.animationPatternResponse.patternsDict) {
            log("msg.animationPatternResponse.patternsDict", msg.animationPatternResponse.patternsDict)
            allPaternResolve(msg.animationPatternResponse.patternsDict)
            const select = document.createElement('select');
            select.id = 'animationSlotSelect';
            const patternsDict = msg.animationPatternResponse.patternsDict
            Object.keys(patternsDict).forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                select.appendChild(option);
            });
            select.addEventListener('change', async () => {
                selectedPatternName = select.value
                portSelf.postMessage({ animationPatternRequest: { changePattern: selectedPatternName } })
                console.log('Selected value:', select.value);
                const selectedPattern = await getSelectedPattern()
                currentPattern = selectedPattern.map(x => x[selectedAnimTrack])
                drawSegments(ctx, currentPattern, 0, PATTERN_LENGTH, "red")
            });

            recordPanel.appendChild(select)



            // selectedPattern.Anger = pattern
            const selectedPattern = await getSelectedPattern()
            currentPattern = selectedPattern.map(x => x[selectedAnimTrack])
            drawSegments(ctx, currentPattern, 0, PATTERN_LENGTH)
            const buttons = selectedPattern[0].map((val, idx) => {

                return {
                    name: FEATURE_PARAMETERS[idx].name,
                    action: async () => {
                        selectedAnimTrack = idx
                        currentPattern = (await getSelectedPattern()).map(x => x[idx])
                        drawSegments(ctx, currentPattern, 0, PATTERN_LENGTH)

                    }
                }
            })
            populateFeatureList(
                buttons
            )
        } else if (msg.animationPatternResponse.headMotionState) {

            const headMotionState = msg.animationPatternResponse.headMotionState;
            headMotionState.pop()

            if (isPatternRecording) {
                if (!startTime) {
                    startTime = window.performance.now()
                }
                const time = window.performance.now() - startTime
                const index = Math.floor(time / 1000 * 33)
                // log(index, recorded.length)
                for (let i = lastFrameIndex; i < index; i++) {
                    if (recorded.length < PATTERN_LENGTH)
                        recorded.push(headMotionState)
                }
                // log(lastFrameIndex,index)
                lastFrameIndex = index

                if (recorded.length >= PATTERN_LENGTH) {
                    isPatternRecording = false
                    startTime = null
                    lastFrameIndex = 0
                    setSelectedPattern(recorded).then(async () => {
                        currentPattern = (await getSelectedPattern()).map(x => x[selectedAnimTrack])
                        drawSegments(ctx, currentPattern, 0, PATTERN_LENGTH)
                        updatePattern()

                    })
                }
                moveToPosition(null, recorded.length, PATTERN_LENGTH)


            }
        }

    }


}
let portSelf
let instanceId
window.onmessage = (e) => {
    const msg = e.data
    if (!msg) return

    if (msg.managerPort) {
        instanceId = msg.instanceId
        msg.managerPort.onmessage = portHandler
        log("port obtained")
        portSelf = msg.managerPort

        msg.managerPort.postMessage({ managerConnectionPort: connection.outPort }, [connection.outPort])
        portSelf.postMessage({ animationPatternRequest: { giveMePatterns: true } })



    } else if (msg.closeThisWindow) {
        closeThisWindow()
    }
}
function closeThisWindow() {
    window.parent.postMessage({ closeWindow: true, portSelf, instanceId }, "*", [portSelf])
}

closeButton.onclick = () => {
    closeThisWindow()
}
enableRetartgButton.onclick = () => {
    connection.showRetarg()
}

startRecordButton.onclick = () => {
    log("startRecordButton")

    isPatternRecording = true
    recorded = []

}

function convolveSubArray(arr, start, end, kernel, fade = 3) {
    const sub = arr.slice(start, end);
    const k = kernel.length, half = Math.floor(k / 2);
    const conv = Array(sub.length);

    // --- Convolve with reflection ---
    for (let i = 0; i < sub.length; i++) {
        let sum = 0;
        for (let j = 0; j < k; j++) {
            let idx = i + j - half;
            if (idx < 0) idx = -idx;
            if (idx >= sub.length) idx = sub.length - (idx - sub.length) - 1;
            sum += sub[idx] * kernel[j];
        }
        conv[i] = sum;
    }

    // --- Prepare result array ---
    const result = arr.slice();

    // --- Insert with smooth boundary mixing ---
    for (let i = 0; i < conv.length; i++) {
        const globalIndex = start + i;

        // Fade in/out weight inside window
        let wIn = 1;

        if (i < fade) {
            wIn = i / fade; // left blend
        } else if (i > conv.length - fade - 1) {
            wIn = (conv.length - 1 - i) / fade; // right blend
        }

        // Clamp weight (avoid negative)
        if (wIn < 0) wIn = 0;

        // Weighted blend:
        // new = convolved*weight + original*(1-weight)
        result[globalIndex] = conv[i] * wIn + arr[globalIndex] * (1 - wIn);
    }

    return result;
}