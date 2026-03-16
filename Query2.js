const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient("mongodb://localhost:27017");
  try {
    await client.connect();
    const db = client.db("ieeevisTweets");
    const tweets = db.collection("tweets");

    // Group by screen_name, take the max followers_count per user,
    // then sort descending and limit to 10
    const results = await tweets
      .aggregate([
        {
          $group: {
            _id: "$user.screen_name",
            followers: { $max: "$user.followers_count" },
          },
        },
        { $sort: { followers: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, screen_name: "$_id", followers: 1 } },
      ])
      .toArray();

    console.log("Top 10 screen_names by followers:");
    results.forEach((r, i) =>
      console.log(`${i + 1}. ${r.screen_name} — ${r.followers} followers`)
    );
  } finally {
    await client.close();
  }
}

main().catch(console.error);