const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  const { customId, values } = interaction;

  const row = sendBtn(customId, values);

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setDescription(`Please confirm to update for the raid ${values[0]}.`);

  await interaction.update({
    content: "",
    embeds: [embed],
    components: [row],
  });
};

function sendBtn(customId, values) {
  const id = `${customId}_${values[0]}`;
  const confirm = new ButtonBuilder()
    .setCustomId(id)
    .setLabel("✅")
    .setStyle(ButtonStyle.Success);

  const cancel = new ButtonBuilder()
    .setCustomId(`${id}_remove`)
    .setLabel("🗑️")
    .setStyle(ButtonStyle.Danger);

  return new ActionRowBuilder().addComponents(confirm, cancel);
}
