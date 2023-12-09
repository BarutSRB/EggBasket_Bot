const eloRank = require("../models/eloRank");
const playerSchema = require("../models/playerSchema");

const RAID_ELO_MAP = {
  Hellcali: 1900,
  Helltan: 1500,
  Hellkas: 1750,
  Hellkul: 1850,
  Hellshaza: 1950,
  "Deathless Helltan": 1600,
  "Deathless Hellkas": 2050,
  "Deathless Hellkul": 2150,
  "Deathless Hellshaza": 2250,
  "Thaemine": 2400,
};

function getDynamicKFactor(eloScore) {
  if (eloScore < 1200) {
    return 40;
  } else if (eloScore < 1600) {
    return 32;
  } else if (eloScore < 1800) {
    return 28;
  } else if (eloScore < 2000) {
    return 24;
  } else if (eloScore < 2600) {
    return 20;
  } else {
    return 16;
  }
}

function convertRaidNameToClearKey(raidName) {
  const raidNameMapping = {
    Hellcali: "hellcali",
    Helltan: "helltan",
    Hellkas: "hellkas",
    Hellkul: "hellkul",
    Hellshaza: "hellshaza",
    "Deathless Helltan": "helltanDeathless",
    "Deathless Hellkas": "hellkasDeathless",
    "Deathless Hellkul": "hellkulDeathless",
    "Deathless Hellshaza": "hellshazaDeathless",
    "Thaemine": "thaemine",
  };

  return raidNameMapping[raidName];
}

async function updateElo(playerId, raidName, user) {
  try {
    let player = await playerSchema.findOne({ playerId });

    if (!player) {
      player = new playerSchema({
        playerId,
        mentionableName: `@${user.username}`,
      });
    }

    // Store the current ELO score as the original ELO score before updating it
    player.originalEloScore = player.eloScore;

    // console.log(player);

    const currentTime = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (currentTime - player.lastEloUpdate >= oneWeek) {
      console.log("in");
      const weeksPassed = Math.floor(
        (currentTime - player.lastEloUpdate) / oneWeek
      );
      player.eloScore = player.eloScore * Math.pow(0.95, weeksPassed);
    }

    const raidElo = RAID_ELO_MAP[raidName];
    // console.log(raidElo);
    const E = 1 / (1 + Math.pow(10, (raidElo - player.eloScore) / 400));
    console.log(E);
    const K = getDynamicKFactor(player.eloScore);
    // console.log(K);

    const result = player.eloScore + K * (1 - E);
    // console.log(result);

    player.eloScore = result;

    const roundedEloScore = Math.round(player.eloScore);

    player.eloRank = await getRankFromElo(roundedEloScore);

    // console.log(player.eloRank);
    // console.log(player.eloScore);

    player.lastEloUpdate = new Date();

    player.mentionableName = `@${user.username}`;

    const clearKey = convertRaidNameToClearKey(raidName);

    if (player.clears && typeof player.clears[clearKey] !== "undefined") {
      player.clears[clearKey]++;
    }

    await player.save();

    console.log(
      `${player.mentionableName || playerId} in raid ${raidName}. New Elo: ${player.eloScore}, New Rank: ${player.eloRank}`
    );

    const text = `Player ${user} ~ New Elo: \`${player.eloScore}\` | Elo Rank: \`${player.eloRank}\`\nClears: \`${player.clears[clearKey]}\`\n\n`;

    return text;
  } catch (error) {
    console.error(
      `Error updating ELO for player ${playerId} on raid ${raidName}:`,
      error.message
    );
  }
}

async function getRankFromElo(eloScore) {
  try {
    const rankObj = await eloRank.findOne({
      minElo: { $lte: eloScore },
      $or: [{ maxElo: { $gte: eloScore } }, { maxElo: null }],
    });

    return rankObj ? rankObj.tierDivision : "Unranked";
  } catch (error) {
    console.error(`Error retrieving rank for ELO ${eloScore}:`, error.message);
    return "Unranked";
  }
}

module.exports = { updateElo, convertRaidNameToClearKey, getRankFromElo };
