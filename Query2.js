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

    await redisClient.set("favoritesSum", 0);

    const cursor = tweets.find({}, { projection: { _id: 0, favorite_count: 1 } });

    for await (const tweet of cursor) {
      const favoriteCount =
        typeof tweet.favorite_count === "number" ? tweet.favorite_count : 0;

      await redisClient.incrBy("favoritesSum", favoriteCount);
    }

    const totalFavorites = await redisClient.get("favoritesSum");
    console.log(`Total favorites in dataset: ${totalFavorites}`);
  } catch (error) {
    console.error("Error in Query2:", error);
  } finally {
    await redisClient.quit();
    await mongoClient.close();
  }
}

main();