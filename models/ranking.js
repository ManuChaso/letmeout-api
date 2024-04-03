const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const rankingSchema = new Schema({
  teamName: String,
  teamScore: String,
  players: [],
});

const rankingModel = mongoose.model('ranking', rankingSchema, 'ranking');

module.exports = rankingModel;
