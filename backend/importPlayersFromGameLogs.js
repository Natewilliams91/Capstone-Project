require('dotenv').config();
const mongoose = require('mongoose');
const GameLog = require('./models/GameLog');
const Player = require('./models/Player');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

const importPlayers = async () => {
    try {
        console.log("🔄 Extracting unique players from game logs...");

        // Get all unique player names from game logs
        const playersFromGameLogs = await GameLog.aggregate([
            { $group: { _id: "$playerName", team: { $first: "$team" } } }
        ]);

        // Store each unique player in the Players collection
        const playersToInsert = playersFromGameLogs.map(player => ({
            playerName: player._id,
            team: player.team,
        }));

        await Player.insertMany(playersToInsert, { ordered: false }).catch(err => {
            console.log("⚠️ Some players were already stored, skipping duplicates...");
        });

        console.log("✅ Players imported successfully from game logs!");
    } catch (error) {
        console.error("❌ Error importing players:", error);
    } finally {
        mongoose.connection.close();
    }
};

importPlayers();
