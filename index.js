const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const ws = new WebSocket.Server({ noServer: true });

const { createLobby, joinLobby, playerState, lobbys, sendMessage } = require('./utils/utils.js');

const PORT = process.env.PORT || 3000;

const mongoUrl = 'mongodb+srv://LucaJeniManu:LucaJeniManu@testlobby.rsilvu4.mongodb.net/?retryWrites=true&w=majority';

const connectDB = async () => {
    try {
        await mongoose.connect(mongoUrl)
        console.log('Conectado papa');
    }catch (err){
        console.log('Lo siento, no quiero', err);
    }
}
connectDB();

ws.on('connection', (socket) => {
    console.log('Cliente conectado');

    socket.on('message', message => {
        const access = JSON.parse(message);

        switch(access.tag){
            case 'createLobby': 
                createLobby(access, socket).then(res => sendMessage(res, socket, ws))
            break;
            case 'joinLobby': joinLobby(access, socket).then(res => sendMessage(res, socket, ws))
            break;
            case 'playerState': playerState(access, socket).then(res => sendMessage(res, socket, ws))
            break;
            default: console.log('No se ha especificado tag'); break;
        }
    })
});

server.on('upgrade', (request, socket, head) => {
    ws.handleUpgrade(request, socket, head, (socket) => {
        ws.emit('connection', socket, request);
    });
});

server.listen(PORT, () => {
    console.log('Servidor levantado en el puerto:', PORT);
});