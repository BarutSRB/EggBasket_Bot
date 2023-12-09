const { getInventoryDoc } = require("./getDatabase");
const {
  validateRoleIds,
  barutRole,
} = require("../config.json");

const validateRaidName = async function (raidName, interaction) {
  const { raidsArray } = await getInventoryDoc();

  if (!raidsArray.includes(raidName)) {
    await interaction.reply({
      content: "Invalid raid name. Please select a valid option.",
      ephemeral: true,
    });
    return false;
  }
  return true;
};

const validateMemberRole = async function (member, interaction) {
  if (member.id === barutRole) {
    return true;
  }

  const roleIds = [...validateRoleIds];
  const hasRole = roleIds.some((role) => member.roles.cache.has(role));

  if (!hasRole) {
    await interaction.reply({
      content: "Only Staff can use the command!",
      ephemeral: true,
    });
    return false;
  }
  return true;
};

module.exports = { validateRaidName, validateMemberRole };