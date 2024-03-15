const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const ws = new WebSocket.Server({ noServer: true });

const {
  createLobby,
  joinLobby,
  exitLobby,
  playerState,
  sendMessage,
  chatMessage,
  assignRoom,
  shareTime,
  checkFinalCode,
  generateFinalCode,
} = require('./utils/utils.js');
const { imageGenerator } = require('./imageGenerator/imageGenerator.js');
const { startIanasBot } = require('./IanasBot/ianasBot.js');
const { rankingSave, getRankings } = require('./controllers/rankingController.js');

const PORT = process.env.PORT || 3000;

const mongoUrl = 'mongodb+srv://LucaJeniManu:LucaJeniManu@testlobby.rsilvu4.mongodb.net/?retryWrites=true&w=majority';
// ! Personal DB
//const mongoUrl = 'mongodb+srv://Leyinko:gjxyWCTbkIMAhOEE@letmeout.jm5y27d.mongodb.net/?retryWrites=true&w=majority';

const connectDB = async () => {
  try {
    await mongoose.connect(mongoUrl);
    console.log('✔ MongoDB connected');
  } catch (err) {
    console.log('❌ Unable to connect to MongoDB', err);
  }
};

connectDB();

//Routes for ranking

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/save-ranking', (req, res) => rankingSave(req, res));
app.get('/get-ranking', (req, res) => getRankings(req, res));

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
        exitLobby(client)
          .then((res) => sendMessage(res, client, ws))
          .catch((err) => console.error('Error in promise at leaving lobby', err));
        break;

      case 'playerState':
        playerState(access)
          .then((res) => sendMessage(res, client, ws))
          .catch((err) => console.log('Error in promise at updating player state', err));
        break;

      case 'chatMessage':
        const res = chatMessage(access);
        sendMessage(res, client, ws);
        break;

      case 'assignRoom':
        assignRoom(access)
          .then((res) => sendMessage(res, client, ws))
          .catch((err) => console.log('Error assigning rooms', err));
        break;

      case 'shareTime':
        const response = shareTime(access);
        sendMessage(response, client, ws);
        break;

      case 'checkFinalCode':
        checkFinalCode(access)
          .then((res) => sendMessage(res, client, ws))
          .catch((err) => console.log('Error checking final code', err));
        break;

      case 'generateAccessCard':
        imageGenerator(access).then((res) => client.send(res));
        break;
      case 'generateFinalCode':
        generateFinalCode(client);
        break;
      case 'checkFinalCode':
        checkFinalCode(access)
          .then((res) => sendMessage(res, client, ws))
          .catch((err) => console.log('Error checking final code', err));
        break;
      default:
        console.log('No action (tag) defined on action');
        break;
    }
  });

  client.on('close', () => {
    exitLobby(client)
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

//startIanasBot();
