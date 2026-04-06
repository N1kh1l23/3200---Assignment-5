const { MongoClient } = require("mongodb");
const { createClient } = require("redis");

async function main() {
  const mongoClient = new MongoClient("mongodb://localhost:27017");
  const redisClient = createClient({ url: "redis://localhost:6379" });

  try {
    await mongoClient.connect();
    await redisClient.connect();

    const db = mongoClient.db("ieeevisTweets");
    const tweets = db.collection("tweets");

    await redisClient.del("screen_names");

    const cursor = tweets.find({}, { projection: { _id: 0, "user.screen_name": 1 } });

    for await (const tweet of cursor) {
      const screenName = tweet.user?.screen_name;
      if (screenName) {
        await redisClient.sAdd("screen_names", screenName);
      }
    }

    const distinctUsers = await redisClient.sCard("screen_names");
    console.log(`Distinct users in dataset: ${distinctUsers}`);
  } catch (error) {
    console.error("Error in Query3:", error);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}

main();