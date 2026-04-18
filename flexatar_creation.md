# How To Create a Flexatar

This explanation is based on the Node.js CLI script [create-flexatar-cli/create-flexatar-cli.js](/home/naospennikov/workspace/flexatar-virtual-webcam/create-flexatar-cli/create-flexatar-cli.js).

## Overview

The current repository implements Flexatar creation as a backend-style command line flow:

- a local Node.js script reads a source photo from disk
- the script uses `FLEXATAR_API_SECRET` from the project root `.env`
- it requests a presigned upload form from the Flexatar API
- it uploads the source image to the returned storage URL
- it polls the creation status until processing completes
- it downloads the final Flexatar asset and preview image into a local output directory

This keeps the API secret out of any browser environment and makes the whole creation flow easy to inspect.

## Step-by-Step Flow

### 1. Run the CLI with an image path and output directory

The script expects:

- an input image path
- an output directory

Usage:

```bash
node create-flexatar-cli.js <image-path> <output-dir>
```

The argument validation is implemented in [create-flexatar-cli/create-flexatar-cli.js](/home/naospennikov/workspace/flexatar-virtual-webcam/create-flexatar-cli/create-flexatar-cli.js).

### 2. Load `FLEXATAR_API_SECRET` from the root `.env`

At startup, the script loads environment variables from `../.env`:

```js
require("dotenv").config({ path: "../.env" });
```

It then checks that `FLEXATAR_API_SECRET` is present before continuing.

This means the secret stays on the machine running the CLI and is not exposed to a frontend client.

### 3. Read the source photo from disk

The CLI resolves the input path, reads the file into memory, and extracts the source filename:

- `path.resolve(...)` is used to normalize the input paths
- `fs.readFile(...)` loads the image
- `path.basename(...)` is used as the upload filename

This is the local input to the Flexatar creation flow.

### 4. Request a presigned upload link from the Flexatar API

The script calls `requestUploadLink()`, which sends:

```text
POST https://api.flexatar-sdk.com/b2b/createflexatar
Authorization: Bearer <FLEXATAR_API_SECRET>
Content-Type: application/json
```

If successful, the API returns metadata that includes:

- `id` for the future Flexatar
- `poll` URL for checking processing status
- `link.url` and `link.fields` for the presigned upload

### 5. Upload the source photo to the presigned storage URL

The script calls `uploadImage(uploadInfo, fileBuffer, fileName)`.

That function:

- creates a `FormData` object
- appends every field from `uploadInfo.link.fields`
- appends the local image file as `file`
- sends a `POST` request to `uploadInfo.link.url`

This means the actual photo file is uploaded using the presigned form returned by the Flexatar API.

### 6. Poll the creation status

After the upload succeeds, the CLI polls `uploadInfo.poll` every 5 seconds.

The polling logic is:

- `404`: creation is still in progress
- `200` with `data.success === true`: Flexatar is ready
- `200` with `data.success === false`: creation failed
- any other non-OK response: treat as an error

If creation fails, the script reports that the source photo may need to be nearly frontal.

### 7. Request download links for the result files

Once processing succeeds, the script requests two download links in parallel:

- `POST https://api.flexatar-sdk.com/b2b/createflexatar/ftar/{id}`
- `POST https://api.flexatar-sdk.com/b2b/createflexatar/preview/{id}`

Both requests use the same bearer token from `FLEXATAR_API_SECRET`.

The API responds with temporary direct file URLs.

### 8. Download and save the Flexatar and preview files

The script then downloads both files and writes them into the chosen output directory.

The saved files are:

- `<flexatar-id>.p`
- `<flexatar-id>-preview.jpg` or another image extension based on the returned content type

The output directory is created automatically if it does not already exist.

## What You Need To Run It

- a valid `FLEXATAR_API_SECRET` in the repository root `.env`
- dependencies installed in [create-flexatar-cli](/home/naospennikov/workspace/flexatar-virtual-webcam/create-flexatar-cli)
- a source image on disk

Run:

```bash
cd create-flexatar-cli
npm install
node create-flexatar-cli.js /path/to/photo.jpg ./output
```

## Practical Notes

- The source image should be close to frontal.
- The API secret is used only by the local CLI process.
- The script is a thin, inspectable wrapper around the Flexatar creation API.
- The resulting `.p` file can later be loaded by the renderer as a Flexatar asset.

## Minimal Mental Model

The creation pipeline is:

`photo on disk -> local CLI -> createflexatar API -> presigned upload -> poll -> download ftar/preview`
