const mongoose = require('mongoose');
const { off } = require('./GameLog');

const TeamSchema = new mongoose.Schema({
    tid: Number,       // Unique Team ID
    region: String,    // Team region (e.g., "Los Angeles")
    name: String,      // Team name (e.g., "Lakers")
    abbrev: String,    // Abbreviation (e.g., "LAL")
    imgURL: String,    // Team logo
    imgURLSmall: String, // Small version of team logo
    conf: String,      // Conference (e.g., "Western")
    div: String,       // Division (e.g., "Pacific")
    gp: Number,        // Games played
    ppg: Number,       // Points per game
    oppg: Number,      // Opponent points per game
    pdiff: Number,     // Point differential
    pace: Number,      // Pace
    offRtg: Number,    // Offensive rating
    defRtg: Number,    // Defensive rating
    Rtgdiff: Number,    // rating differential
    sos: Number,       // Strength of schedule
    win: Number,       // Wins
    loss: Number,      // Losses
    winPct: Number,    // Win percentage
});

module.exports = mongoose.model('Team', TeamSchema);
