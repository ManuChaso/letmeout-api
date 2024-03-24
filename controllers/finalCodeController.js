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
        } else {
          res.status(404).send({ message: 'Wrong id' });
        }
      });
    })
    .catch((err) => {
      console.log('Error searching lobby', err);
      res.status(500).send({ message: 'No se ha encontrado el lobby' });
    });
}

module.exports = { getFinalCode };
