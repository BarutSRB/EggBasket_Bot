const { CommandType } = require("wokcommands");
const { updateElo,  } = require("../utils/eloHelpers");
const { getInventoryDoc } = require("../utils/getDatabase");
const { validateMemberRole, validateRaidName } = require("../utils/validate");
const { sendLogs } = require("../utils/embedHelpers");
const {
  getMentionIds,
  isUsedMessageFunc,
  addRoleRule,
} = require("../utils/utils");

module.exports = {
  description: "Update ELO and rank for raid clears",
  type: CommandType.SLASH,
  options: [
    {
      name: "raid",
      description: "Select the raid",
      type: 3,
      required: true,
      autocomplete: true,
    },
    {
      name: "message_id",
      description: "Enter the message ID containing player mentions",
      type: 3,
      required: true,
    },
  ],
  autocomplete: async (command, argument, interaction) => {
    const doc = await getInventoryDoc();
    return doc.raidsArray;
  },

  callback: async ({ interaction }) => {
    const { member, client, options, channel, guild, user } = interaction;
    try {
      const isValidMember = await validateMemberRole(member, interaction);
      if (!isValidMember) return;

      const raid = options.getString("raid");
      const messageId = options.getString("message_id");

      const isValidRaid = await validateRaidName(raid, interaction);
      if (!isValidRaid) return;

      const targetMessage = await channel.messages
        .fetch(messageId)
        .catch((e) => console.error(e));

      if (!targetMessage) {
        await interaction.reply({
          content:
            "Invalid message id or make sure the message exists inside the current channel.",
          ephemeral: true,
        });
        return;
      }

      // Extract the sender (author) of the target message
      const messageSenderId = targetMessage.author.id;

      const playerIds = getMentionIds(targetMessage.mentions, messageSenderId);

      // console.log(targetMessage);
      // console.log(targetMessage.url);

      if (playerIds.length > 8) {
        await interaction.reply({
          content: "The mentioned people must not be greater than 8.",
          ephemeral: true,
        });
        return;
      }

      const isUsedMessage = await isUsedMessageFunc(messageId);

      if (!isUsedMessage) {
        await interaction.reply({
          content: "This message ID has already been used to update ELO.",
          ephemeral: true,
        });
        return;
      }

      await interaction.reply({
        content: "Updating the data...",
        ephemeral: true,
      });

      let logsText = "";

      const title = `Elo Updated by ${user.username} on raid ${raid}.`;

      for (const playerId of playerIds) {
        const user = await client.users
          .fetch(playerId)
          .catch((e) => console.error(e));

        logsText += await updateElo(playerId, raid, user);

        // Call addRoleRule and wait for it to return the role assignment message
        const roleAssignmentMessage = await addRoleRule(playerId, raid, guild);
        if (roleAssignmentMessage) {
          logsText += roleAssignmentMessage + '\n'; // Append the message to logsText
        }

        logsText += '\n━━━━━━━━━\n';
      }

      await interaction.followUp({
        content: `ELO, Rank and Role updated for ${playerIds.length} players in raid ${raid}.`,
        ephemeral: true,
      });

      // Add the ✅ emoji reaction to the targetMessage
      await targetMessage
        .react("✅")
        .catch((e) => console.error("Failed to add reaction:", e));

      logsText += `\`Message\`: ${targetMessage.url}`;

      sendLogs(title, logsText, guild);
    } catch (error) {
      console.error("Error handling /update command:", error);
      await interaction.followUp({
        content: "An error occurred while processing the update.",
        ephemeral: true,
      });
    }
  },
};
