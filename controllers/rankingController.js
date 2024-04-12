const lobbyModel = require('../models/lobby.js');
const rankingModel = require('../models/ranking.js');

//Function to save game stats on ranking
async function rankingSave(req, res) {
  const data = req.body;

  lobbyModel
    .findOne({ lobbyCode: data.lobbyCode })
    .then((lobbyFound) => {
      const difficulty = lobbyFound.difficulty;
      const teamName = lobbyFound.players
        .map((player) => player.name.substring(0, 1))
        .join('')
        .toUpperCase();
      const scoreArray = lobbyFound.players.map((player) => player.score);
      const teamScore = scoreArray.reduce((total, score) => parseInt(total) + parseInt(score), 0);
      const createRanking = new rankingModel({
        difficulty: difficulty,
        teamName: teamName,
        teamScore: teamScore,
        players: lobbyFound.players.map((player) => ({ name: player.name, score: player.score })),
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

//Function to get the best ten on ranking
async function getRankings(req, res) {
  try {
    const rankings = await rankingModel.find().sort({ teamScore: -1 }).limit(10);

    console.log('Rankings: ', rankings);
    res.status(200).send({ message: 'ranking: ', ranking: rankings });
  } catch (err) {
    console.log('Error al buscar rankings', err);
    res.status(500).send('Error al obtener el ranking');
  }
}

module.exports = {
  getRankings,
  rankingSave,
};
