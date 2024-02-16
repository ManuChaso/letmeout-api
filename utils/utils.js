const lobbyModel = require('../models/lobby.js');

const lobbys = new Map();

function sendMessage(res, client, ws) {
  if (lobbys.has(client)) {
    const user = lobbys.get(client);
    lobbys.forEach((code, player) => {
      if (code.lobbyCode === user.lobbyCode) {
        player.send(JSON.stringify(res));
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
        if (lobbyFound.players.length < 3) {
          const nameInUse = lobbyFound.players.find((player) => player.name == data.name);

          if (!nameInUse) {
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
                console.log('Error updating lobby', err);
              });
          } else {
            const res = {
              message: 'Username already taken',
              error: true,
            };
            resolve(res);
          }
        } else {
          const res = {
            message: 'This lobby is full',
            error: true,
          };
          resolve(res);
        }
      })
      .catch((err) => {
        console.log('Lobby not found');
        const res = {
          message: 'Room not found',
          error: true,
        };
        resolve(res);
      });
  });
}

function exitLobby(client) {
  return new Promise((resolve, reject) => {
    if (lobbys.has(client)) {
      const clientLobbyCode = lobbys.get(client);
      lobbyModel.findOne({ lobbyCode: clientLobbyCode.lobbyCode }).then((lobbyFound) => {
        if (lobbyFound.players.length > 1) {
          lobbyModel
            .findOneAndUpdate(
              { lobbyCode: clientLobbyCode.lobbyCode },
              { $pull: { players: { name: clientLobbyCode.name } } },
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
            .findOneAndDelete({ lobbyCode: clientLobbyCode.lobbyCode })
            .then((lobbyDeleted) => {
              console.log('Lobby deleted successfully: ', lobbyDeleted);

              resolve(lobbyDeleted);
            })
            .catch((err) => {
              console.error('Error deleting the lobby: ', err);
              reject(err);
            });
        }
      });
    } else {
      const res = {
        message: 'Player exit',
        error: false,
      };
      resolve(res);
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

function chatMessage(data) {
  const message = {
    tag: 'chat',
    name: data.name,
    message: data.message,
  };

  return message;
}

module.exports = {
  createLobby,
  joinLobby,
  exitLobby,
  playerState,
  sendMessage,
  chatMessage,
};
