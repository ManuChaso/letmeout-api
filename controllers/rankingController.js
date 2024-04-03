const lobbyModel = require('../models/lobby.js');
const rankingModel = require('../models/ranking.js');

async function rankingSave(req, res) {
  const data = req.body;

  lobbyModel
    .findOne({ lobbyCode: data.lobbyCode })
    .then((lobbyFound) => {
      const teamName = lobbyFound.players.map((player) => player.name.substring(0, 1)).join('');
      const timeArray = lobbyFound.players.map((player) => player.time);
      const teamTime = timeArray.reduce((total, time) => parseInt(total) + parseInt(time), 0);
      const createRanking = new rankingModel({
        teamName: teamName,
        teamScore: `${teamTime}pts`,
        players: lobbyFound.players.map((player) => ({ name: player.name, time: player.time })),
      });

      console.log(createRanking);

      createRanking
        .save()
        .then((rankingSaved) => {
          res.status(200).send({ message: 'Ranking saved' });
        })
        .catch((err) => {
          console.error('Error saving ranking', err);
        });
    })
    .catch((err) => {
      console.log('Lobby not found', err);
      res.status(404).send({ message: 'Lobby not found, please check the lobbyCode' });
    });
}

async function getRankings(req, res) {
  try {
    rankingModel
      .find()
      .then((rankings) => {
        console.log('Rankings: ', rankings);
        res.status(200).send({ message: 'ranking: ', ranking: rankings });
      })
      .catch((err) => {
        console.log('Ranking not found', err);
        res.status(500).send('Error al obtener el ranking');
      });
  } catch (err) {
    console.log('Error al buscar rankings', err);
  }
}

module.exports = {
  getRankings,
  rankingSave,
};
