const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const randomstring = require('randomstring');

const app = express();
const server = http.createServer(app);
const ws = new WebSocket.Server({ noServer: true });
const lobbyModel = require('./models/lobby.js');

const PORT = process.env.PORT || 3000;

const mongoUrl = 'mongodb+srv://LucaJeniManu:LucaJeniManu@testlobby.rsilvu4.mongodb.net/?retryWrites=true&w=majority';

const connectDB = async () => {
    try {
        await mongoose.connect(mongoUrl)
        console.log('Conectado papa');
    }catch (err){
        console.log('Lo siento, no quiero', err);
    }
}

connectDB();

ws.on('connection', (socket) => {
    console.log('Cliente conectado');

    socket.on('message', message => {

        const access = JSON.parse(message);
        
        if(access.join){
            lobbyModel.find({lobbyCode: access.lobbyCode})
                .then(result => {
                    console.log('encontrado', result);
                    lobbyModel.findOneAndUpdate({lobbyCode: access.lobbyCode}, {$push: {players: {name: access.name, state: false}}}, {new: true})
                        .then(lobbyUpdated => {
                            console.log('lobby actualizado', lobbyUpdated);
                        })
                        .catch(err => {
                            console.error('Error al actualizar lobby', err);
                        })
                })
                .catch(err => {
                    console.error('Error al buscar en la base de datos', err);
                })
        }else{
            const createLobby = new lobbyModel({
                lobbyCode : randomstring.generate({length: 4, charset: 'numeric'}),
                players : [{name: access.name, state: false}]
            })
            createLobby.save()
                .then(savedLobby => {
                    console.log('lobby generado', savedLobby);
                })
                .catch(err => {
                    console.error('error al guardar lobby', err)
                })
        }
    })
});

server.on('upgrade', (request, socket, head) => {
    ws.handleUpgrade(request, socket, head, (socket) => {
        ws.emit('connection', socket, request);
    });
});

server.listen(PORT, () => {
    console.log('Servidor levantado en el puerto:', PORT);
});