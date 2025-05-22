require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const Player = require('./models/Player');
const Team = require('./models/Team');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

const ROSTER_FILE_PATH = "2024-25.NBA.Roster.json";

const importRoster = async () => {
  try {
    //Read and parse the JSON file
    const rawData = fs.readFileSync(ROSTER_FILE_PATH, 'utf8');
    const data = JSON.parse(rawData);

    //only keep those with tid from 0 to 29
    const players = data.players
      .filter(player => player.tid >= 0 && player.tid <= 29)
      .map(player => ({
        tid: player.tid,
        name: player.name,
        pos: player.pos,
        imgURL: player.imgURL,
        stats: player.stats
      }));

    //only keep teams with tid up to 29
    const teams = data.teams
      .filter(team => team.tid <= 29)
      .map(team => ({
        tid: team.tid,
        region: team.region,
        name: team.name,
        abbrev: team.abbrev,
        imgURL: team.imgURL,
        imgURLSmall: team.imgURLSmall
      }));

    // Insert the data into MongoDB
    await Player.insertMany(players);
    await Team.insertMany(teams);

    console.log("✅ Roster successfully imported into MongoDB!");
  } catch (error) {
    console.error("❌ Error importing roster:", error);
  } finally {
    mongoose.connection.close();
  }
};

importRoster();
