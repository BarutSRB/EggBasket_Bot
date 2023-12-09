const mongoose = require("mongoose");

const usedMessageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
  },
  usedAt: {
    type: Date,
    default: new Date(),
  },
});

module.exports = mongoose.model("UsedMessage", usedMessageSchema);
