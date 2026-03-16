const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient("mongodb://localhost:27017");
  try {
    await client.connect();
    const db = client.db("ieeevisTweets");
    const tweets = db.collection("tweets");

    // ---- Step 1: Create the Users collection with unique users ----
    console.log("Step 1: Extracting unique users...");

    // Use $group on user.id to deduplicate, keep the first user doc found
    await tweets
      .aggregate([
        {
          $group: {
            _id: "$user.id",
            user: { $first: "$user" },
          },
        },
        {
          $replaceRoot: { newRoot: "$user" },
        },
        {
          $out: "users",
        },
      ])
      .toArray(); // .toArray() forces the aggregation to execute

    const usersCollection = db.collection("users");
    const userCount = await usersCollection.countDocuments();
    console.log(`  Created 'users' collection with ${userCount} unique users.`);

    // ---- Step 2: Create the Tweets_Only collection ----
    // This keeps all tweet fields EXCEPT the embedded user object,
    // and adds a user_id field that references the users collection.
    console.log("Step 2: Creating Tweets_Only collection...");

    await tweets
      .aggregate([
        {
          $addFields: {
            user_id: "$user.id",
          },
        },
        {
          $project: {
            user: 0, // remove the embedded user object
          },
        },
        {
          $out: "tweets_only",
        },
      ])
      .toArray();

    const tweetsOnly = db.collection("tweets_only");
    const tweetCount = await tweetsOnly.countDocuments();
    console.log(
      `  Created 'tweets_only' collection with ${tweetCount} tweets (user referenced by user_id).`
    );

    console.log("\nDone! Collections created:");
    console.log("  - users       (unique users)");
    console.log("  - tweets_only (tweets referencing users by user_id)");
  } finally {
    await client.close();
  }
}

main().catch(console.error);