const {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  REST,
  Routes,
} = require("discord.js");
const { botId, guildId, token } = require("./config.json");

const commands = [
  new ContextMenuCommandBuilder()
    .setName("updateUser")
    .setType(ApplicationCommandType.User),
  new ContextMenuCommandBuilder()
    .setName("updateAll")
    .setType(ApplicationCommandType.Message),
];

const rest = new REST().setToken(token);
(async () => {
  try {
    console.log("Registering the context menu commands!");

    await rest.put(Routes.applicationGuildCommands(botId, guildId), {
      body: commands,
    });

    console.log("Successfully registered the commands!");
  } catch (error) {
    console.log(error);
  }
})();
