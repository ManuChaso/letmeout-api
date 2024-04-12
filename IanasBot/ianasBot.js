//Dependencies
const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getLobbys, getLobby } = require('../utils/utils');

//Bot commands
const { lobbysList, lobbyInfo, gameData } = require('./botCommands.js');

//Discord channel where game data is sent
const channelId = '1223681352809975829';

//Create Discord bot
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

//Bot events
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
    case 'Santi' || 'santi':
      message.reply('Esto ya lo vimos en Javascript');
      break;
  }
});

//Send game data when players lose
function sendGameData(data, res) {
  const embed = new EmbedBuilder()
    .setTitle(`Datos del jugador: ${data.userName}`)
    .setDescription('Letmeout Statistics')
    .setColor('#90EE90')
    .setFields(
      { name: 'Total clicks', value: `${data.clicks}`, inline: true },
      { name: 'Messages sent', value: `${data.sent}`, inline: true },
      { name: 'Messages received', value: `${data.received}`, inline: true },

      { name: '\u200b', value: '\u200b' },

      { name: 'Time on Stage 1', value: `${data.stage1}s`, inline: true },
      { name: 'Time on Stage 2', value: `${data.stage2}s`, inline: true },
      { name: 'Time on Stage 3', value: `${data.stage3}s`, inline: true },

      { name: '\u200b', value: '\u200b' },

      { name: 'Time on MemoryPath', value: `${data.minigames0}s`, inline: true },
      { name: 'Time on NeuralLink', value: `${data.minigames1}s`, inline: true },
      { name: 'Time on Smash', value: `${data.minigames2}s`, inline: true },

      { name: '\u200b', value: '\u200b' },

      { name: 'MemoryPath', value: `${data.games0} fails`, inline: true },
      { name: 'NeuralLink', value: `${data.games1} fails`, inline: true },
      { name: 'Smash', value: `${data.games2} fails`, inline: true },

      { name: '\u200b', value: '\u200b' },

      { name: 'Hidden ending', value: `${data.alternative}`, inline: true },
      { name: 'Total time', value: `${data.total}`, inline: true }
    );

  const channel = client.channels.cache.get(channelId);

  if (channel) {
    channel
      .send({ embeds: [embed] })
      .then(() => {
        res.status(200).send('Data saved');
      })
      .catch((err) => console.log('Error sending message', err));
  } else {
    console.log('Channel not found');
  }
}

//Start bot
function startIanasBot() {
  client.login(process.env.DISCORD_TOKEN);
}

module.exports = { startIanasBot, sendGameData };
