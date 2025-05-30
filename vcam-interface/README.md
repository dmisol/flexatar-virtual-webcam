# Virtual Camera In-Browser Signaling Protocol (VCISP)

## 1. Overview

This document defines a minimal signaling protocol to establish bidirectional WebRTC media streams between a **host application** and an embedded **iframe-based virtual camera module**. It follows the architectural spirit of WHIP (WebRTC-HTTP Ingest Protocol) but **without requiring an HTTP server**. Instead, all signaling is done locally via `postMessage`.

The protocol supports:

- The **host** optionally sending audio and/or video media streams (or none) to the iframe.
- The **iframe** returning a processed video stream, optionally with audio, back to the host.

This enables the iframe to function as a virtual camera — a real-time media transformer, synthetic media generator, or effect processor — fully isolated yet tightly integrated with the host.

---

## 2. Roles

### 2.1 Host Application ("Host")

- Embeds the iframe virtual camera module.
- Initiates signaling by optionally sending source media streams.
- Receives the processed media stream from the iframe.
- Participates in WebRTC negotiations in two phases.

### 2.2 Virtual Camera Module ("Module")

- Runs inside the iframe.
- Accepts media streams from the host.
- Processes, transforms, or generates media.
- Returns a WebRTC stream back to the host.
- Participates in signaling reciprocally with the host.

---

## 3. Transport Layer

- Signaling messages are exchanged exclusively via [`window.postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).
- Messages are JSON objects containing full session state.
- Each message includes a unique session identifier (`id`) for multiplexing multiple sessions.
- The signaling channel requires explicit origin checks for security.
- Media transport uses standard WebRTC peer connections and ICE candidates.

---

## 4. Session Structure

The protocol is composed of **two independent WebRTC sessions**, each following a WHIP-like pattern but with **roles reversed**:

- **SRC_MEDIA session:** Host initiates the offer, Module answers.
- **VCAM_MEDIA session:** Module initiates the offer, Host answers.

This design avoids polling or waiting for media readiness, allowing either side to initiate connection when their media is available.

---

## 5. Message Format

All messages contain the following fields:

| Field   | Type      | Required | Description                                  |
|---------|-----------|----------|----------------------------------------------|
| `type`  | string    | Yes      | `"SRC_MEDIA"` or `"VCAM_MEDIA"`              |
| `id`    | string    | Yes      | Unique session identifier                     |
| `offer` | string    | Optional | SDP offer (present only when sending an offer) |
| `answer`| string    | Optional | SDP answer (present only when sending an answer)|
| `ice`   | array     | Yes      | List of ICE candidates (see format below)    |

### ICE Candidate Format

Each ICE candidate is represented as:

```json
{
  "candidate": "candidate:foundation 1 udp ...",
  "sdpMid": "0",
  "sdpMLineIndex": 0
}
```
## 6. Protocol Flow
### 6.1 SRC_MEDIA Session (Host → Module)
1. Host optionally creates and adds media tracks (audio, video, both, or none) to a WebRTC peer connection.

2. Host generates an SDP offer and gathers ICE candidates.

3. Host sends a SRC_MEDIA message containing the offer and ICE candidates:

```json
{
  "type": "SRC_MEDIA",
  "id": "<session-id>",
  "offer": "<SDP offer>",
  "ice": [ ... ]
}
```
4. Module sets the remote description, creates an SDP answer, and returns it with ICE candidates:

```json
{
  "type": "SRC_MEDIA",
  "id": "<session-id>",
  "answer": "<SDP answer>",
  "ice": [ ... ]
}
```
> After this exchange, the Module begins receiving the media stream (if any).

## 6.2 VCAM_MEDIA Session (Module → Host)
1. Module creates or processes media streams and adds them to a WebRTC peer connection.

2. Module generates an SDP offer and gathers ICE candidates.

3. Module sends a VCAM_MEDIA message containing the offer and ICE candidates:
```json
{
  "type": "VCAM_MEDIA",
  "id": "<session-id>",
  "offer": "<SDP offer>",
  "ice": [ ... ]
}
```
4. Host sets the remote description, creates an SDP answer, and returns it with ICE candidates:
```json
{
  "type": "VCAM_MEDIA",
  "id": "<session-id>",
  "answer": "<SDP answer>",
  "ice": [ ... ]
}
```
> After this exchange, the Host begins receiving the processed virtual camera media stream.

## 7. Media Scenarios
| Host Provides   | Module Provides | Typical Use Case                         |
| --------------- | --------------- | ---------------------------------------- |
| Video only      | Video           | Video effects, filters                   |
| Audio and Video | Audio and Video | Augmented video chat                     |
| No media        | Video           | Avatar rendering, synthetic video output |
| Audio only      | Video           | Audio-driven visualization, lip sync     |

## 8. Session Termination
- Either side may close the WebRTC peer connections and stop associated media tracks.

- Upon closure, a notification or cleanup procedure should be performed.

- The session identifier (id) must be discarded or reused only after session termination.

## 9. Security Considerations
- The host must validate origins of postMessage events to prevent unauthorized access.

- Only trusted iframe content should be embedded as the virtual camera.

- Media tracks and peer connections must be closed properly to release resources.

- Consider applying iframe sandboxing policies and CSP headers according to your security model.

## 10 Virtual Camera Plugin Metadata

When the virtual camera module is loaded dynamically (e.g., by pasting a URL or scanning a QR code), additional metadata can be provided via a JSON file located at:
```
<plugin-base-url>/camera-options.json
```

should serve JSON data containing camera configuration options, capabilities, or descriptive information. This allows hosts to query plugin features prior to establishing a WebRTC session.

The exact JSON schema is implementation-defined but may include fields such as:

- Supported video resolutions

- Supported frame rates

- Audio capabilities

- Feature toggles (e.g., virtual backgrounds, effects)

- UI hints or branding info

Hosts may optionally fetch and parse this file to enhance user experience and compatibility.
```json
{
  "name": "Human-readable name of the plugin",
  "description": "Optional short description of the plugin",
  "version": "Semantic version string",
  "author": "Creator or organization",
  "icon": "URL to 128x128 icon or data URL",
  "tags": ["fun", "background-removal", "AI", "blur"],
  "default_config": {
    "video": {
      "width": 1280,
      "height": 720,
      "frameRate": 30
    },
    "audio": {
      "enabled": false
    }
  },
  "capabilities": {
    "video": true,
    "audio": false
  },

  "requirements": {
    "microphone": false,
    "camera": false
  },
  "permissions": {
    "media": {
      "video": "optional",
      "audio": "optional"
    }
  },
  "delay": 450
}

```
| Field                            | Type                       | Description                                                                           |
| -------------------------------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `name`                           | `string`                   | Human-readable name of the plugin.                                                    |
| `description`                    | `string`                   | Short explanation of what the plugin does. Optional.                                  |
| `version`                        | `string`                   | Semantic version string (e.g., `1.0.0`).                                              |
| `author`                         | `string`                   | Name of the creator or organization.                                                  |
| `icon`                           | `string (URL or data URI)` | Link to an icon image (e.g., 128×128 PNG), or inline `data:image/...`.                |
| `tags`                           | `string[]`                 | Keywords to help categorize the plugin (e.g., `["ai", "blur", "fun"]`).               |
| `default_config`                 | `object`                   | Suggested initial media settings. Contains `video` and `audio` subfields.             |
| `default_config.video.width`     | `number`                   | Preferred video width in pixels (e.g., `1280`).                                       |
| `default_config.video.height`    | `number`                   | Preferred video height in pixels (e.g., `720`).                                       |
| `default_config.video.frameRate` | `number`                   | Preferred frame rate (e.g., `30`).                                                    |
| `default_config.audio.enabled`   | `boolean`                  | Whether audio is enabled by default.                                                  |
| `capabilities`                   | `object`                   | What the plugin supports: video, audio, configurability.                              |
| `capabilities.video`             | `boolean`                  | Whether video is supported.                                                           |
| `capabilities.audio`             | `boolean`                  | Whether audio is supported.                                                           |
| `requirements`                   | `object`                   | Declares hardware or permission requirements.                                         |
| `requirements.microphone`        | `boolean`                  | Whether microphone access is needed.                                                  |
| `requirements.camera`            | `boolean`                  | Whether camera access is needed.                                                      |
| `requirements.gpu`               | `string`                   | `"required"`, `"optional"`, or `"none"`.                                              |
| `permissions`                    | `object`                   | Permissions needed or suggested.                                                      |
| `permissions.media.video`        | `string`                   | `"required"`, `"optional"`, or `"none"`.                                              |
| `permissions.media.audio`        | `string`                   | Same as above, for audio.                                                             |
| `delay`                          | `number (milliseconds)`    | How much audio should be delayed to match video latency. Used for sync (e.g., `450`). |

