# IEEE VIS 2020 Tweets — MongoDB Queries

## Loading the Data

1. **Download** the tweet dump:
   [ieeevis2020Tweets.dump.bz2](https://johnguerra.co/viz/influentials/ieeevis2020/ieeevis2020Tweets.dump.bz2)

2. **Unzip** the file:
   ```bash
   bunzip2 ieeevis2020Tweets.dump.bz2
   ```

3. **Import** into MongoDB (make sure `mongod` is running):
   ```bash
   mongoimport -h localhost:27017 -d ieeevisTweets -c tweets --file ieeevis2020Tweets.dump
   ```

## Setup

```bash
npm install
```

## Running the Queries

```bash
node Query1.js   # Count of tweets that are not retweets or replies
node Query2.js   # Top 10 screen_names by follower count
node Query3.js   # Person with the most tweets
node Query4.js   # Top 10 by avg retweets (tweeted > 3 times)
node Query5.js   # Separate users into their own collection
```

## Query Descriptions

| File       | Description                                                        |
| ---------- | ------------------------------------------------------------------ |
| Query1.js  | Counts tweets where `retweeted_status` doesn't exist and `in_reply_to_status_id` is null |
| Query2.js  | Aggregates users by `screen_name`, sorts by max `followers_count`  |
| Query3.js  | Groups by `screen_name`, counts tweets, returns the top tweeter    |
| Query4.js  | Computes average `retweet_count` per user, filters to >3 tweets    |
| Query5.js  | Creates `users` (unique) and `tweets_only` (references user by id) collections |

## Technologies

- Node.js
- MongoDB (native driver)