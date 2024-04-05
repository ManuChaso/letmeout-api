const lobbyModel = require('../models/lobby.js');
const randomstring = require('randomstring');

const lobbys = new Map();

const f1KeyWords = [
  ['sink', 'lavamanos', 'lavabo', 'bathroom', 'baño', 'grifo', 'faucets', 'fregadero', 'baño'], //bathroom
  ['naranjas', 'naranja', 'orange', 'oranges', 'cesta', 'basket', 'lemon', 'limon', 'limones'], //kitchen
  ['sofa', 'couch', 'sillon', 'carpet', 'alfombra'], //living
];

const randomDates = [
  'March 15, 1993',
  'November 5, 1992',
  'September 22, 1995',
  'May 8, 1994',
  'February 19, 1996',
  'July 10, 1993',
  'April 3, 1992',
  'October 30, 1991',
  'August 14, 1996',
  'December 27, 1994',
  'June 18, 1992',
  'January 7, 1995',
  'September 5, 1993',
  'March 28, 1996',
  'November 20, 1991',
  'July 1, 1994',
  'February 11, 1992',
  'October 16, 1995',
  'May 29, 1993',
  'December 11, 1996',
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
      difficulty: data.difficulty,
      players: [
        {
          name: data.name,
          id: generateId(),
          ready: false,
          finalCode: Math.floor(Math.random() * 10),
          finalState: false,
          room: '',
          time: '',
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
      .findOne({ lobbyCode: data.lobbyCode.toUpperCase() })
      .then((lobbyFound) => {
        if (lobbyFound.players.length < 3) {
          const nameInUse = lobbyFound.players.find((player) => player.name == data.name);

          if (!nameInUse) {
            lobbyModel
              .findOneAndUpdate(
                { lobbyCode: lobbyFound.lobbyCode },
                {
                  $push: {
                    players: {
                      name: data.name,
                      id: generateId(),
                      ready: false,
                      finalCode: Math.floor(Math.random() * 10),
                      finalState: false,
                      room: '',
                      time: '',
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
                  tag: 'joinLobby',
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
              console.log(updatedLobby);
              const res = {
                tag: 'exitLobby',
                lobbyCode: updatedLobby.lobbyCode,
                players: updatedLobby.players,
              };
              resolve(res);
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
        if (f1KeyWords[i].includes(word.toLowerCase())) {
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
              date: randomDates[Math.floor(Math.random() * randomDates.length)],
              difficulty: lobbyUpdated.difficulty,
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
  const secondId = randomstring.generate({ length: 2, charset: 'alphabetic', capitalization: 'uppercase' });
  const thirdId = randomstring.generate({ length: 2, charset: 'numeric' });

  return `#${firstId}-${secondId}-${thirdId}`;
}

function generateFinalCode(client) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: lobbys.get(client).lobbyCode })
      .then((lobbyFound) => {
        const code = lobbyFound.players.map((player) => player.finalCode.toString());

        const finalCode = shuffleCode(code);

        console.log(finalCode);

        lobbyModel
          .findOneAndUpdate({ lobbyCode: lobbyFound.lobbyCode }, { finalCode: finalCode }, { new: true })
          .then((lobbyUpdated) => console.log(lobbyUpdated))
          .catch((err) => console.log('Error updating lobby', err));
      })
      .catch((err) => {
        console.log('Error generating final code', err);
      });

    const shuffleCode = (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }

      return array.join('');
    };
  });
}

function checkFinalCode(data, client) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: lobbys.get(client).lobbyCode })
      .then((lobbyFound) => {
        if (lobbyFound.finalCode == data.message && data.reboot) {
          const newPlayers = lobbyFound.players.map((player) =>
            player.name === lobbys.get(client).name ? { ...player, finalState: true } : player
          );

          lobbyModel
            .findOneAndUpdate({ lobbyCode: lobbyFound.lobbyCode }, { players: newPlayers }, { new: true })
            .then((lobbyUpdated) => {
              console.log(lobbyUpdated);

              const playersFinished = lobbyUpdated.players.map((player) => ({
                player: player.id,
                access: player.finalState,
              }));
              const res = {
                tag: 'endGame',
                message: 'Waiting for the other players',
                access: playersFinished,
                name: lobbys.get(client).name,
              };
              resolve(res);
            });
        } else if (data.message.toLowerCase() == `letmeout-${lobbyFound.finalCode}` && !data.reboot) {
          const res = {
            tag: 'endGame',
            alternative: true,
            name: lobbys.get(client).name,
            win: false,
          };

          resolve(res);
        } else {
          console.log('Entra aqui');
          const res = {
            tag: 'endGame',
            name: lobbys.get(client).name,
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

function setPlayerTime(data, client) {
  return new Promise((resolve, reject) => {
    lobbyModel
      .findOne({ lobbyCode: lobbys.get(client).lobbyCode })
      .then((lobbyFound) => {
        const newPlayers = lobbyFound.players.map((player) =>
          player.name == lobbys.get(client).name ? { ...player, time: data.message } : player
        );

        lobbyModel
          .findOneAndUpdate({ lobbyCode: lobbyFound.lobbyCode }, { players: newPlayers }, { new: true })
          .then((lobbyUpdated) => {
            console.log(lobbyUpdated);
            const res = {
              tag: 'playerTime',
              done: true,
            };
            resolve(res);
          })
          .catch((err) => {
            console.log('Error updating player time', err);
            reject(err);
          });
      })
      .catch((err) => {
        console.error('Lobby not found', err);
        reject(err);
      });
  });
}

function lose() {
  return new Promise((resolve, reject) => {
    const res = {
      tag: 'lose',
    };
    resolve(res);
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
  lose,
  setPlayerTime,
  lobbys,
};
