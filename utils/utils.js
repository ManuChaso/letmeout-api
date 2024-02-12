const randomstring = require('randomstring');
const lobbyModel = require('../models/lobby.js');

const lobbys = new Map();

function createLobby(data, socket){
    return new Promise((resolve, reject) => {
        const createLobby = new lobbyModel({
            lobbyCode: randomstring.generate(6),
            players: [{name: data.name, state: false}]
        });
    
        lobbys.set(socket, createLobby.lobbyCode);
    
        createLobby.save()
        .then(savedLobby => {
            console.log('Lobby generado: ', savedLobby);
            resolve(savedLobby);
        })
        .catch(err => console.error('Error al generar lobby', err));
    })
}

function joinLobby(data){
    return new Promise((resolve, reject) => {
        lobbyModel.findOne({lobbyCode: data.lobbyCode})
    .then(lobby => {
        console.log('Lobby encontrado: ', lobby);
        lobbyModel.findOneAndUpdate({lobbyCode: data.lobbyCode}, {$push: {players: {name: data.name, state: false}}}, {new: true})
        .then(lobbyUpdated => {
            console.log('Lobby actualizado correctamente', lobbyUpdated);
            resolve(lobbyUpdated);
        })
        .catch(err => console.error('Error al actualizar lobby: ', err));
    })
    .catch(err => console.error('Error al encontrar el lobby: ', err));
    })
}

function playerState(data){
    return new Promise((resolve, reject) => {
        lobbyModel.findOne({lobbyCode: data.lobbyCode})
        .then(lobby => {
            console.log('Lobby encontrado: ', lobby);

            const players = lobby.players.map(player => 
                player.name == data.name ? {...player, state: data.playerState} : player
            );

            lobbyModel.findOneAndUpdate({lobbyCode: data.lobbyCode}, {players: players}, {new: true})
            .then(lobbyUpdated => {
                console.log('Estado actualizado en el lobby corectamente: ', lobbyUpdated);
                resolve(lobbyUpdated);
            })
            .catch(err => console.error('Error al actualizar estado del lobby: ', err));
    })
        .catch(err => console.error('Error al buscar el lobby: ', err));
    })
}

module.exports = {
    lobbys, 
    createLobby,
    joinLobby,
    playerState
}