const lobbyModel = require('../models/lobby.js');
const randomstring = require('randomstring');

const lobbys = new Map();

const f1KeyWords = [
  ['sink', 'lavamanos', 'lavabo', 'bathroom', 'baño', 'grifo', 'faucets'], //bathroom
  ['naranjas', 'oranges', 'cesta', 'basket', 'lemon', 'limon'], //kitchen
  ['sofa', 'couch', 'sillon', 'carpet', 'alfombra'], //living
];

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

function getLobbys() {
  return new Promise((resolve, reject) => {
    lobbyModel
      .find({})
      .then((lobbys) => {
        let lobbysArray = [];

        lobbys.forEach((lobby) => {
          const lobbyInfo = {
            lobbyCode: lobby.lobbyCode,
            creator: lobby.players[0].name,
          };

          lobbysArray.push(lobbyInfo);
        });

        resolve(lobbysArray);
      })
      .catch((err) => {
        console.log('Error al buscar los lobbys activos');
        reject(err);
      });
  });
}

function getLobby(lobbyCode) {
  console.log(lobbyCode);
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: lobbyCode })
      .then((lobbyFound) => {
        resolve(lobbyFound);
      })
      .catch((err) => {
        console.log('Error al buscar lobby: ', err);
        reject(err);
      });
  });
}

function createLobby(data, client) {
  return new Promise((resolve, reject) => {
    const createLobby = new lobbyModel({
      lobbyCode: data.lobbyCode,
      players: [
        {
          name: data.name,
          id: generateId(),
          ready: false,
          finalCode: Math.floor(Math.random() * 10),
          finalState: false,
          room: '',
        },
      ],
      finalCode: '',
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

        const res = {
          tag: 'createLobby',
          lobbyCode: savedLobby.lobbyCode,
          players: savedLobby.players,
        };
        resolve(res);
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
                      id: generateId(),
                      ready: false,
                      finalCode: Math.floor(Math.random() * 10),
                      finalState: false,
                      room: '',
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

                const res = {
                  tag: 'createLobby',
                  lobbyCode: lobbyUpdated.lobbyCode,
                  players: lobbyUpdated.players,
                };

                resolve(res);
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
              lobbys.delete(client);
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
              lobbys.delete(client);
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

            const newPlayers = lobbyUpdated.players.map((player) => (player = { ...player, finalCode: '2' }));

            const res = {
              tag: 'playerState',
              lobbyCode: lobbyUpdated.lobbyCode,
              players: newPlayers,
            };

            resolve(res);
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
  console.log(data.signal);
  const resMessage = {
    tag: 'chat',
    ticket: '',
    name: data.name,
    message: data.message,
  };
  if (data.signal) {
    const message = data.message.split(' ');
    console.log(message);

    message.forEach((word) => {
      for (let i = 0; i < 3; i++) {
        if (f1KeyWords[i].includes(word)) {
          i == 0 && (resMessage.ticket = 'bathroom');
          i == 1 && (resMessage.ticket = 'kitchen');
          i == 2 && (resMessage.ticket = 'living');
        }
      }
    });
    return resMessage;
  } else {
    return resMessage;
  }
}

function assignRoom(data) {
  const rooms = ['bathroom', 'kitchen', 'living'];

  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: data.lobbyCode })
      .then((foundLobby) => {
        const players = foundLobby.players;
        players.forEach((player) => {
          const availableRooms = rooms.filter(
            (room) => !foundLobby.players.some((p) => p.room === room && p !== player)
          );
          player.room = availableRooms[Math.floor(Math.random() * availableRooms.length)];
        });

        lobbyModel
          .findOneAndUpdate({ lobbyCode: data.lobbyCode }, { $set: { players: players } }, { new: true })
          .then((lobbyUpdated) => {
            console.log('Lobby updated with rooms: ', lobbyUpdated);

            const res = {
              tag: 'assignRoom',
              lobbyCode: lobbyUpdated.lobbyCode,
              players: lobbyUpdated.players,
            };

            resolve(res);
          })
          .catch((err) => {
            console.error('Error  assigning rooms: ', err);
            reject(err);
          });
      })
      .catch((err) => {
        console.error('Lobby not found: ', err);
        reject(err);
      });
  });
}

function shareTime(data) {
  const res = {
    tag: 'shareTime',
    donor: data.donor,
    receiver: data.receiver,
  };

  return res;
}

function generateId() {
  const firstId = randomstring.generate({ length: 4, charset: 'numeric' });
  const secondId = randomstring.generate({ length: 2, charset: 'alphabetic' });
  const thirdId = randomstring.generate({ length: 2, charset: 'numeric' });

  return `#${firstId}-${secondId}-${thirdId}`;
}

function generateFinalCode(client) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: lobbys.get(client).lobbyCode })
      .then((lobbyFound) => {
        let finalCode = '';

        lobbyFound.players.forEach((player) => (finalCode += player.finalCode.toString()));

        console.log(finalCode);

        lobbyModel
          .findOneAndUpdate({ lobbyCode: lobbyFound.lobbyCode }, { finalCode: finalCode }, { new: true })
          .then((lobbyUpdated) => console.log(lobbyUpdated))
          .catch((err) => console.log('Error updating lobby', err));
      })
      .catch((err) => {
        console.log('Error generating final code', err);
      });
  });
}

function checkFinalCode(data, client) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: lobbys.get(client).lobbyCode })
      .then((lobbyFound) => {
        if (lobbyFound.finalCode == data.message) {
          const newPlayers = lobbyFound.players.map((player) =>
            player.name === lobbys.get(client).name ? { ...player, playerState: true } : player
          );

          lobbyModel
            .findOneAndUpdate({ lobbyCode: lobbyFound.lobbyCode }, { players: newPlayers }, { new: true })
            .then((lobbyUpdated) => {
              const win = lobbyFound.players.map((player) => player.finalState).every(Boolean);

              if (win) {
                const res = {
                  tag: 'checkExit',
                  message: 'Congratulations, you win the game',
                  win: true,
                };
                resolve(res);
              }
            });
          // const res = {
          //   tag: 'checkExit',
          //   message: 'Congratulations, you win the game',
          //   win: true,
          // };

          resolve(res);
        } else {
          const res = {
            tag: 'checkExit',
            message: 'You are shit',
            win: false,
          };
          resolve(res);
        }
      })
      .catch((err) => {
        console.log('Error checking the final code', err);
        reject(err);
      });
  });
}

module.exports = {
  getLobbys,
  getLobby,
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
};
