const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    unique: true,
  },
  mentionableName: {
    type: String,
    required: true,
  },
  clears: {
    hellcali: { type: Number, default: 0 },
    helltan: { type: Number, default: 0 },
    hellkas: { type: Number, default: 0 },
    hellkul: { type: Number, default: 0 },
    hellshaza: { type: Number, default: 0 },
    helltanDeathless: { type: Number, default: 0 },
    hellkasDeathless: { type: Number, default: 0 },
    hellkulDeathless: { type: Number, default: 0 },
    hellshazaDeathless: { type: Number, default: 0 },
    thaemine: { type: Number, default: 0 },
  },
  eloScore: {
    type: Number,
    default: 1000,
  },
  originalEloScore: {
    type: Number,
    default: 1000,
  },
  eloRank: {
    type: String,
    default: "Unranked",
  },
  lastEloUpdate: {
    type: Date,
    default: new Date(),
  },
  monthlyClears: {
    type: Map, // string storing Month-Year October-2023
    of: Map,  // Inner Map will have raid name as key and clear count as value.
    default: new Map()
  },
});

module.exports = mongoose.model("Player", playerSchema);