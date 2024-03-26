require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const ws = new WebSocket.Server({ noServer: true });

const { startIanasBot } = require('./IanasBot/ianasBot.js');
const { rankingSave, getRankings } = require('./controllers/rankingController.js');
const { getFinalCode } = require('./controllers/finalCodeController.js');
const { storeData } = require('./storeData/storeData.js');
const { handleTag } = require('./utils/handleTags.js');
const { exitLobby, sendMessage } = require('./utils/utils.js');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✔ MongoDB connected');
  } catch (err) {
    console.log('❌ Unable to connect to MongoDB', err);
  }
};

connectDB();

//Routes for ranking

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/save-ranking', (req, res) => rankingSave(req, res));
app.get('/get-ranking', (req, res) => getRankings(req, res));
app.get('/final-code', (req, res) => getFinalCode(req, res));
app.post('/store-data', (req, res) => storeData(req, res));

app.get('/access-game', (req, res) => {
  const pass = req.query.pass;

  if (pass.toUpperCase() == process.env.GAME_ACCESS.toUpperCase()) {
    res.status(200).send({ message: 'Granted', access: true });
  } else {
    res.status(200).send({ message: 'Denied', access: false });
  }
});

ws.on('connection', (client) => {
  console.log('✔ Client connected');

  client.on('message', (message) => {
    const access = JSON.parse(message);

    handleTag(access, client, ws);
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

server.listen(process.env.PORT, () => {
  console.log('Server deployed on port ', process.env.PORT);
});

startIanasBot();
