const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Discord = require('discord.js');
const { getLobbys, getLobby } = require('../utils/utils');
const fs = require('fs');

const { lobbysList, lobbyInfo, gameData } = require('./botCommands.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.on('ready', async () => {
  console.log('Bot conectado');

  // Registrar el comando en Discord
  const LobbysCommand = await client.application?.commands.create(lobbysList);
  console.log(`Comando de barra "${LobbysCommand.name}" registrado.`);
  const lobbyCommand = await client.application?.commands.create(lobbyInfo);
  console.log(`Comando de barra "${lobbyCommand.name}" registrado.`);
  const dataCommand = await client.application?.commands.create(gameData);
  console.log(`Comando de barra "${dataCommand.name}" registrado.`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  switch (commandName) {
    case 'lobbys':
      getLobbys()
        .then((lobbys) => {
          const shortLobbys = lobbys.slice(0, 25);
          const embed = new EmbedBuilder()
            .setTitle('Lista de lobbys')
            .setColor('#0099ff')
            .setFields(
              shortLobbys.map(
                (lobby) => lobby && { name: `LobbyCode: ${lobby.lobbyCode}`, value: `Creator: ${lobby.creator}` }
              )
            );

          interaction.reply({ embeds: [embed] });
        })
        .catch((err) => console.log('Error mostrando los lobbys: ', err));
      break;

    case 'lobby':
      const lobbyCode = options.get('code');
      getLobby(lobbyCode.value)
        .then((lobby) => {
          const embed = new EmbedBuilder()
            .setTitle(`Lobby ${lobby.lobbyCode}`)
            .setColor('#0099ff')
            .setFields(
              lobby.players.map((player) => player && { name: `Nombre: ${player.name}`, value: `Id: ${player.id}` })
            );
          interaction.reply({ embeds: [embed] });
        })
        .catch((err) => console.log('Error al mostrar info del lobby: ', err));

      break;

    case 'gamedata':
      await interaction.reply({
        content: 'Aqui tienes tu archivo Jeni 👍',
        files: ['storeData/data.csv'],
      });
  }
});

/// JOKES
client.on('messageCreate', (message) => {
  switch (message.content) {
    case 'Luca':
      message.reply(':bug:');
      break;
  }
});

function startIanasBot() {
  client.login('MTIxNDczMjE4NTkxNjAxODc0OQ.GUGsoN.7ytzhCN8U79RivYI9v25O9b-3Qyo6dKTZIMDZ8');
}

module.exports = { startIanasBot };
