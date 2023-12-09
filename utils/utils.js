const { getAggregatedDocs } = require("./getDatabase");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const playerSchema = require("../models/playerSchema");
const usedMessage = require("../models/usedMessage");
const roleRule = require("../models/roleRule");
const { convertRaidNameToClearKey } = require("./eloHelpers");

const addRoleRule = async (playerId, raid, guild) => {
  const clearKey = convertRaidNameToClearKey(raid);
  const player = await playerSchema.findOne({ playerId });
  const roleRuleDoc = await roleRule.findOne({ raidName: raid });
  let roleAssignmentMessage = ''; //send role message to logs

  if (player && roleRuleDoc) {
    if (player.clears[clearKey] >= roleRuleDoc.clearCount) {
      const guildMember = await guild.members
        .fetch(playerId)
        .catch((e) => console.error(e));

  if (guildMember) {
      await guildMember.roles.add(roleRuleDoc.roleId);
      roleAssignmentMessage = `Role <@&${roleRuleDoc.roleId}> assigned to <@${playerId}> for clear on ${raid}.`;
    }
  }
}

return roleAssignmentMessage;
};

const findMessage = async (messageId) =>
  await usedMessage.findOne({ messageId });

const createMessage = async (messageId) =>
  await usedMessage.create({ messageId });

const isUsedMessageFunc = async (messageId) => {
  const isUsedMessage = await findMessage(messageId);
  if (isUsedMessage) return;

  createMessage(messageId);

  return true;
};

const getMentionIds = function (mentions, id) {
  let ids = mentions.users.map((user) => user.id);

  return ids;
};

async function showLeaderboard(type, interaction) {
  try {
    let str, title;
    let isEloLeaderboard = type === "Elo";
    if (isEloLeaderboard) {
      str = "eloScore";
      title = "🏆 Elo Leaderboard 🏆";
    } else {
      str = `clears.${type}`;
      title = `Leaderboard for ${type} Raid Clears`;
    }

    const players = await playerSchema
      .find({ [str]: { $gte: isEloLeaderboard ? 1000 : 1 } }) // Adjust the threshold based on the leaderboard type
      .sort({ [str]: -1 })
      .limit(25)
      .exec();

    if (players.length === 0) {
      await interaction.reply({
        content: "Nothing to show yet.",
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor("#0099ff")
      .setFooter({ text: "For any fixes to your clears, DM @Barut1" });

    if (isEloLeaderboard) {
      // Define the tiers
      const tiers = {
        Challenger: { min: 2700, players: [] },
        Grandmaster: { min: 2600, max: 2699, players: [] },
        Master: { min: 2550, max: 2599, players: [] },
        Diamond: { min: 2300, max: 2549, players: [] },
        Platinum: { min: 2050, max: 2299, players: [] },
        Gold: { min: 1800, max: 2049, players: [] },
        Silver: { min: 1550, max: 1799, players: [] },
        Bronze: { min: 1300, max: 1549, players: [] },
        Iron: { min: 1000, max: 1299, players: [] },
      };

      // Assign players to tiers and display their positions
      players.forEach((player, index) => {
        const position = index + 1;
        const eloScore = Math.round(player.eloScore);
        const tierKey = Object.keys(tiers).find(
          (key) =>
            eloScore >= tiers[key].min &&
            (!tiers[key].max || eloScore <= tiers[key].max)
        );
        if (tierKey) {
          tiers[tierKey].players.push(
            `\`${position}. ${player.mentionableName} - ${eloScore}\``
          );
        }
      });

      // Add fields to embed for each tier with players
      const fields = [];
      Object.keys(tiers).forEach((tier) => {
        if (tiers[tier].players.length) {
          fields.push({
            name: `${tier} (${tiers[tier].players.length})`,
            value: tiers[tier].players.join("\n"),
            inline: false,
          });
        }
      });

      embed.addFields(fields);
    } else {
      // For non-Elo leaderboard, directly display positions and clear counts
      players.forEach((player, index) => {
        const position = index + 1;
        const clearsCount = player.clears[type]; // Access the clears count directly for the specific raid type
        embed.addFields({
          name: `${position}. ${player.mentionableName}`,
          value: `Clears: \`${clearsCount}\``,
          inline: true,
        });
      });
    }

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  } catch (err) {
    console.error(err);
    return "Error retrieving the leaderboard.";
  }
}

module.exports = {
  showLeaderboard,
  getMentionIds,
  isUsedMessageFunc,
  addRoleRule,
  createMessage,
  findMessage,
};
