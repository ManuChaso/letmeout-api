const lobbyModel = require('../models/lobby.js');

const DB = {
  save: (lobbyCode) => {
    return new Promise((resolve, reject) => {
      lobbyModel
        .findOne({ lobbyCode: lobbyCode })
        .then((lobbyFound) => {
          resolve(lobbyFound);
        })
        .catch((err) => reject(err));
    });
  },
};

module.exports = {
  DB,
};
