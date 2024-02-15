const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const ws = new WebSocket.Server({ noServer: true });

const { createLobby, joinLobby, exitLobby, exitPlayer, playerState, sendMessage } = require('./utils/utils.js');

const PORT = process.env.PORT || 3000;

// const mongoUrl = 'mongodb+srv://LucaJeniManu:LucaJeniManu@testlobby.rsilvu4.mongodb.net/?retryWrites=true&w=majority';
// ! Personal DB
const mongoUrl = 'mongodb+srv://Leyinko:gjxyWCTbkIMAhOEE@letmeout.jm5y27d.mongodb.net/?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUrl);
    console.log('✔ MongoDB connected');
  } catch (err) {
    console.log('❌ Unable to connect to MongoDB', err);
  }
};

connectDB();

ws.on('connection', (client) => {
  console.log('✔ Client connected');

  client.on('message', (message) => {
    const access = JSON.parse(message);

    switch (access.tag) {
      case 'createLobby':
        createLobby(access, client)
          .then((res) => sendMessage(res, client, ws))
          .catch((err) => console.log('Error in promise at creating lobby', err));
        break;
      case 'joinLobby':
        joinLobby(access, client)
          .then((res) => sendMessage(res, client, ws))
          .catch((err) => console.log('Error in promise at joining lobby', err));
        break;
      case 'exitLobby':
        exitLobby(access, client)
          .then((res) => sendMessage(res, client, ws))
          .catch((err) => console.error('Error in promise at exiting lobby', err));
        break;
      case 'playerState':
        playerState(access)
          .then((res) => sendMessage(res, client, ws))
          .catch((err) => console.log('Error in promise at updating player state', err));
        break;
      default:
        console.log('No action (tag) defined on action');
        break;
    }
  });

  client.on('close', () => {
    exitPlayer(client)
      .then((res) => sendMessage(res, client, ws))
      .catch((err) => console.log('Error leaving the lobby', err));
  });
});

server.on('upgrade', (request, client, head) => {
  ws.handleUpgrade(request, client, head, (client) => {
    ws.emit('connection', client, request);
  });
});

server.listen(PORT, () => {
  console.log('Server deployed on port', PORT);
});
