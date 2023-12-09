const { logsChannel } = require("../config.json");
const { EmbedBuilder } = require("discord.js");

const embed = new EmbedBuilder().setColor(0x0099ff).setTimestamp();

const sendLogs = async (title, text, guild) => {
  try {
    embed.setTitle(title).setDescription(text);

    const logs = await guild.channels.fetch(logsChannel);
    await logs.send({ embeds: [embed] });
  } catch (error) {
    console.error("Error sending logs:", error);
    // You can add additional error handling or logging here if needed.
  }
};

const sendEmbedToUser = async (title, text, member) => {
  try {
    embed.setTitle(title).setDescription(text);

    await member.send({ embeds: [embed] });
  } catch (error) {
    console.error("Error sending embed to user:", error);
    // You can add additional error handling or logging here if needed.
  }
};

module.exports = { sendLogs, sendEmbedToUser };
