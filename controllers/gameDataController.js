const { sendGameData } = require('../IanasBot/ianasBot');

function gameData(req, res) {
  const data = req.body;
  const stats = { userName: data.username };

  data.stats.forEach((object) => {
    let entries = Object.entries(object);
    entries.forEach(([key, value]) => {
      console.log(key);
      if (!stats.hasOwnProperty(key) && !Array.isArray(value)) {
        console.log('No array', value);
        stats[key] = object[key];
      } else {
        console.log('array', value);
        value.forEach((value, index) => {
          stats[`${key}${index}`] = value;
        });
      }
    });
  });

  console.log(stats);
  sendGameData(stats, res);
}

module.exports = gameData;
