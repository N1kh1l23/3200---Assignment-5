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

    await redisClient.del("leaderboard");

    const cursor = tweets.find({}, { projection: { _id: 0, "user.screen_name": 1 } });

    for await (const tweet of cursor) {
      const screenName = tweet.user?.screen_name;
      if (screenName) {
        await redisClient.zIncrBy("leaderboard", 1, screenName);
      }
    }

    const topUsers = await redisClient.zRangeWithScores("leaderboard", 0, 9, {
      REV: true,
    });

    console.log("Top 10 users with the most tweets:");
    topUsers.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.value} - ${entry.score} tweets`);
    });
  } catch (error) {
    console.error("Error in Query4:", error);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}

main();