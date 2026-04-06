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

    await redisClient.set("tweetCount", 0);

    const cursor = tweets.find({}, { projection: { _id: 0, id: 1 } });

    for await (const tweet of cursor) {
      await redisClient.incr("tweetCount");
    }

    const total = await redisClient.get("tweetCount");
    console.log(`There were ${total} tweets`);
  } catch (error) {
    console.error("Error in Query1:", error);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}

main();