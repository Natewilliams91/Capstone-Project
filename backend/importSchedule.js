require('dotenv').config();
const fs = require('fs');
const csvParser = require('csv-parser');
const mongoose = require('mongoose');
const Game = require('./models/Game');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

//Point to CSV file
const CSV_FILE_PATH = "NBA_Regular_Season_2024-25_Schedule.csv";

const importSchedule = async () => {
  try {
    const scheduleDocs = [];

    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csvParser())
      .on('data', (row) => {
        //CSV headers
        const gameDate = row.GameDate;           
        const startTime = row["Start(ET)"];       
        const awayTeam = row["Visitor/Neutral"];   
        const homeTeam = row["Home/Neutral"];      

        //Generate a unique ID from date, time, and teams
        const gameId = `${gameDate}_${startTime}_${awayTeam}_at_${homeTeam}`;

        scheduleDocs.push({
          gameId,
          season: "2024-2025",
          gameDate,
          startTime,
          homeTeam,
          awayTeam,
          homeScore: 0,
          awayScore: 0,
          status: "Scheduled"
        });
      })
      .on('end', async () => {
        await Game.insertMany(scheduleDocs);
        console.log(`✅ Successfully imported ${scheduleDocs.length} games!`);
        mongoose.connection.close();
      });
  } catch (error) {
    console.error("❌ Error importing schedule:", error);
    mongoose.connection.close();
  }
};

importSchedule();
