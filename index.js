const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const ws = new WebSocket.Server({ noServer: true});

const PORT = process.env.PORT || 3000;

const channels = {}

ws.on('connection', (ws)=>{
    console.log('cliente conectado');

    const channel = 'General';
    if(!channels[channel]){
        channels[channel] = []; 
    }

    channels[channel].push(ws);

    ws.on('message', (message) => {
        channels[channel].forEach(client => {
            client.send(message)
        })
    });

    ws.on('close', () => {
        console.log('Cliente desconectado');
    })
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

server.listen(PORT, () => {
    console.log('Servidor levantado en el puerto:', PORT);
})