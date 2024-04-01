const fs = require('fs');

function convertToCSV(data) {
  const teamName = data.teamName;
  const teamTime = data.teamTime;
  const players = data.players.map((player) => `${teamName}, ${teamTime}, ${player.name}, ${player.time}`).join('\n');
  return players;
}

function writeInCSV(CSVData, fileName, res) {
  fs.appendFile(fileName, CSVData + '\n', (err) => {
    if (err) {
      console.error('Error al escribir los datos en el archivo', err);
    } else {
      console.log('Datos escritos en el archivo correctamente');
    }
  });
}

function storeData(data) {
  console.log(data);
  const CSVFile = convertToCSV(data);
  writeInCSV(CSVFile, 'storeData/data.csv', res);
}

module.exports = {
  storeData,
};
