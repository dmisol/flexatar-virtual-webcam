var fs = require('fs');

const handlers = require("./handlers.js");
const path = require("path");
const express = require("express");
const serveIndex = require("serve-index");
const app = express();
const PORT = 8081;
const ROOT = path.join(__dirname, "dist");
const VCAM = path.join(__dirname, "../v-cam-iframe/dist");
const VGEN = path.join(__dirname, "../v-gen-iframe/dist");

var http = require('http');




app.use(express.json());

app.use("/main",express.static(ROOT));
app.use("/main", serveIndex(ROOT));

app.use("/vcam",express.static(VCAM));
app.use("/vcam", serveIndex(VCAM));

app.use("/vgen",express.static(VGEN));
app.use("/vgen", serveIndex(VGEN));

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self' blob: data:;");
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

httpServer.listen(PORT);

// var httpsServer = https.createServer(credentials, app);

// httpServer.listen(8080);
// httpsServer.listen(PORT);
