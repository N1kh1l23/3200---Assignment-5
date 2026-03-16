const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient("mongodb://localhost:27017");
  try {
    await client.connect();
    const db = client.db("ieeevisTweets");
    const tweets = db.collection("tweets");

    // Group by screen_name, compute avg retweet_count and total tweets,
    // filter to those with more than 3 tweets, sort by avgRetweets desc
    const results = await tweets
      .aggregate([
        {
          $group: {
            _id: "$user.screen_name",
            avgRetweets: { $avg: "$retweet_count" },
            tweetCount: { $sum: 1 },
          },
        },
        { $match: { tweetCount: { $gt: 3 } } },
        { $sort: { avgRetweets: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 0,
            screen_name: "$_id",
            avgRetweets: { $round: ["$avgRetweets", 2] },
            tweetCount: 1,
          },
        },
      ])
      .toArray();

    console.log("Top 10 by average retweets (tweeted more than 3 times):");
    results.forEach((r, i) =>
      console.log(
        `${i + 1}. ${r.screen_name} — avg ${r.avgRetweets} retweets (${r.tweetCount} tweets)`
      )
    );
  } finally {
    await client.close();
  }
}

main().catch(console.error);