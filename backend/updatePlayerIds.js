require('dotenv').config();
const fs = require('fs');
const csvParser = require('csv-parser');
const mongoose = require('mongoose');
const Player = require('./models/Player');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

const CSV_FILE_PATH = "NBA_PLAYERS.csv";

const updatePlayerIds = async () => {
  const updates = [];

  //Read CSV file
  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csvParser())
    .on('data', (row) => {
      const csvPlayerId = row.id;
      const csvPlayerName = row.full_name || row.Player;

      //Push an update instruction for each row
      updates.push({
        playerId: csvPlayerId,
        name: csvPlayerName
      });
    })
    .on('end', async () => {
      console.log(`Read ${updates.length} records from CSV. Starting updates...`);

      //Process update
      for (const record of updates) {
        try {
          //Find the player by name (assuming exact match)
          await Player.findOneAndUpdate(
            { name: record.name },
            { $set: { playerId: record.playerId } },
            { new: true } 
          );
        } catch (error) {
          console.error(`❌ Error updating player ${record.name}:`, error);
        }
      }

      console.log('✅ Finished updating player IDs!');
      mongoose.connection.close();
    });
};

updatePlayerIds();
