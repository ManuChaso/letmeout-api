const {
  createLobby,
  joinLobby,
  exitLobby,
  playerState,
  sendMessage,
  chatMessage,
  assignRoom,
  shareTime,
  checkFinalCode,
  generateFinalCode,
  lose,
  setPlayerTime,
} = require('./utils.js');

function handleTag(data, client, ws) {
  switch (data.tag) {
    case 'createLobby':
      createLobby(data, client)
        .then((res) => sendMessage(res, client, ws))
        .catch((err) => console.log('Error in promise at creating lobby', err));
      break;

    case 'joinLobby':
      joinLobby(data, client)
        .then((res) => sendMessage(res, client, ws))
        .catch((err) => console.log('Error in promise at joining lobby', err));
      break;

    case 'exitLobby':
      exitLobby(client)
        .then((res) => sendMessage(res, client, ws))
        .catch((err) => console.error('Error in promise at leaving lobby', err));
      break;

    case 'playerState':
      playerState(data)
        .then((res) => sendMessage(res, client, ws))
        .catch((err) => console.log('Error in promise at updating player state', err));
      break;

    case 'chatMessage':
      const res = chatMessage(data);
      sendMessage(res, client, ws);
      break;

    case 'assignRoom':
      assignRoom(data)
        .then((res) => sendMessage(res, client, ws))
        .catch((err) => console.log('Error assigning rooms', err));
      break;

    case 'shareTime':
      const response = shareTime(data);
      sendMessage(response, client, ws);
      break;

    case 'generateAccessCard':
      imageGenerator(data).then((res) => client.send(res));
      break;

    case 'generateFinalCode':
      generateFinalCode(client);
      break;

    case 'checkFinalCode':
      checkFinalCode(data, client)
        .then((res) => sendMessage(res, client, ws))
        .catch((err) => console.log('Error checking final code', err));
      break;

    case 'setPlayerTime':
      setPlayerTime(data, client).then((res) => client.send('Tiempo guardado'));
      break;

    case 'lose':
      lose().then((res) => sendMessage(res, client, ws));
      break;

    default:
      console.log('No action (tag) defined on action');
      break;
  }
}

module.exports = {
  handleTag,
};
