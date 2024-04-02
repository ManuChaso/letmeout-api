const lobbyModel = require('../models/lobby');

function getFinalCode(req, res) {
  const id = decodeURIComponent(req.query.id);
  const lobbyCode = req.query.lobbyCode;

  console.log(lobbyCode);
  console.log(id);

  lobbyModel
    .findOne({ lobbyCode: lobbyCode })
    .then((lobbyFound) => {
      console.log(lobbyFound);
      lobbyFound.players.forEach((player) => {
        if (player.id == id) {
          res.status(200).send({ message: 'finalCode', finalCode: player.finalCode });
        }
      });
    })
    .catch((err) => {
      console.log('Error searching lobby', err);
    });
}

module.exports = { getFinalCode };
