const { CommandType } = require("wokcommands");
const playerSchema = require("../models/playerSchema");
const { EmbedBuilder } = require("discord.js");
const { AttachmentBuilder } = require('discord.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

module.exports = {
  description: "Shows player statistics based on username",
  type: CommandType.SLASH,
  options: [
    {
      name: "player",
      description: "Select a player",
      type: 6,
      required: true,
    },
  ],
callback: async ({ interaction }) => {
    const { options, user, guild } = interaction;

    const memberSelected = options.getMember('player');
    
    // Fetch the member object to get the nickname of the user who initiated the command
    const member = guild.members.resolve(user.id);
    const nickname = member ? member.nickname : null;
    const nameToDisplay = nickname || user.username;
    
    // Check if the selected member exists in the database
    const player = await playerSchema.findOne({ playerId: memberSelected.user.id });

    if (!player) {
      await interaction.reply({
        content: "Player not found!",
        ephemeral: true,
      });
      return;
    }

    console.log(`${nameToDisplay} (${user.tag}) used the player stats command to check: ${memberSelected.user.username} (${memberSelected.user.tag})`);

    await interaction.reply({
      content: "Getting the stats...",
      ephemeral: true,
    });

    const eloRanking = await playerSchema.countDocuments({
      eloScore: { $gt: player.eloScore },
    });

    // Get the avatar URL of the selected player
    const avatarURL = memberSelected.user.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setAuthor({ name: `${player.mentionableName}`, iconURL: avatarURL })
      .setThumbnail(avatarURL)
      .addFields(
        { name: "Elo Score", value: `${Math.round(player.eloScore)}`, inline: true },
        { name: "Elo Rank", value: `${player.eloRank}`, inline: true },
        {
          name: "Elo Position",
          value: `${eloRanking + 1}`,
          inline: true,
        }
      );

    const lastRaidedDate = new Date(player.lastEloUpdate);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const formattedDate = `${monthNames[lastRaidedDate.getMonth()]} ${lastRaidedDate.getDate()}, ${lastRaidedDate.getFullYear()}`;
    embed.addFields(
        {
            name: 'Last Raided',
            value: formattedDate,
            inline: true
        },
        {
            name: '\u200B',
            value: '\u200B',
            inline: true
        }
    );

    const playerData = player.toObject();

    // Calculate the total number of clears the player has across all raids
    let totalClears = 0;
    for (const raid in playerData.clears) {
      if (typeof playerData.clears[raid] === 'number') { // ensure the value is a number
        totalClears += playerData.clears[raid];
      } else {
        console.error(`Unexpected value for raid ${raid}:`, playerData.clears[raid]);
      }
    }

      embed.addFields(
          {
              name: 'Total Clears',
              value: `${totalClears}`,
              inline: true,
          }
      );

    // Check if totalClears is not a number or zero
    if (isNaN(totalClears) || totalClears === 0) {
      console.error('Total clears is NaN or zero:', totalClears);
      // handle this error as appropriate for your application
    } else {
const raidNames = ['helltan', 'hellkas', 'hellkul', 'hellshaza']; // Only other raids
const raidsWithoutDeathless = ['hellcali', 'thaemine']; // Raids without Deathless version

// Add Hellcali and Thaemine first without Deathless
for (const raid of raidsWithoutDeathless) {
  const raidClears = playerData.clears[raid];
  const raidRanking = await playerSchema.countDocuments({
    [`clears.${raid}`]: { $gt: playerData.clears[raid] },
  });

  // Add the regular raid clears to the embed
  embed.addFields(
    {
      name: `${raid.charAt(0).toUpperCase() + raid.slice(1)}`,
      value: `${raidClears} clears (Rank: ${raidRanking + 1})`,
      inline: true,
    },
    {
      name: '\u200B', // Add a spacer field to keep alignment
      value: '\u200B',
      inline: true,
    },
    {
      name: '\u200B', // Add another spacer field because there is no Deathless version
      value: '\u200B',
      inline: true,
    }
  );
}

// Now add the remaining raids with Deathless where applicable
for (const raid of raidNames) {
  const raidClears = playerData.clears[raid];
  const raidRanking = await playerSchema.countDocuments({
    [`clears.${raid}`]: { $gt: playerData.clears[raid] },
  });

  // Add the regular raid clears to the embed
  embed.addFields(
    {
      name: `${raid.charAt(0).toUpperCase() + raid.slice(1)}`,
      value: `${raidClears} clears (Rank: ${raidRanking + 1})`,
      inline: true,
    }
  );

  // Check for Deathless version and add if available
  if (playerData.clears.hasOwnProperty(`${raid}Deathless`)) {
    const deathlessClears = playerData.clears[`${raid}Deathless`];
    const deathlessRanking = await playerSchema.countDocuments({
      [`clears.${raid}Deathless`]: { $gt: playerData.clears[`${raid}Deathless`] },
    });

    embed.addFields(
      {
        name: '\u200B',
        value: '\u200B',
        inline: true,
      },
      {
        name: `${raid.charAt(0).toUpperCase() + raid.slice(1)} (DL)`,
        value: `${deathlessClears} clears (Rank: ${deathlessRanking + 1})`,
        inline: true,
      }
    );
  } else {
    // If there is no Deathless version, add spacer fields to keep alignment
    embed.addFields(
      {
        name: '\u200B',
        value: '\u200B',
        inline: true,
      },
      {
        name: '\u200B',
        value: '\u200B',
        inline: true,
      }
    );
  }
}

      // Separate array for raids to include in the pie chart
      const pieChartRaids = ['hellcali', 'thaemine', ...raidNames];

      const labels = [];
      const data = [];
      const backgroundColors = [
        'rgba(255, 105, 97, 1)',
        'rgba(255, 180, 128, 1)',
        'rgba(248, 243, 141, 1)',
        'rgba(66, 214, 164, 1)',
        'rgba(8, 202, 209, 1)',
        'rgba(89, 173, 246, 1)',
        'rgba(157, 148, 255, 1)',
        'rgba(199, 128, 232, 1)',
        'rgba(128, 0, 128, 1)',
        'rgba(255, 165, 0, 1)'
      ];

      for (const raid of pieChartRaids) {
        const count = playerData.clears[raid] || 0; // Fallback to 0 if undefined
        labels.push(raid.charAt(0).toUpperCase() + raid.slice(1)); // Capitalize the first letter for the label
        data.push(count);
      }

      // Now only raidNames are considered for the Deathless version
      for (const raid of raidNames) {
        // Check for Deathless version and add if available
        if (playerData.clears.hasOwnProperty(`${raid}Deathless`)) {
          const deathlessCount = playerData.clears[`${raid}Deathless`] || 0; // Fallback to 0 if undefined
          labels.push(`${raid.charAt(0).toUpperCase() + raid.slice(1)} (Deathless)`);
          data.push(deathlessCount);
        }
      }

      // Configuration for the pie chart
      const configuration = {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: backgroundColors,
          }]
        },
        options: {
          plugins: {
            legend: {
              labels: {
                color: '#FFFFFF',  // White color
              }
            }
          } // <- Missing closing curly brace for options
        } // <- Closing curly brace for configuration
      }; // <- Closing curly brace for configuration

      // Generate the pie chart
      const ChartClears = new ChartJSNodeCanvas({width: 800, height: 400});  // Adjust the size as needed
      const image = await ChartClears.renderToBuffer(configuration);

      // Create a Discord.js message attachment with the chart image
      const attachmentz = new AttachmentBuilder(image, { name: 'piechart.png' });

      // Add the pie chart to your existing embed
      embed.setImage('attachment://piechart.png');

      // Add the footer to your existing embed
      embed.setFooter({ text: "For any fixes to your clears, DM @Barut1" })
   

      await interaction.followUp({
        embeds: [embed],
        files: [attachmentz],
        ephemeral: true,
      });
    } // <-- This closes the else block
  } // <-- This closes the callback function
}; // <-- This closes the module.exports object