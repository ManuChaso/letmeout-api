const { rankingModel } = require('../models/ranking.js');

async function rankingSave(req, res) {
  try {
    console.log(req.body);
    const data = req.body;
    const createRanking = new rankingModel({
      teamName: data.teamName,
      teamTime: data.teamTime,
      teamScore: data.teamScore,
      players: data.players,
    });

    createRanking
      .save()
      .then((rankingSaved) => {
        console.log(rankingSaved);
        res.status(200).send('Ranking saved');
      })
      .catch((err) => {
        console.log('Error al guardar ranking', err);
        res.status(500).send('Error al guardar ranking');
      });
  } catch (err) {
    console.log('Error al crear ranking', err);
  }
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
        console.log('Error al obtener el ranking', err);
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
