const lobbyModel = require('../models/lobby.js');

const lobbys = new Map();

async function sendMessage(res, socket, ws) {
  try {
    const codeSender = lobbys.get(socket);
    ws.clients.forEach((client) => {
      const messageReceptor = lobbys.get(client);
      if (codeSender === messageReceptor) {
        client.send(JSON.stringify(res));
      }
    });
  } catch (error) {
    console.error('❌ Error sending message:', err);
  }
}

function createLobby(data, socket) {
  return new Promise((resolve, reject) => {
    const createLobby = new lobbyModel({
      lobbyCode: data.lobbyCode,
      players: [{ name: data.name, state: false }],
    });

    lobbys.set(socket, createLobby.lobbyCode);

    createLobby
      .save()
      .then((savedLobby) => {
        console.log('✔ Lobby created with success:', savedLobby);
        resolve(savedLobby);
      })
      .catch((err) => console.error('❌ Lobby creation failed', err));
  });
}

function joinLobby(data) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: data.lobbyCode })
      .then(() => {
        lobbyModel
          .findOneAndUpdate(
            { lobbyCode: data.lobbyCode },
            { $push: { players: { name: data.name, state: false } } },
            { new: true }
          )
          .then((lobbyUpdated) => {
            console.log('Lobby updated', lobbyUpdated);
            resolve(lobbyUpdated);
          })
          .catch((err) => console.error('❌ Error updating lobby ', err));
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
          .catch((err) => console.error('❌ Error updating lobby ', err));
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
