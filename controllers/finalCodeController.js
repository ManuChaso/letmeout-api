const lobbyModel = require('../models/lobby');

function getFinalCode(req, res) {
  console.log(req.query.lobbyCode);
  console.log(req.query.id);

  lobbyModel
    .findOne({ lobbyCode: req.query.lobbyCode })
    .then((lobbyFound) => {
      console.log(lobbyFound);
      lobbyFound.players.forEach((player) => {
        if (player.id == req.query.id) {
          res.status(200).send({ message: 'finalCode', finalCode: player.finalCode });
        } else {
          res.status(200).send({ message: 'Wrong id' });
        }
      });
    })
    .catch((err) => {
      console.log('Error searching lobby', err);
      res.status(500).send({ message: 'No se ha encontrado el lobby' });
    });
}

module.exports = { getFinalCode };
