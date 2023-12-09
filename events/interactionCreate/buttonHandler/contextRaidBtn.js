const { EmbedBuilder } = require("discord.js");
const {
  getMentionIds,
  isUsedMessageFunc,
  addRoleRule,
  findMessage,
  createMessage,
} = require("../../../utils/utils");
const {
  updateElo,
  convertRaidNameToClearKey,
  getRankFromElo,
} = require("../../../utils/eloHelpers");
const { sendLogs } = require("../../../utils/embedHelpers");
const playerSchema = require("../../../models/playerSchema");

module.exports = async (interaction) => {
  if (!interaction.isButton()) return;

  const {
    customId,
    channel,
    message: { embeds },
    user,
    guild,
  } = interaction;

  const [isValid, Id, type, raid, remove] = customId.split("_");

  if (isValid !== "raidSelect") return;

  const editedEmbed = EmbedBuilder.from(embeds[0]).setDescription(
    `Opeartion under progress, please keep checking logs.`
  );

  await interaction.update({
    embeds: [editedEmbed],
    components: [],
  });

  let logsText = "";
  let title = `Elo Updated by ${user.username} on raid ${raid}.`;

  if (type === "message") {
    const message = await channel.messages
      .fetch(Id)
      .catch((err) => console.error(err));

    if (!message) {
      await interaction.followUp({
        content: "Message not found",
        ephemeral: true,
      });
      return;
    }

    const ids = getMentionIds(message.mentions, user.id);

    if (ids.length > 8) {
      await interaction.followUp({
        content: "The mentioned people must not be greater than 8.",
        ephemeral: true,
      });
      return;
    }

    if (remove === "remove") {
      const messageDb = await findMessage(Id);
    await  messageDb.deleteOne().catch((err) => console.error(err));
      createMessage(Id);
    } else {
      const isUsedMessage = await isUsedMessageFunc(Id);

      if (!isUsedMessage) {
        await interaction.followUp({
          content: "This message ID has already been used to update ELO.",
          ephemeral: true,
        });
        return;
      }
    }

    for (const id of ids) {
      if (remove === "remove") {
        title = `Clear removed and Elo reverted by ${user.username} on raid ${raid}.`;
        const result = await removeClears(id, raid);

        if (!result) continue;

        logsText += result;
      } else {
        const member = await guild.members
          .fetch(id)
          .catch((err) => console.error(err));

        if(!member){
          console.log(`Player with id ${id} not found in server!`)
          continue;
        }

        logsText += await updateElo(id, raid, member.user);

        addRoleRule(id, raid, guild);
      }
    }

    await interaction.followUp({
      content: `ELO, and Rank updated for ${ids.length} players in raid ${raid}.`,
      ephemeral: true,
    });

    logsText += `\`Message\`: ${message.url}`;
    await message
      .react("👌")
      .catch((e) => console.error("Failed to add reaction:", e));
  }

  if (type === "user") {
    if (remove === "remove") {
      title = `Clear removed and Elo reverted by ${user.username} on raid ${raid}.`;
      const result = await removeClears(Id, raid);

      if (!result) {
        await interaction.followUp({
          content: `Player <@${Id}> does not exist in database or has zero clears.`,
          ephemeral: true,
        });
        return;
      }

      logsText += result;
    } else {
      const member = await guild.members
        .fetch(Id)
        .catch((err) => console.error(err));
      if(!member){
          console.log(`Player with id ${id} not found in server!`)
          await interaction.followUp({
      content: `<@${Id}> is not in this server!`,
      ephemeral: true,
    });
        return
      }

      logsText += await updateElo(Id, raid, member.user);

      addRoleRule(Id, raid, guild);
    }

    await interaction.followUp({
      content: `ELO, and Rank updated for <@${Id}> player in raid ${raid}.`,
      ephemeral: true,
    });
  }

  sendLogs(title, logsText, guild);
};

async function removeClears(playerId, raid) {
  let player = await playerSchema.findOne({ playerId });

  const clearKey = convertRaidNameToClearKey(raid);
  if (!player || player.clears[clearKey] === 0) return;

  player.eloScore = player.originalEloScore;
  player.eloRank = await getRankFromElo(player.eloScore);

  player.clears[clearKey]--;

  await player.save();

  const text = `Player <@${playerId}> ~ New Elo: \`${player.eloScore}\` | Elo Rank: \`${player.eloRank}\`\nClears: \`${player.clears[clearKey]}\`\n\n`;

  return text;
}
