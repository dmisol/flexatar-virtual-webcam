

const handlers = require("./handlers.js");
const path = require("path");
const express = require("express");
const serveIndex = require("serve-index");
const app = express();
const PORT = 8081;
const ROOT = path.join(__dirname, "dist");

var http = require('http');



app.use(express.json());

app.use("/main",express.static(ROOT));
app.use("/main", serveIndex(ROOT));

app.route("/usertoken").post(handlers.getUserToken);
app.route("/buysubscription").post(handlers.buySubscription);
app.route("/listsubscription").post(handlers.listSubscriptions);
app.route("/delsubscription").post(handlers.delSubscription);

var httpServer = http.createServer( app);

httpServer.listen(PORT);

