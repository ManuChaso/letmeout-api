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
    if (ws.clients.has(client)) {
      client.send(JSON.stringify(res));
    }
  }
}

function createLobby(data, client) {
  return new Promise((resolve, reject) => {
    const createLobby = new lobbyModel({
      lobbyCode: data.lobbyCode,
      players: [{ name: data.name, ready: false, finalCode: Math.floor(Math.random() * 10), finalState: false }],
    });

    const user = {
      name: data.name,
      lobbyCode: createLobby.lobbyCode,
    };

    lobbys.set(client, user);

    createLobby
      .save()
      .then((savedLobby) => {
        console.log('✔ Lobby created with success:', savedLobby);
        resolve(savedLobby);
      })
      .catch((err) => {
        console.error('❌ Lobby creation failed', err);
        reject(err);
        // RESOLVE => DDBB DOWN
      });
  });
}

function joinLobby(data, client) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: data.lobbyCode })
      .then((lobbyFound) => {
        lobbyFound.players.forEach((player) => {
          if (player.name != data.name) {
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
                const user = {
                  name: data.name,
                  lobbyCode: lobbyUpdated.lobbyCode,
                };

                lobbys.set(client, user);
                console.log('Lobby updated', lobbyUpdated);
                resolve(lobbyUpdated);
              })
              .catch((err) => {
                console.error('❌ Error updating lobby ', err);
              });
          } else {
            const res = {
              message: 'Username already taken',
              error: true,
            };
            console.log(res);
            resolve(res);
          }
        });
      })
      .catch((err) => {
        res = {
          message: 'Room not found',
          error: true,
        };
        console.log(res);
        resolve(res);
      });
  });
}

function exitLobby(data, client) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOneAndUpdate({ lobbyCode: data.lobbyCode }, { $pull: { players: { name: data.name } } }, { new: true })
      .then((updatedLobby) => {
        console.log('Player removed successfully', updatedLobby);
        resolve(updatedLobby);
        lobbys.delete(client);
      })
      .catch((err) => {
        console.error('Error ocurred removing player from a lobby', err);
        reject(err);
      });
  });
}

function exitPlayer(client) {
  return new Promise((resolve, reject) => {
    if (lobbys.get(client)) {
      lobbyModel
        .findOne({ lobbyCode: lobbys.get(client).lobbyCode })
        .then((lobbyFound) => {
          console.log(lobbyFound);

          if (lobbyFound.players.length > 1) {
            lobbyModel
              .findOneAndUpdate(
                { lobbyCode: lobbys.get(client).lobbyCode },
                { $pull: { players: { name: lobbys.get(client).name } } },
                { new: true }
              )
              .then((updatedLobby) => {
                console.log(updatedLobby);
                resolve(updatedLobby);
              })
              .catch((err) => {
                console.error('Error updating lobby when the player lefts', err);
                reject(err);
              });
          } else {
            lobbyModel
              .findOneAndDelete({ lobbyCode: lobbys.get(client).lobbyCode })
              .then((lobbyDeleted) => {
                console.log('Lobby deleted successfully: ', lobbyDeleted);

                resolve(lobbyDeleted);
              })
              .catch((err) => {
                console.error('Error deleting the lobby: ', err);
                reject(err);
              });
          }
        })
        .catch((err) => {
          console.error('Error: The client is not in any lobby', err);
          reject(err);
        });
    } else {
      const res = {
        message: 'Player refresh',
        error: false,
      };
      resolve(res);
      // console.log(res);
    }
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
  exitPlayer,
  playerState,
  sendMessage,
};
