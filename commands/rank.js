const { MongoClient, ObjectId } = require('mongodb');
const { createCanvas, loadImage } = require('canvas');
const { CommandType } = require("wokcommands");
const Discord = require('discord.js');
const config = require('../config.json');

const ranks = [
    ["Iron V", 1000], ["Iron IV", 1100], ["Iron III", 1150], ["Iron II", 1200], ["Iron I", 1250],
    ["Bronze V", 1300], ["Bronze IV", 1350], ["Bronze III", 1400], ["Bronze II", 1450], ["Bronze I", 1500],
    ["Silver V", 1550], ["Silver IV", 1600], ["Silver III", 1650], ["Silver II", 1700], ["Silver I", 1750],
    ["Gold V", 1800], ["Gold IV", 1850], ["Gold III", 1900], ["Gold II", 1950], ["Gold I", 2000],
    ["Platinum V", 2050], ["Platinum IV", 2100], ["Platinum III", 2150], ["Platinum II", 2200], ["Platinum I", 2250],
    ["Diamond V", 2300], ["Diamond IV", 2350], ["Diamond III", 2400], ["Diamond II", 2450], ["Diamond I", 2500],
    ["Master", 2550], ["Grandmaster", 2600], ["Challenger", 2700]
];

module.exports = {
    category: 'Ranking',
    description: 'Displays your rank card',
    type: CommandType.SLASH,
    minArgs: 0,
    maxArgs: 0,
    expectedArgs: '',
        callback: async ({ interaction, user }) => {
        const targetUser = user || interaction.user;
        const userIdStr = String(targetUser.id); // Ensure it's a string
        const [points, rank, raidCounts] = await getUserPointsAndRank(userIdStr);

        // Give error if no data found
        if (points === 0 && rank === 'Unranked') {
            // Send an error message to the user
            if(interaction) {
                await interaction.reply({ content: "Regular members use `/view` or `/top` commands.\n\nIf you have the Helper or Trial Helper role, have at least one lobby approved by staff to see your rank card. Check `/helperboard` and `/helperstats` commands.", ephemeral: true });
            } else {
                return { content: "Regular members use `/view` or `/top` commands.\n\nIf you have the Helper or Trial Helper role, have at least one lobby approved by staff to see your rank card. Check `/helperboard` and `/helperstats` commands.", ephemeral: true };
            }
            return;
        }       
        
        const canvas = createCanvas(400, 200);
        const ctx = canvas.getContext('2d');
        
        try {
            const background = await loadImage('./rank_card.png');
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        } catch (error) {
            console.error('Error loading background: ', error);
            // Fallback to a blue background if the image can't be loaded
            ctx.fillStyle = '#0099ff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw texts
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Rank: ${rank}`, 150, 50);
        ctx.fillText(`Points: ${points}`, 150, 80);

        // Initialize the rank thresholds
        const rankThresholds = [
            ["Iron", 1000],
            ["Bronze", 1300],
            ["Silver", 1550],
            ["Gold", 1800],
            ["Platinum", 2050],
            ["Diamond", 2300],
            ["Master", 2550],
            ["Grandmaster", 2600],
            ["Challenger", 2700]
        ];

        // Initialize values
        let nextRankPoints = 0;
        let prevRankPoints = 0;
        let rankIndex = 0;

        // Find the user's current rank and points
        for (let i = 0; i < rankThresholds.length; i++) {
            if (points >= rankThresholds[i][1]) {
                rankIndex = i;
            } else {
                break;
            }
        }

        // Determine the points for the next rank, if there is one
        if (rankIndex < rankThresholds.length - 1) {
            nextRankPoints = rankThresholds[rankIndex + 1][1];
        } else {
            nextRankPoints = points; // User is at the highest rank
        }

        // Determine the points for the previous rank, if there is one
        prevRankPoints = rankThresholds[rankIndex][1];

        // Calculate the percentage progress toward the next rank
        let progressPercentage = 0;
        if (nextRankPoints !== prevRankPoints) {
            progressPercentage = ((points - prevRankPoints) / (nextRankPoints - prevRankPoints)) * 100;
        }

        // Ensure that the progress percentage is between 0 and 100
        progressPercentage = Math.max(0, Math.min(progressPercentage, 100));

        // Draw the progress bar background (empty part)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';  // light gray
        roundedRect(ctx, 150, 95, 200, 20, 10);  // x, y, width, height

        // Rounded rectangle for background progress bar
        let progressBarX = 150;
        let progressBarY = 95;
        let progressBarWidth = 200;
        let progressBarHeight = 20;
        let radius = 10; // Radius for rounded corners
        
        ctx.beginPath();
        ctx.moveTo(progressBarX + radius, progressBarY);
        ctx.lineTo(progressBarX + progressBarWidth - radius, progressBarY);
        ctx.quadraticCurveTo(progressBarX + progressBarWidth, progressBarY, progressBarX + progressBarWidth, progressBarY + radius);
        ctx.lineTo(progressBarX + progressBarWidth, progressBarY + progressBarHeight - radius);
        ctx.quadraticCurveTo(progressBarX + progressBarWidth, progressBarY + progressBarHeight, progressBarX + progressBarWidth - radius, progressBarY + progressBarHeight);
        ctx.lineTo(progressBarX + radius, progressBarY + progressBarHeight);
        ctx.quadraticCurveTo(progressBarX, progressBarY + progressBarHeight, progressBarX, progressBarY + progressBarHeight - radius);
        ctx.lineTo(progressBarX, progressBarY + radius);
        ctx.quadraticCurveTo(progressBarX, progressBarY, progressBarX + radius, progressBarY);
        ctx.closePath();
        ctx.fill();

        // Define a function for drawing rounded rectangles
        function roundedRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        }

        // Draw the progress (filled part)
        ctx.fillStyle = '#ffffff';  // white
        let fillWidth = 200 * (progressPercentage / 100);  // Calculate filled width based on percentage
        roundedRect(ctx, 150, 95, fillWidth, 20, 10); // x, y, width, height, corner radius

        // Optional: Display percentage text on the progress bar
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#000000';  // black
        ctx.fillText(`${progressPercentage.toFixed(2)}%`, 250, 110);  // x, y        
        
        // Load and draw avatar
        ctx.save();  // Save the current state
        try {
            const avatarUrl = targetUser.displayAvatarURL({ extension: 'png' });
            const avatar = await loadImage(avatarUrl);

            ctx.beginPath();
            ctx.arc(70, 70, 50, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(avatar, 20, 20, 100, 100); 
        } catch (error) {
            console.error('Error loading avatar: ', error);
        }
        ctx.restore();  // Restore the state

        let roleIds = [];

        try {
            const member = interaction.guild.members.cache.get(targetUser.id);
            roleIds = member.roles.cache.map(role => role.id);
        } catch (error) {
            console.error('Error getting role IDs: ', error);
        }

        const icons = {
            '1097496029206683678': './roles/helltan.png',
            '1097495787535085628': './roles/helltan_dl.png',
            '1097495679208788068': './roles/hellkas.png',
            '1097495613857341470': './roles/hellkas_dl.png',
            '1109919809786871839': './roles/hellkul.png',
            '1109919864946176041': './roles/hellkul_dl.png',
            '1123403755497455738': './roles/hellshaza.png',
        };

        const raidNamesForRoles = {
            '1097496029206683678': 'helltan',
            '1097495787535085628': 'helltanDeathless',
            '1097495679208788068': 'hellkas',
            '1097495613857341470': 'hellkasDeathless',
            '1109919809786871839': 'hellkul',
            '1109919864946176041': 'hellkulDeathless',
            '1166348722679062640': 'hellcali',
            '1123405291019579414': 'hellshazaDeathless', // Assuming this is the correct ID for 'hellshazaDeathless'
            '1123403755497455738': 'hellshaza', // Add the correct role ID for 'hellshaza'
            // Add other role IDs and their corresponding keys from the 'clears' object if needed
        };

        let iconSize = 30;
        let padding = 25;  // Desired padding on both left and right sides

        // Compute the total width of all icons without spacing
        let totalIconsWidth = Object.keys(icons).length * iconSize;

        // Compute the total width of the canvas available for spacing by subtracting the width of all icons and paddings from canvas width
        let totalSpacingWidth = canvas.width - totalIconsWidth - 2 * padding;  // subtract the left and right paddings

        // Compute the space between each icon by dividing the total available spacing by (number of icons - 1)
        let spaceBetweenIcons = totalSpacingWidth / (Object.keys(icons).length - 1);

        // The starting x-position for the first icon will be the left padding
        let startIconsX = padding; 


        let currentIconX = startIconsX;

        // Draw a semi-transparent rounded rectangle behind the icons
        const rectHeight = iconSize + 10;  // 5 padding top and bottom
        const rectY = 140 - 5;  // 5 padding from the top
        const rectStartX = 25;  // Starting X position of the rectangle
        const rectEndX = canvas.width - 25;  // Ending X position of the rectangle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Black with 50% transparency

        ctx.beginPath();
        ctx.moveTo(rectStartX, rectY); 
        ctx.lineTo(rectEndX, rectY);
        ctx.quadraticCurveTo(rectEndX + 10, rectY, rectEndX + 10, rectY + 10);
        ctx.lineTo(rectEndX + 10, rectY + rectHeight - 10);
        ctx.quadraticCurveTo(rectEndX + 10, rectY + rectHeight, rectEndX, rectY + rectHeight);
        ctx.lineTo(rectStartX, rectY + rectHeight);
        ctx.quadraticCurveTo(rectStartX - 10, rectY + rectHeight, rectStartX - 10, rectY + rectHeight - 10);
        ctx.lineTo(rectStartX - 10, rectY + 10);
        ctx.quadraticCurveTo(rectStartX - 10, rectY, rectStartX, rectY);
        ctx.closePath();
        ctx.fill();


        async function drawGreyscaleImage(ctx, imagePath, x, y, width, height) {
            try {
                const img = await loadImage(imagePath);
                
                // Create a temporary canvas to draw and modify the image
                const tempCanvas = createCanvas(width, height);
                const tempCtx = tempCanvas.getContext('2d');
                
                // Draw the image to the temporary canvas
                tempCtx.drawImage(img, 0, 0, width, height);
                
                // Get the image data
                const imgData = tempCtx.getImageData(0, 0, width, height);
                
                // Loop through all pixels and desaturate them
                for(let i = 0; i < imgData.data.length; i += 4) {
                    const avg = (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
                    imgData.data[i]     = avg; // red
                    imgData.data[i + 1] = avg; // green
                    imgData.data[i + 2] = avg; // blue
                }

                // Put the new image data back to the temporary canvas
                tempCtx.putImageData(imgData, 0, 0);
                
                // Draw the modified image from the temporary canvas onto the original canvas
                ctx.drawImage(tempCanvas, x, y, width, height);
            } catch (error) {
                console.error('Error loading or manipulating image: ', error);
            }
        }        

        for (const [roleId, iconPath] of Object.entries(icons)) {
            try {
                if (roleIds.includes(roleId)) {
                    const icon = await loadImage(iconPath);
                    ctx.drawImage(icon, currentIconX, 140, iconSize, iconSize);
                } else {
                    await drawGreyscaleImage(ctx, iconPath, currentIconX, 140, iconSize, iconSize);
                }

                // Draw lobby count text below the icon
                const raidName = raidNamesForRoles[roleId];
                const lobbyCount = raidCounts[raidName] || 0;  // Use 0 if no count found
                ctx.font = '14px sans-serif';

                // Check if lobbyCount is 0 and adjust color accordingly
                ctx.fillStyle = (lobbyCount === 0) ? '#aaaaaa' : '#ffffff';  // Use grey for 0, white otherwise
                
                ctx.fillText(String(lobbyCount), currentIconX + iconSize / 2 - 3, 140 + iconSize + 20);  // Adjust position as needed
            } catch (error) {
                console.error(`Error drawing icon for role ${roleId}:`, error);
            }
            currentIconX += iconSize + spaceBetweenIcons;
        }        

        const rankIcons = {
            '1096315012341039184': { path: './roles/admin.png', priority: 1 },
            '1168362749772963921': { path: './roles/staff.png', priority: 2 },
        };

        let highestPriorityIcon = null;

        for (const [roleId, iconData] of Object.entries(rankIcons)) {
            if (roleIds.includes(roleId)) {
                if (!highestPriorityIcon || iconData.priority < highestPriorityIcon.priority) {
                    highestPriorityIcon = iconData;
                }
            }
        }

        // If a highest-priority role was found, draw the corresponding icon
        if (highestPriorityIcon) {
            let rankIconSize = 30; 
            let rankIconX = 90;  // Top right X position, adjust as needed
            let rankIconY = 10;   // Top right Y position, adjust as needed

            try {
                const icon = await loadImage(highestPriorityIcon.path);
                ctx.drawImage(icon, rankIconX, rankIconY, rankIconSize, rankIconSize);
            } catch (error) {
                console.error('Error loading role icon: ', error);
            }
        }

        // Draw the user name text inside the rounded rectangle
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#ffffff';

        const userName = targetUser.username;  // Get the user's name
        const textWidth = ctx.measureText(userName).width;

        // Draw semi-transparent rounded rectangle
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Black with 50% transparency
        const rectWidth = 100; // Same width as avatar
        const rectrHeight = 25; // Height of rectangle
        const rectX = 20; // Same X position as avatar
        const recttY = 95; // Positioned at the bottom of the avatar

        ctx.beginPath();
        ctx.moveTo(rectX + 10, recttY); // 10 is for rounded corners
        ctx.lineTo(rectX + rectWidth - 10, recttY);
        ctx.quadraticCurveTo(rectX + rectWidth, recttY, rectX + rectWidth, recttY + 10);
        ctx.lineTo(rectX + rectWidth, recttY + rectrHeight - 10);
        ctx.quadraticCurveTo(rectX + rectWidth, recttY + rectrHeight, rectX + rectWidth - 10, recttY + rectrHeight);
        ctx.lineTo(rectX + 10, recttY + rectrHeight);
        ctx.quadraticCurveTo(rectX, recttY + rectrHeight, rectX, recttY + rectrHeight - 10);
        ctx.lineTo(rectX, recttY + 10);
        ctx.quadraticCurveTo(rectX, recttY, rectX + 10, recttY);
        ctx.closePath();
        ctx.fill();


        // Draw the text inside the rounded rectangle
        ctx.fillStyle = '#ffffff'; // Set the font color to white
        const xPosition = rectX + (rectWidth - textWidth) / 2; // Centered X position for the text
        const yPosition = recttY + (rectrHeight - 16) / 2 + 16; // Centered Y position for the text
        ctx.fillText(userName, xPosition, yPosition);

        // Load and draw the logo with a light outglow
        try {
            const logo = await loadImage('./roles/logo.png');  // Adjust the path accordingly
            const logoWidth = 50;  // Width of the logo
            const logoHeight = 50; // Height of the logo
            const logoX = canvas.width - logoWidth - 10; // X position (top-right, with 10px padding)
            const logoY = 10; // Y position (top-right, with 10px padding)

            // Shadow properties for the outglow effect
            ctx.shadowColor = '#ffffff'; // White glow
            ctx.shadowBlur = 10; // Blur level for the glow
            ctx.shadowOffsetX = 0; // Horizontal shadow offset
            ctx.shadowOffsetY = 0; // Vertical shadow offset

            ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight); // Draw the logo
        } catch (error) {
            console.error('Error loading logo: ', error);
        }

        // Reset shadow properties so that it doesn't affect subsequent drawing
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;        

        const attachment = new Discord.AttachmentBuilder(canvas.toBuffer(), './rank_card.png');
        
        if(interaction) {
            await interaction.reply({ files: [attachment] });
        } else {
            return { files: [attachment] };
        }
    }
}


async function getUserPointsAndRank(playerId) {
  const mongoClient = await MongoClient.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    const database = mongoClient.db('eggbasket');

    const player = await database.collection('players').findOne({ playerId: playerId });
    if (!player) {
      console.error(`Player with ID ${playerId} not found.`);
      return [0, 'Unranked', {}, 0]; // Add a fourth return value for progress
    }

    let points = Math.round(player.eloScore) || 0;
    let rank = player.eloRank || 'Unranked';
    const raidCounts = player.clears || {};

    // Find the index of the current rank in the ranks array
    let currentRankIndex = ranks.findIndex(rankTuple => rankTuple[0] === rank);
    // If the rank is not found, consider the player to be at the start
    if (currentRankIndex === -1) {
      currentRankIndex = 0;
    }

    // Initialize the progress percentage to zero
    let progressPercentage = 0;
    
    // Find the next rank and its points
    let nextRankPoints = (currentRankIndex < ranks.length - 1) ? ranks[currentRankIndex + 1][1] : points;
    let currentRankPoints = ranks[currentRankIndex][1];

    // Calculate the progress percentage
    if (nextRankPoints !== currentRankPoints) {
      progressPercentage = ((points - currentRankPoints) / (nextRankPoints - currentRankPoints)) * 100;
    }

    // Ensure the progress percentage is between 0 and 100
    progressPercentage = Math.max(0, Math.min(progressPercentage, 100));

    // Logging the calculated information
    console.log(`ELO Points: ${points}`);
    console.log(`ELO Rank: ${rank}`);
    console.log('Raid Clears: ', raidCounts);
    console.log(`Progress Percentage: ${progressPercentage.toFixed(2)}%`);

    return [points, rank, raidCounts, progressPercentage];
  } finally {
    // Ensure to close the MongoDB connection
    await mongoClient.close();
  }
}