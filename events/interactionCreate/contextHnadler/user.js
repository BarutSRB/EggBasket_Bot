const { getInventoryDoc } = require("../../../utils/getDatabase");
const { validateMemberRole } = require("../../../utils/validate");
const {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require("discord.js");

module.exports = async (interaction) => {
  if (!interaction.isContextMenuCommand()) return;

  const { member, targetId, commandType } = interaction;
  const isValidMember = await validateMemberRole(member, interaction);

  if (!isValidMember) return;

  const type = commandType === 2 ? "user" : "message";
  sendDropDown(interaction, targetId, type);
};

async function sendDropDown(interaction, targetId, type) {
  const { raidsArray } = await getInventoryDoc();

  const options = raidsArray.map((raid) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(raid)
      .setDescription(`Raid ${raid}`)
      .setValue(raid)
  );

  const select = new StringSelectMenuBuilder()
    .setCustomId(`raidSelect_${targetId}_${type}`)
    .setPlaceholder("Make a selection!")
    .addOptions(...options);

  const row = new ActionRowBuilder().addComponents(select);

  await interaction.reply({
    content: "Choose your raid!",
    components: [row],
    ephemeral: true,
  });
}
