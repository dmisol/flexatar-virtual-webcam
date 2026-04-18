# Flexatar Virtual Webcam

This repository shows how to connect a voice source, such as a microphone, a remote WebRTC stream, or audio from a file, to the Flexatar realtime engine. The engine is lightweight and runs locally on the user device. It renders a speaking photorealistic avatar in real time on any device, including phones. The avatar itself can be created from a single front-facing photo by using the Flexatar API.

[Promo video](https://youtu.be/tSR0uFsl_60)

## No Runtime Lock-In

Unlike AI avatar services that keep your product dependent on a third-party API for every live session, Flexatar runs directly inside your integration. Once embedded, the realtime engine stays part of your own product stack instead of depending on a hosted avatar runtime you do not control. Your users' Flexatars are not disposable session artifacts tied to an external rendering service. They remain durable assets in your product experience.


### In Practice

Minimal embed example:

Install:

```bash
npm install flexatar-easy-renderer
```

Use:

```js
import { FtarRenderer } from "flexatar-easy-renderer";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const engineFilesUrl = "/files";
const renderer = new FtarRenderer(engineFilesUrl, canvas);

await renderer.readyPromise;

renderer.size = { width: 320, height: 320 };
renderer.slot1 = `${engineFilesUrl}/default_ftar.p`;
renderer.background = `${engineFilesUrl}/backgrounds/1.jpg`;

const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const synchronizedStreamForPlayback = renderer.connectMediaStream(stream);
```

The host application must provide the `canvas` element and must serve the Flexatar engine assets from `engineFilesUrl`, including:

- `/files/default_ftar.p`
- `/files/backgrounds/1.jpg`
- `/files/flx_gl_static.p`
- `/files/animation.bin`
- `/files/speachnn/...`

See also the runnable example in [minimal-demo](/home/naospennikov/workspace/flexatar-virtual-webcam/minimal-demo).

This demo is repo-specific. It works in this repository because `minimal-demo` is configured to serve the root [files](/home/naospennikov/workspace/flexatar-virtual-webcam/files) directory at `/files`.

Run it with:

```bash
cd minimal-demo
npm install
npm run dev
```




### Create a Flexatar from the Command Line

You can also create a Flexatar from a source photo with the Node.js CLI script [create-flexatar-cli/create-flexatar-cli.js](/home/naospennikov/workspace/flexatar-virtual-webcam/create-flexatar-cli/create-flexatar-cli.js).

See also [flexatar_creation.md](/home/naospennikov/workspace/flexatar-virtual-webcam/flexatar_creation.md) for a more detailed description of the creation flow.

Requirements:

- obtain `FLEXATAR_API_SECRET` from [flexatar-sdk.com](https://flexatar-sdk.com) and add it to the project root `.env`
- use a nearly frontal source photo

This script is intended to be run from inside `create-flexatar-cli` and reads `../.env`, which resolves to the repository root `.env`.

Run:

```bash
cd create-flexatar-cli
npm install
node create-flexatar-cli.js /path/to/photo.jpg ./output
```

The script will:

- request a direct upload link
- upload the photo to Flexatar storage
- poll the creation status every 5 seconds
- save the generated Flexatar file and preview image into the output directory

The output files will look like:

```text
create-flexatar-cli/output/<flexatar-id>.p
create-flexatar-cli/output/<flexatar-id>-preview.jpg
```

## Security

The realtime engine runs inside a dedicated Web Worker rather than in the main browser thread. In this repository, the worker is created in [install-easy-render-worker.js](/home/naospennikov/workspace/flexatar-virtual-webcam/src/flexatar-package/src/worker/install-easy-render-worker.js), and the host-side library code that drives it is in [easy-renderer.js](/home/naospennikov/workspace/flexatar-virtual-webcam/src/flexatar-package/src/easy-renderer.js) and [easyrender.worker.js](/home/naospennikov/workspace/flexatar-virtual-webcam/src/flexatar-package/src/worker/easyrender.worker.js).

This matters because the engine does not run inside the host page DOM or inside the main application JavaScript scope. The worker boundary makes the execution model much easier to reason about: the host integration layer explicitly creates the worker, loads engine assets, and passes messages and buffers into it.

The engine implementation itself is bundled in [engine.mod.js](/home/naospennikov/workspace/flexatar-virtual-webcam/src/flexatar-package/src/worker/engine.mod.js) and includes WebAssembly code, so it is not as directly inspectable as the surrounding JavaScript wrapper. However, the wrapper layer around it is small and auditable, and it is the wrapper that shows what data is actually passed into the worker.

That isolation should be described precisely. A Web Worker is sandboxed, but it is not blind: it can use the APIs available to workers, such as message passing, timers, network requests, and rendering-related APIs, and it can process any data explicitly provided to it by the host application. In other words, the engine does not get arbitrary access to the surrounding app, but it does receive only the assets, commands, and media buffers that the integration passes into it.

## Automated Personal Avatar Pipeline

One practical use case is a service that generates a personalized speaking assistant avatar for each user.

The pipeline can look like this:

1. Your product stores context about the user, such as preferences, role, style, or audience.
2. That context is used to generate a front-facing avatar portrait with an image generation model.
3. The generated portrait is sent to the Flexatar creation pipeline to produce a Flexatar asset.
4. The resulting Flexatar is assigned to that user and stored inside your own product stack.
5. Your assistant voice is connected to the Flexatar realtime engine, so each user sees a speaking assistant with a personalized avatar.

This makes it possible to give each user an assistant that feels visually tailored to them, without depending on a hosted avatar runtime for live rendering. 
