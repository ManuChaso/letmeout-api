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
      players: [{ name: data.name, ready: false, finalCode: Math.floor(Math.random() * 10), finalState: false }],
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
                  ready: false,
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
            res = { error: true };
            reject(res);
          });
      })
      .catch((err) => console.error('❌ Lobby not found', err));
  });
}

function exitLobby(data, client) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOneAndUpdate({ lobbyCode: data.lobbycode }, { $pull: { players: { name: data.name } } }, { new: true })
      .then((updatedLobby) => {
        console.log('Player removed successfully', updatedLobby);
        resolve(res);
        lobbys.delete(client);
      })
      .catch((err) => {
        console.error('Error ocurred removing player from a lobby', err);
        reject(err);
      });
  });
}

function playerState(data) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: data.lobbyCode })
      .then((lobby) => {
        const players = lobby.players.map((player) =>
          player.name == data.name ? { ...player, ready: data.playerState } : player
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
  exitLobby,
  playerState,
  sendMessage,
};
