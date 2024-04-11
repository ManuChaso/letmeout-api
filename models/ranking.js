const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const rankingSchema = new Schema({
  difficulty: String,
  teamName: String,
  teamScore: Number,
  players: [],
});

const rankingModel = mongoose.model('ranking', rankingSchema, 'ranking');

module.exports = rankingModel;
