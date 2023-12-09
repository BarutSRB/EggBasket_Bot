const { CommandType } = require("wokcommands");
const { showLeaderboard } = require("../utils/utils");

module.exports = {
  description: "Shows leaderboard for specified raid or Elo score",
  type: CommandType.SLASH,
  options: [
    {
      name: "type",
      description: "Choose a raid name or Elo",
      type: 3,
      required: true,
      choices: [
        { name: "Elo", value: "Elo" },
        { name: "Hellcali", value: "hellcali" },
        { name: "Helltan", value: "helltan" },
        { name: "Hellkas", value: "hellkas" },
        { name: "Hellkul", value: "hellkul" },
        { name: "Hellshaza", value: "hellshaza" },
        { name: "Deathless Helltan", value: "helltanDeathless" },
        { name: "Deathless Hellkas", value: "hellkasDeathless" },
        { name: "Deathless Hellkul", value: "hellkulDeathless" },
        { name: "Deathless Hellshaza", value: "hellshazaDeathless" },
        { name: "Thaemine", value: "thaemine" },
      ],
    },
  ],
  callback: async ({ interaction, client }) => {
    const { options, user, guild } = interaction;

    const type = options.getString("type");

    // Fetch the guild object using the client
    if (!guild) {
      console.error(`Guild not found with ID: ${interaction.guild_id}`);
      await interaction.reply({ content: 'Make sure you are using the command in a channel where bot has permissions.', ephemeral: true });
      return;
    }

    // Fetch the member object to get the nickname
    let member;
    try {
      member = await guild.members.fetch(user.id);
    } catch (error) {
      console.error(`Error fetching member with ID: ${user.id}`, error);
      await interaction.reply({ content: 'An error occurred while finding your member information.', ephemeral: true });
      return;
    }

    const nickname = member ? member.nickname : null;
    const nameToDisplay = nickname || user.username;

    console.log(`${nameToDisplay} (${user.tag}) used the leaderboard command with choice: ${type}`);

    // Assuming showLeaderboard is an asynchronous function, you might want to await it
    await showLeaderboard(type, interaction);
  },
};
