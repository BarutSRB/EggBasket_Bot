const { Client, IntentsBitField, Partials } = require("discord.js");
const WOK = require("wokcommands");
const { DefaultCommands } = WOK;
const mongoose = require("mongoose");

const path = require("path");
const config = require("./config.json");
const roleRuleSchema = require("./models/roleRule");
const eloRankSchema = require("./models/eloRank");

const { token, mongoURI, roleRule, eloRank } = config;
const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.DirectMessages,
    IntentsBitField.Flags.MessageContent,
  ],
  partials: [Partials.Channel],
});
client.on("ready", async () => {
  console.log("running");

  await mongoose.connect(mongoURI);

  //After first run uncomment 28-46 lines!!!!!!!!!!!
  //for (const rank of eloRank) {
    //const { tierDivision, minElo, maxElo } = rank;

    //await eloRankSchema.create({
      //tierDivision,
      //minElo,
      //maxElo,
    //});
  //}

  //for (const role of roleRule) {
    //const { raidName, clearCount, roleId } = role;

    //await roleRuleSchema.create({
      //raidName,
      //clearCount,
      //roleId,
    //});
  //}

  new WOK({
    client,
    commandsDir: path.join(__dirname, "./commands"),
    events: {
      dir: path.join(__dirname, "events"),
    },
    disabledDefaultCommands: [
      DefaultCommands.ChannelCommand,
      DefaultCommands.CustomCommand,
      DefaultCommands.Prefix,
      DefaultCommands.RequiredPermissions,
      DefaultCommands.RequiredRoles,
      DefaultCommands.ToggleCommand,
    ],
    cooldownConfig: {
      errorMessage: "Please wait {TIME} before doing that again.",
      botOwnersBypass: false,
      dbRequired: 300,
    },
  });
});
client.login(token);
