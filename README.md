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

### Add a Visual Layer to Any Voice Agent

See also the runnable example in [ai-agent-integration](/home/naospennikov/workspace/flexatar-virtual-webcam/ai-agent-integration).

This example shows a very practical product pattern: you can take an existing realtime voice agent and add a visual avatar layer on top of it with very little extra system complexity.

The voice agent still does what it already does best: speech-to-speech interaction, model orchestration, and turn handling. Flexatar then takes the returned audio stream and turns it into a speaking avatar locally in the client. That means you do not need a separate avatar rendering backend, GPU rendering service, or a media pipeline that streams rendered video frames from your infrastructure to the browser.

In practice, this makes the visual layer cheap to add:

- no hosted rendering runtime is required for each live session
- no rendered avatar video needs to be transported over the network
- no additional rendering latency is introduced by a remote avatar service
- the browser receives audio and renders the avatar locally on the user device
- stability is high because avatar rendering continues to run locally in the client rather than depending on a separate remote rendering stack
- failure modes are simpler because the visual layer does not require extra rendering servers, GPU workers, or video streaming infrastructure

The included demo keeps the same Flexatar setup as `minimal-demo`, but instead of animating the avatar from the local microphone directly, it connects the microphone to an Inworld realtime WebRTC agent and animates the avatar from the agent's returned audio stream.

Requirements:

- create an Inworld account and generate an API key in the [Inworld Portal](https://platform.inworld.ai) under `Settings > API Keys`, then add the Base64 credentials as `INWORLD_API_KEY` in the project root `.env`
- allow microphone access in the browser

The Inworld agent configuration is currently hardcoded in [agent-config.js](/home/naospennikov/workspace/flexatar-virtual-webcam/ai-agent-integration/src/lib/agent-config.js).

The agent connection flow in this example follows the official Inworld WebRTC quickstart:

- [Inworld WebRTC Quickstart](https://docs.inworld.ai/realtime/quickstart-webrtc)

Run it with:

```bash
cd ai-agent-integration
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

## Business Ideas

One useful way to think about Flexatar is not as a standalone avatar product, but as a low-cost visual layer that can be attached to many AI workflows.

### Personalized AI Assistants

One practical use case is a service that generates a personalized speaking assistant avatar for each user.

The pipeline can look like this:

1. Your product stores context about the user, such as preferences, role, style, or audience.
2. That context is used to generate a front-facing avatar portrait with an image generation model.
3. The generated portrait is sent to the Flexatar creation pipeline to produce a Flexatar asset.
4. The resulting Flexatar is assigned to that user and stored inside your own product stack.
5. Your assistant voice is connected to the Flexatar realtime engine, so each user sees a speaking assistant with a personalized avatar.

This makes it possible to give each user an assistant that feels visually tailored to them, without depending on a hosted avatar runtime for live rendering.

### Agent-As-Interviewer

Another practical pattern is to use a voice agent as a scalable interviewer, screener, or negotiator, and add a speaking avatar so the interaction feels more natural than a plain form or chatbot.

At a general level, the idea is simple:

1. You define the questions, constraints, and evaluation criteria once.
2. A voice agent conducts the same structured conversation with many people.
3. Each participant gets the same flow and the same baseline quality of questioning.
4. You receive a summary, comparison, or extracted structured data after each conversation.
5. The avatar layer makes the interaction feel more human without adding a separate rendering backend.

Short example:

You need plumbing work done at home and want to compare several plumbers before choosing one. Calling ten different people yourself is tedious. Instead, you configure a voice agent to ask each plumber the same questions: availability, price model, estimated timeline, experience with the specific job, materials, and warranty terms. You then send the same agent link to ten plumbers. They each talk to the agent, and you receive a summary for every conversation, making it much easier to compare options side by side.

### AI Quest Games With Personalized Storylines

Flexatar can also work as a character layer for AI-native games, especially quest or narrative games where the story is generated dynamically for each player.

At a general level, the idea is:

1. The game stores player context, choices, history, and progression.
2. An AI system generates or adapts the storyline, quests, dialogue, and branching events for that specific player.
3. Character portraits can be generated with image models instead of being authored one by one by hand.
4. Those generated character images can then be turned into speaking animated characters with Flexatar.
5. The result is a game where dialogue scenes feel much more alive, while the rendering still happens locally on the user device.

Short example:

A fantasy quest game creates a different story arc for each player based on their previous choices, alliances, and play style. The king, rival hunter, merchant, or mysterious guide can all be generated as AI-made portraits, then animated with Flexatar so they speak their lines as living characters instead of static images. This makes personalized story content much more immersive without requiring a traditional animated character pipeline for every branch of the game.
