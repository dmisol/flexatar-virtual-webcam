#!/usr/bin/env node

require("dotenv").config({ path: "../.env" });

const fs = require("fs/promises");
const path = require("path");

const FLEXATAR_API_URL = "https://api.flexatar-sdk.com";
const FLEXATAR_API_SECRET = process.env.FLEXATAR_API_SECRET;
const POLL_INTERVAL_MS = 5000;

function printUsage() {
    console.error("Usage: node create-flexatar-cli.js <image-path> <output-dir>");
}

function assertConfigured() {
    if (!FLEXATAR_API_SECRET) {
        throw new Error("FLEXATAR_API_SECRET is missing in ../.env");
    }
}

function assertArgs(imagePath, outputDir) {
    if (!imagePath || !outputDir) {
        printUsage();
        throw new Error("image-path and output-dir are required");
    }
}

async function requestUploadLink() {
    const response = await fetch(`${FLEXATAR_API_URL}/b2b/createflexatar`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${FLEXATAR_API_SECRET}`,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to request upload link: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

async function uploadImage(uploadInfo, fileBuffer, fileName) {
    const formData = new FormData();

    for (const [key, value] of Object.entries(uploadInfo.link.fields)) {
        formData.append(key, value);
    }

    formData.append("file", new Blob([fileBuffer]), fileName);

    const response = await fetch(uploadInfo.link.url, {
        method: "POST",
        body: formData
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to upload source photo: ${response.status} ${text}`);
    }
}

async function pollStatus(pollUrl) {
    while (true) {
        const response = await fetch(pollUrl);

        if (response.status === 404) {
            console.log("Status: in progress");
            await sleep(POLL_INTERVAL_MS);
            continue;
        }

        if (!response.ok) {
            throw new Error(`Failed to check status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.success) {
            return data;
        }

        throw new Error("Flexatar creation failed. The photo may need to be nearly frontal.");
    }
}

async function requestDownloadLink(id, what) {
    const response = await fetch(`${FLEXATAR_API_URL}/b2b/createflexatar/${what}/${id}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${FLEXATAR_API_SECRET}`,
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to request ${what} download link: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.link) {
        throw new Error(`Missing ${what} download link in API response`);
    }

    return data.link;
}

function extensionFromContentType(contentType, fallback) {
    if (!contentType) {
        return fallback;
    }

    if (contentType.includes("image/jpeg")) {
        return ".jpg";
    }
    if (contentType.includes("image/png")) {
        return ".png";
    }
    if (contentType.includes("image/webp")) {
        return ".webp";
    }
    if (contentType.includes("application/octet-stream")) {
        return fallback;
    }

    return fallback;
}

async function downloadBinary(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
    }

    return {
        buffer: Buffer.from(await response.arrayBuffer()),
        contentType: response.headers.get("content-type")
    };
}

async function downloadResultFiles(id, outputDir) {
    const [ftarUrl, previewUrl] = await Promise.all([
        requestDownloadLink(id, "ftar"),
        requestDownloadLink(id, "preview")
    ]);

    const [ftarFile, previewFile] = await Promise.all([
        downloadBinary(ftarUrl),
        downloadBinary(previewUrl)
    ]);

    const ftarPath = path.join(outputDir, `${id}.p`);
    const previewExt = extensionFromContentType(previewFile.contentType, ".jpg");
    const previewPath = path.join(outputDir, `${id}-preview${previewExt}`);

    await fs.mkdir(outputDir, { recursive: true });
    await Promise.all([
        fs.writeFile(ftarPath, ftarFile.buffer),
        fs.writeFile(previewPath, previewFile.buffer)
    ]);

    return { ftarPath, previewPath };
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const [, , imagePathArg, outputDirArg] = process.argv;

    assertConfigured();
    assertArgs(imagePathArg, outputDirArg);

    const imagePath = path.resolve(process.cwd(), imagePathArg);
    const outputDir = path.resolve(process.cwd(), outputDirArg);
    const fileName = path.basename(imagePath);

    const fileBuffer = await fs.readFile(imagePath);
    await fs.mkdir(outputDir, { recursive: true });

    console.log(`Uploading ${fileName}...`);
    const uploadInfo = await requestUploadLink();
    await uploadImage(uploadInfo, fileBuffer, fileName);

    console.log(`Upload complete. Flexatar ID: ${uploadInfo.id}`);
    console.log(`Polling status every ${POLL_INTERVAL_MS / 1000} seconds...`);
    await pollStatus(uploadInfo.poll);

    console.log("Flexatar is ready. Downloading result files...");
    const { ftarPath, previewPath } = await downloadResultFiles(uploadInfo.id, outputDir);

    console.log(`Saved Flexatar: ${ftarPath}`);
    console.log(`Saved preview: ${previewPath}`);
}

main().catch(error => {
    console.error(error.message);
    process.exit(1);
});
