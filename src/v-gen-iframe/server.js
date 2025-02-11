const path = require("path");
const express = require("express");
const serveIndex = require("serve-index");
const app = express();
const PORT = 8081;
const ROOT = path.join(__dirname, "dist");

var fs = require('fs');
var http = require('http');
// var https = require('https');


app.use((_, res, next) => {
  res.set({
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Origin-Agent-Cluster": "?1",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":  "Origin, X-Requested-With, Content-Type, Accept, Range",
  });
  next();
});

app.use(express.static(ROOT));
app.use("/", serveIndex(ROOT));

var httpsServer = http.createServer(app);
// var httpsServer = https.createServer(credentials, app);

// httpServer.listen(8080);
httpsServer.listen(8082);

// app.listen(PORT, () => {
//   console.log(`Listening on port ${PORT}`);
// });