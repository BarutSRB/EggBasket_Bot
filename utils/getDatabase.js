const { guildId, raidsArray, mongoURI } = require("../config.json");
const globalSchema = require("../models/globalSchema");
const { MongoClient } = require("mongodb");

const getInventoryDoc = async function () {
  let doc = await globalSchema.findOne({ guildId });

  if (!doc)
    doc = await globalSchema.create({
      guildId,
      raidsArray,
    });

  return doc;
};

const fetchCollectionInArr = async function (collectionName) {
  const dbName = "eggbasket";
  const client = new MongoClient(mongoURI);
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    const documents = await collection.find({}).toArray();

    return documents;
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getInventoryDoc,
  fetchCollectionInArr,
};
