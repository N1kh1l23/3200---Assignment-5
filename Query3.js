const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient("mongodb://localhost:27017");
  try {
    await client.connect();
    const db = client.db("ieeevisTweets");
    const tweets = db.collection("tweets");

    // Group by screen_name, count tweets, sort descending, take top 1
    const results = await tweets
      .aggregate([
        {
          $group: {
            _id: "$user.screen_name",
            tweetCount: { $sum: 1 },
          },
        },
        { $sort: { tweetCount: -1 } },
        { $limit: 1 },
      ])
      .toArray();

    const top = results[0];
    console.log(
      `Person with the most tweets: ${top._id} with ${top.tweetCount} tweets`
    );
  } finally {
    await client.close();
  }
}

main().catch(console.error);