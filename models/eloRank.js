const mongoose = require("mongoose");

const eloRankSchema = new mongoose.Schema({
  tierDivision: {
    type: String,
    required: true,
    unique: true,
  },
  minElo: {
    type: Number,
    required: true,
  },
  maxElo: {
    type: Number,
    required: false,
  },
});

module.exports = mongoose.model("EloRank", eloRankSchema);
