// var fs = require('fs');


const handlers = require("./handlers.js");
const path = require("path");
const express = require("express");
const serveIndex = require("serve-index");
const cors = require('cors');

const app = express();
const PORT = 8081;
const ROOT = path.join(__dirname, "dist");
const VCAM = path.join(__dirname, "../vcam-ui-min/dist");
const VGEN = path.join(__dirname, "../v-gen/dist");
// const VGEN = path.join(__dirname, "../v-gen-iframe/dist");
const LENS = path.join(__dirname, "../ftar-lens/dist");
const EFFECT = path.join(__dirname, "../ftar-effect/dist");
const RETARG = path.join(__dirname, "../ftar-retarg/dist");
const PROGRESS = path.join(__dirname, "../ftar-progress/dist");
const VCAM_PLUGIN = path.join(__dirname, "../../vcam-interface/dist");
const FILES = path.join(ROOT, "../../../files");

var http = require('http');


app.use(express.json());
app.use(cors());

app.use("/main",express.static(ROOT));
app.use("/main", serveIndex(ROOT));

app.use("/files",express.static(FILES));
app.use("/files", serveIndex(FILES));

app.use("/vcam",express.static(VCAM));
app.use("/vcam", serveIndex(VCAM));

app.use("/vgen",express.static(VGEN));
app.use("/vgen", serveIndex(VGEN));

app.use("/lens",express.static(LENS));
app.use("/lens", serveIndex(LENS));

app.use("/progress",express.static(PROGRESS));
app.use("/progress", serveIndex(PROGRESS));

app.use("/vcam-plugin",express.static(VCAM_PLUGIN));
app.use("/vcam-plugin", serveIndex(VCAM_PLUGIN));

app.use("/effect",express.static(EFFECT));
app.use("/effect", serveIndex(EFFECT));

app.use("/retarg",express.static(RETARG));
app.use("/retarg", serveIndex(RETARG));

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://flexatar-sdk.com;");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    next();
});

app.route("/usertoken").post(handlers.getUserToken);
app.route("/buysubscription").post(handlers.buySubscription);
app.route("/listsubscription").post(handlers.listSubscriptions);
app.route("/delsubscription").post(handlers.delSubscription);
app.route("/info").post(handlers.info);

var httpServer = http.createServer( app);

httpServer.listen(PORT,"0.0.0.0");

// var httpsServer = https.createServer(credentials, app);

// httpServer.listen(8080);
// httpsServer.listen(PORT);
