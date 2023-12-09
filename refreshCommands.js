const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
const { botId, token } = require('./config.json');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Place your client ID here
const rest = new REST({ version: '9' }).setToken(token);

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (!command.data || typeof command.data.toJSON !== 'function') {
    console.error(`Command "${file}" does not have a data property with a toJSON method`);
    continue; // Skip this command and continue with the next one
  }
  commands.push(command.data.toJSON());
}

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // Clear all global commands
    await rest.put(
      Routes.applicationCommands(botId),
      { body: [] },
    );

    console.log('Successfully deleted all global application (/) commands.');

    // Registering commands again globally
    await rest.put(
      Routes.applicationCommands(botId),
      { body: commands },
    );

    console.log('Successfully re-registered global application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
