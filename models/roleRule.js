const mongoose = require("mongoose");

const roleRuleSchema = new mongoose.Schema({
  raidName: {
    type: String,
    required: true,
    unique: true,
  },
  clearCount: {
    type: Number,
    required: true,
    min: 1,
  },
  roleId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("RoleRule", roleRuleSchema);
