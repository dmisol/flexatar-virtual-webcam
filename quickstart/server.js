require('dotenv').config({ path: "../.env" });

const path = require('path');
const express = require("express");
const serveIndex = require("serve-index");
const cors = require('cors');
const multer = require('multer');

const FILES = path.join(__dirname, "../files");


const upload = multer();

const flexatarApiUrl = "https://api.flexatar-sdk.com"
const flexatarApiSecret = process.env.FLEXATAR_API_SECRET;

async function requestUploadLink() {
    const response = await fetch(flexatarApiUrl + "/b2b/createflexatar", {
        method: "POST",
        headers: {
            'Authorization': 'Bearer ' + flexatarApiSecret,
            "Content-Type": "application/json",
        }
    })
    if (response.ok) {
        const flexatarCreationInfo = await response.json()
        console.log(flexatarCreationInfo)
        return flexatarCreationInfo
    } else {
        return { error: true,status:response.status }
    }
}

async function requestDownloadLink(id,whatToDownload) {
    const response = await fetch(flexatarApiUrl + `/b2b/createflexatar/${whatToDownload}/` + id, {
        method: "POST",
        headers: {
            'Authorization': 'Bearer ' + flexatarApiSecret,
            "Content-Type": "application/json",
        }
    })
    if (response.ok) {
        const flexatarCreationInfo = await response.json()
        console.log(flexatarCreationInfo)
        return flexatarCreationInfo.link
    } else {
        return { error: true }
    }
}

async function uploadToS3(link, file) {
    const formData = new FormData();

    // Add all S3 required fields
    for (const [k, v] of Object.entries(link.fields)) {
        formData.append(k, v);
    }

    // Attach the file (from req.file or req.files in Express)
    formData.append('file', new Blob([file.buffer]), file.originalname);

    // Send POST request to S3
    const res = await fetch(link.url, {
        method: 'POST',
        body: formData
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`S3 upload failed: ${res.status} ${text}`);
    }

    return {
        success: true,
    };
}


const app = express();
const PORT = 8082;
const ROOT = path.join(__dirname, "dist");

app.use(express.json());
app.use(cors());



app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const ftarCreationInfo = await requestUploadLink()
        if (ftarCreationInfo.error){
            res.status(ftarCreationInfo.status).json({ error: "unavailable" });
            return
        }
        console.log("ftarCreationInfo",ftarCreationInfo)

        await uploadToS3(ftarCreationInfo.link, req.file);
        delete ftarCreationInfo.link
        // console.log("req.file",req.file)
        res.json(ftarCreationInfo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.get('/download/:what/:id', async (req, res) => {



    try {
        const fileId = req.params.id;        
        const whatToDownload = req.params.what;      
        const downlladLink = await requestDownloadLink(fileId,whatToDownload)
        console.log(downlladLink)
        // Fetch from remote resource
        const response = await fetch(downlladLink);

        if (!response.ok) {
            return res.status(response.status).send(`Remote fetch failed: ${response.statusText}`);
        }

        // Copy headers (optional, if you want to preserve content-type, etc.)
        res.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream');

        // Stream the body back to the client
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.send(buffer);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use("/", express.static(ROOT));
app.use("/", serveIndex(ROOT));
app.use("/files",express.static(FILES));
app.use("/files", serveIndex(FILES));

app.listen(PORT, () => console.log('Server running on port ' + PORT));
