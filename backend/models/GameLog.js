const mongoose = require('mongoose');

const GameLogSchema = new mongoose.Schema({
  // Unique ID linking to the Player
  playerId: { type: String, required: true },

  // If you want to store player name as well
  playerName: { type: String },

  // Team and Opponent
  team: String,
  opponent: String,

  // Win/Loss indicator
  result: String,

  // Core stats
  minutesPlayed: Number,
  fieldGoals: Number,
  fieldGoalAttempts: Number,
  fieldGoalPercentage: Number,
  threePointers: Number,
  threePointAttempts: Number,
  threePointPercentage: Number,
  freeThrows: Number,
  freeThrowAttempts: Number,
  freeThrowPercentage: Number,
  offensiveRebounds: Number,
  defensiveRebounds: Number,
  totalRebounds: Number,
  assists: Number,
  steals: Number,
  blocks: Number,
  turnovers: Number,
  personalFouls: Number,
  points: Number,

  // Additional fields
  plusMinus: Number,
  videoAvailable: Number,
  gameScore: Number,
  gameDate: String,
  dateAdded: String
});

module.exports = mongoose.model('GameLog', GameLogSchema);
