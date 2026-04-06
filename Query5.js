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

    const cursor = tweets.find(
      {},
      {
        projection: {
          _id: 0,
          id: 1,
          id_str: 1,
          text: 1,
          full_text: 1,
          created_at: 1,
          favorite_count: 1,
          retweet_count: 1,
          "user.screen_name": 1,
          "user.name": 1,
        },
      }
    );

    const clearedUsers = new Set();
    let sampleUser = null;

    for await (const tweet of cursor) {
      const screenName = tweet.user?.screen_name;
      if (!screenName) {
        continue;
      }

      const tweetId = tweet.id_str || String(tweet.id);
      if (!tweetId) {
        continue;
      }

      if (!clearedUsers.has(screenName)) {
        await redisClient.del(`tweets:${screenName}`);
        clearedUsers.add(screenName);
      }

      if (!sampleUser) {
        sampleUser = screenName;
      }

      await redisClient.rPush(`tweets:${screenName}`, tweetId);

      const tweetData = {
        id: tweetId,
        text: tweet.full_text || tweet.text || "",
        created_at: tweet.created_at || "",
        favorite_count: String(
          typeof tweet.favorite_count === "number" ? tweet.favorite_count : 0
        ),
        retweet_count: String(
          typeof tweet.retweet_count === "number" ? tweet.retweet_count : 0
        ),
        screen_name: screenName,
        user_name: tweet.user?.name || "",
      };

      await redisClient.hSet(`tweet:${tweetId}`, tweetData);
    }

    if (!sampleUser) {
      console.log("No sample user found.");
      return;
    }

    const sampleTweetIds = await redisClient.lRange(`tweets:${sampleUser}`, 0, 4);

    console.log(`Sample user: ${sampleUser}`);
    console.log(`First few tweet IDs for ${sampleUser}:`);
    console.log(sampleTweetIds);

    if (sampleTweetIds.length > 0) {
      const sampleTweet = await redisClient.hGetAll(`tweet:${sampleTweetIds[0]}`);
      console.log("Sample tweet hash:");
      console.log(sampleTweet);
    }
  } catch (error) {
    console.error("Error in Query5:", error);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}

main();