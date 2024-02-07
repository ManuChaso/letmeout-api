const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const lobbySchema = new Schema({
    lobbyCode: String,
    players: [Object]
});

const lobbyModel = mongoose.model('lobby', lobbySchema, 'lobby');

module.exports = lobbyModel;