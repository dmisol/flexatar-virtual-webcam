# How To Create a Flexatar

This explanation is based on [quickstart/dist/index.html](/home/naospennikov/workspace/flexatar-virtual-webcam/quickstart/dist/index.html) and [quickstart/server.js](/home/naospennikov/workspace/flexatar-virtual-webcam/quickstart/server.js).

## Overview

The quickstart implements Flexatar creation as a two-part flow:

- The browser lets the user select a photo and sends it to the local demo server.
- The demo server uses `FLEXATAR_API_SECRET` to talk to the Flexatar API, obtains a presigned upload form, uploads the image, and returns creation metadata back to the browser.

After that, the browser polls the status URL until processing is complete, then downloads either:

- the final Flexatar file
- the preview image

## Step-by-Step Flow

### 1. User selects a source photo

In `quickstart/dist/index.html`, the file input with id `fileInput` accepts an image:

- when the user selects a file, `fileInput.onchange` is triggered
- the selected file is passed into `createFlexatar(file, callbacks)`

This is the start of the Flexatar creation flow in the browser.

### 2. Browser uploads the photo to the local server

The `createFlexatar(...)` function does not call the Flexatar API directly. Instead, it sends the image to the local backend:

```js
const formData = new FormData();
formData.append("file", file);

await fetch("/upload", {
    method: "POST",
    body: formData
});
```

This design keeps `FLEXATAR_API_SECRET` out of the browser.

### 3. Local server requests a presigned upload link

In `quickstart/server.js`, the route `POST /upload` handles the uploaded image.

The first backend step is `requestUploadLink()`, which sends:

```text
POST https://api.flexatar-sdk.com/b2b/createflexatar
Authorization: Bearer <FLEXATAR_API_SECRET>
```

If successful, the API returns creation metadata that includes:

- `id` for the future Flexatar
- `poll` URL for checking processing status
- `link.url` and `link.fields` for the presigned upload

### 4. Local server uploads the image to the presigned storage URL

Still inside `POST /upload`, the server calls `uploadToS3(ftarCreationInfo.link, req.file)`.

That function:

- creates a `FormData` object
- appends every field from `link.fields`
- appends the uploaded image as `file`
- sends the multipart request to `link.url`

This means the actual photo file is uploaded using the presigned form returned by the Flexatar API.

### 5. Server returns creation info to the browser

After the upload succeeds, the server removes `link` from the response and sends the remaining data back to the browser.

The browser stores:

- `result.id` in `flexatarIdHolder`
- `result.poll` in `creationStatusLink`

At this point, the image upload is complete, but Flexatar processing may still be in progress.

### 6. Browser checks processing status

When the user clicks `Check`, the frontend calls `checkStatus(statusUrl, statusCallbacks)`.

That function performs:

```js
fetch(statusUrl)
```

The quickstart interprets the response like this:

- `200` with `data.success === true`: Flexatar is ready
- `200` with `data.success === false`: creation failed
- `404`: still in progress

The UI message also notes an important practical requirement:

- the photo should be nearly frontal

### 7. Browser downloads the result

Once creation succeeds, the UI allows two download actions:

- `Download Flexatar`
- `Download Preview`

These buttons call:

- `/download/ftar/:id`
- `/download/preview/:id`

### 8. Local server exchanges the ID for a real download link

In `quickstart/server.js`, the route `GET /download/:what/:id` calls:

```text
POST https://api.flexatar-sdk.com/b2b/createflexatar/{what}/{id}
Authorization: Bearer <FLEXATAR_API_SECRET>
```

The API returns a JSON payload with a `link` field. The server then fetches that file and streams it back to the browser.

This is used for both:

- the final `.p` Flexatar asset
- the preview image

## What You Need To Run It

- a valid `FLEXATAR_API_SECRET` in the project-level `.env`
- the local demo server running from `quickstart/server.js`
- a source image uploaded by the user

The server is required because the API secret must stay on the backend.

## Practical Notes

- The source image should be close to frontal. The frontend explicitly warns that non-frontal photos may fail.
- The browser never sends authenticated requests directly to the Flexatar API in this quickstart.
- The backend acts as a thin proxy for secure API calls and download handling.
- After the final Flexatar is downloaded, the demo can load it into the renderer through `renderer.slot1`.

## Minimal Mental Model

The creation pipeline is:

`photo -> local backend -> createflexatar API -> presigned upload -> poll -> download ftar/preview`
