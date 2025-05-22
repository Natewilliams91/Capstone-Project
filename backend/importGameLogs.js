require('dotenv').config();
const fs = require('fs');
const csvParser = require('csv-parser');
const mongoose = require('mongoose');
const GameLog = require('./models/GameLog');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

const CSV_FILE_PATH = "NBA_PLAYER_GAMES.csv";

const importNewGameLogs = async () => {
  try {
    const gameLogs = [];
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csvParser())
      .on('data', (row) => {
        //parses the matcup column into team and opponent
        let teamAbbr = "";
        let opponentAbbr = "";
        if (row.MATCHUP.includes("@")) {
          [teamAbbr, opponentAbbr] = row.MATCHUP.split(" @ ");
        } else if (row.MATCHUP.includes("vs.")) {
          // fomaat handling
          [teamAbbr, opponentAbbr] = row.MATCHUP.split(" vs. ");
        } else {
          // safe store: store the entire string in team
          teamAbbr = row.MATCHUP;
          opponentAbbr = "";
        }

        gameLogs.push({

          playerId: row.Player_ID,
          team: teamAbbr,
          opponent: opponentAbbr,
          result: row.WL,

          minutesPlayed: parseFloat(row.MIN) || 0,
          fieldGoals: parseInt(row.FGM) || 0,
          fieldGoalAttempts: parseInt(row.FGA) || 0,
          fieldGoalPercentage: parseFloat(row.FG_PCT) || 0,

          threePointers: parseInt(row.FG3M) || 0,
          threePointAttempts: parseInt(row.FG3A) || 0,
          threePointPercentage: parseFloat(row.FG3_PCT) || 0,

          freeThrows: parseInt(row.FTM) || 0,
          freeThrowAttempts: parseInt(row.FTA) || 0,
          freeThrowPercentage: parseFloat(row.FT_PCT) || 0,

          offensiveRebounds: parseInt(row.OREB) || 0,
          defensiveRebounds: parseInt(row.DREB) || 0,
          totalRebounds: parseInt(row.REB) || 0,

          assists: parseInt(row.AST) || 0,
          steals: parseInt(row.STL) || 0,
          blocks: parseInt(row.BLK) || 0,
          turnovers: parseInt(row.TOV) || 0,
          personalFouls: parseInt(row.PF) || 0,
          points: parseInt(row.PTS) || 0,

          plusMinus: parseFloat(row.PLUS_MINUS) || 0,
          videoAvailable: parseInt(row.VIDEO_AVAILABLE) || 0,

          // CSV doesn't have gameScore, so default to 0
          gameScore: 0,

          gameDate: row.GAME_DATE,
          dateAdded: row.DATE_ADDED
        });
      })
      .on('end', async () => {
        // Insert all logs into the DB
        await GameLog.insertMany(gameLogs);
        console.log(`✅ Imported ${gameLogs.length} new game logs!`);
        mongoose.connection.close();
      });
  } catch (error) {
    console.error("❌ Error importing new game logs:", error);
    mongoose.connection.close();
  }
};

importNewGameLogs();
