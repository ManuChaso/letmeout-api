const lobbyModel = require('../models/lobby.js');

const lobbys = new Map();

function sendMessage(res, client, ws) {
  if (lobbys.get(client)) {
    const codeSender = lobbys.get(client);
    ws.clients.forEach((user) => {
      const messageReceptor = lobbys.get(user);
      if (codeSender === messageReceptor) {
        user.send(JSON.stringify(res));
      }
    });
  } else {
    client.send(JSON.stringify(res));
  }
}

function createLobby(data, client) {
  return new Promise((resolve, reject) => {
    const createLobby = new lobbyModel({
      lobbyCode: data.lobbyCode,
      players: [{ name: data.name, state: false, finalCode: Math.floor(Math.random() * 10), finalState: false }],
    });

    lobbys.set(client, createLobby.lobbyCode);

    createLobby
      .save()
      .then((savedLobby) => {
        console.log('✔ Lobby created with success:', savedLobby);
        resolve(savedLobby);
      })
      .catch((err) => {
        console.error('❌ Lobby creation failed', err);
        reject(err);
      });
  });
}

function joinLobby(data, client) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: data.lobbyCode })
      .then(() => {
        lobbyModel
          .findOneAndUpdate(
            { lobbyCode: data.lobbyCode },
            {
              $push: {
                players: {
                  name: data.name,
                  state: false,
                  finalCode: Math.floor(Math.random() * 10),
                  finalState: false,
                },
              },
            },
            { new: true }
          )
          .then((lobbyUpdated) => {
            lobbys.set(client, lobbyUpdated.lobbyCode);
            console.log('Lobby updated', lobbyUpdated);
            resolve(lobbyUpdated);
          })
          .catch((err) => {
            console.error('❌ Error updating lobby ', err);
            res = {
              resMessage: 'Room not found',
              error: true,
            };
            resolve(res);
            reject(err);
          });
      })
      .catch((err) => console.error('❌ Lobby not found', err));
  });
}

function playerState(data) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: data.lobbyCode })
      .then((lobby) => {
        const players = lobby.players.map((player) =>
          player.name == data.name ? { ...player, state: data.playerState } : player
        );

        lobbyModel
          .findOneAndUpdate({ lobbyCode: data.lobbyCode }, { players: players }, { new: true })
          .then((lobbyUpdated) => {
            console.log('Lobby updated', lobbyUpdated);
            resolve(lobbyUpdated);
          })
          .catch((err) => {
            console.error('❌ Error updating lobby ', err);
            reject(err);
          });
      })
      .catch((err) => console.error('❌ Lobby not found', err));
  });
}

module.exports = {
  createLobby,
  joinLobby,
  playerState,
  sendMessage,
};
