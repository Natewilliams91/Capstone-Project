require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const mongoose = require('mongoose');
const Team = require('./models/Team');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

const CSV_FILE_PATH = path.join(__dirname, "NBA_Team_Stats.csv"); 

// Function to parse numbers 
const parseNumber = (value) => {
    if (!value || value === '') return 0;
    return parseFloat(value.toString().replace(/,/g, '')) || 0;
};

const importTeamData = async () => {
    const teams = [];

    fs.createReadStream(CSV_FILE_PATH)
        .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() })) // Trim column headers
        .on('data', (row) => {
            const tid = Number(row.tid || row.Tid || row.TID); // Force conversion to Number
            if (isNaN(tid) || tid < 0 || tid > 29) { // Ensure valid NBA team by tid
                console.warn(`⚠️ Skipping row due to invalid tid:`, row);
                return;
            }

            teams.push({
                tid: tid,
                conf: row.CONF,      
                div: row.DIVISION,       
                gp: parseNumber(row.GP), 
                ppg: parseNumber(row.PPG),       
                oppg: parseNumber(row.oPPG),      
                pdiff: parseNumber(row.pDIFF),     
                pace: parseNumber(row.PACE),      
                offRtg: parseNumber(row.oEFF),    
                defRtg: parseNumber(row.dEFF),    
                Rtgdiff: parseNumber(row.eDIFF),    
                sos: parseNumber(row.SoS),       
                win: parseNumber(row.W),       
                loss: parseNumber(row.L),      
                winPct: parseNumber(row['WIN%']),
            });
        })
        .on('end', async () => {
            try {
                for (let team of teams) {
                    await Team.updateOne(
                        { tid: team.tid }, 
                        { $set: team },    
                        { upsert: false }
                    );
                }
                console.log("✅ Team stats successfully updated in MongoDB!");
            } catch (error) {
                console.error("❌ Error updating data:", error);
            } finally {
                mongoose.connection.close();
            }
        });
};

importTeamData();

