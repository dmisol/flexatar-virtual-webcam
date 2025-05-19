const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = {};

wss.on('connection', (ws) => {
  const id = crypto.randomUUID(); // Give each client a unique ID
  clients[id] = ws;
  ws.send(JSON.stringify({ type: 'id', id }));

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
      console.log(data)
    } catch (err) {
      console.error('Invalid JSON:', err);
      return;
    }
    for (const [id1,sock] of Object.entries(clients)){
        if (id1 !== id){
            sock.send(JSON.stringify({ ...data, from: id }));
        }
    }
    
  });

  ws.on('close', () => {
    console.log("close",id)
    clients.delete(id);
  });
});

app.use(express.static('public'));

server.listen(3000,'0.0.0.0', () => {
  console.log('Server running at http://localhost:3000');
});