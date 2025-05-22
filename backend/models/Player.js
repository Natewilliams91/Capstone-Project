const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  playerId: {
    type: String,
  },
  tid: Number,
  name: String,
  pos: String,
  imgURL: String,
  stats: Object,
  gameLogs: [
    {
      type: mongoose.Schema.Types.Mixed
    }
  ]
});

module.exports = mongoose.model('Player', PlayerSchema);
