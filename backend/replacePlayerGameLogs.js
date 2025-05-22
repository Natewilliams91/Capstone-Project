require('dotenv').config();
const mongoose = require('mongoose');
const GameLog = require('./models/GameLog');
const Player = require('./models/Player');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

const replacePlayerGameLogs = async () => {
  try {
    //Clear existing game logs 
    await Player.updateMany({}, { $set: { gameLogs: [] } });
    console.log('✅ Cleared existing game logs from all players');

    //Aggregate new game logs by playerId
    const aggregatedLogs = await GameLog.aggregate([
      {
        $group: {
          _id: "$playerId",
          logs: { $push: "$$ROOT" }
        }
      }
    ]);

    //For each group of logs, update the player
    for (const group of aggregatedLogs) {
      const playerId = group._id;
      const logs = group.logs;

      //Match the Player doc by playerId
      await Player.updateOne(
        { playerId: playerId },
        { $set: { gameLogs: logs } }
      );
    }

    console.log('✅ Successfully replaced game logs for each player');
  } catch (error) {
    console.error('❌ Error replacing game logs:', error);
  } finally {
    mongoose.connection.close();
  }
};

replacePlayerGameLogs();
