const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
//unique id for each game
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  season: {
    type: String,
    default: "2024-2025"
  },
  // Storing date/time as strings
  gameDate: String,      
  startTime: String,     
  
  // Teams
  homeTeam: String,
  awayTeam: String,

  // Default to 0 if no scores are provided
  homeScore: { type: Number, default: 0 },
  awayScore: { type: Number, default: 0 },

  // Track game status
  status: {
    type: String,
    enum: ["Scheduled", "In Progress", "Final"],
    default: "Scheduled"
  }
});

module.exports = mongoose.model('Game', GameSchema);
