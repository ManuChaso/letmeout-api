//slash commands for discord bot

const lobbysList = {
  name: 'lobbys',
  description: 'Show active lobbys',
};

const lobbyInfo = {
  name: 'lobby',
  description: 'Show active lobbys',
  options: [
    {
      name: 'code',
      description: 'Lobby code',
      type: 3,
      required: true,
    },
  ],
};
const gameData = {
  name: 'gamedata',
  description: 'Show active lobbys',
};

module.exports = {
  lobbysList,
  lobbyInfo,
  gameData,
};
