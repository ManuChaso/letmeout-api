const lobbyModel = require('../models/lobby');

function getFinalCode(req, res) {
  const data = req.body;

  console.log(req);

  lobbyModel.findOne({ lobbyCode: data.lobbyCode }).then((lobbyFound) => {
    console.log(lobbyFound);
    lobbyFound.players
      .forEach((player) => {
        if (player.id == data.id) {
          res.status(200).send({ message: 'finalCode', finalCode: player.finalCode });
        }
      })
      .catch((err) => {
        console.log('Error searching lobby', err);
        res.status(500).send({ message: 'No se ha encontrado el lobby' });
      });
  });
}

module.exports = { getFinalCode };
