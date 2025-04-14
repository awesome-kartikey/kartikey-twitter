import { prismaClient } from "../clients/db";
import { redisClient } from "../clients/redis";

export interface CreateTweetPayload {
  content: string;
  imageURL?: string;
  userId: string;
}

class TweetService {
  public static async createTweet(data: CreateTweetPayload) {
    // Log #1: What the service function received
    console.log("TweetService.createTweet received data:", JSON.stringify(data, null, 2));

    const rateLimitFlag = await redisClient.get(
      `RATE_LIMIT:TWEET:${data.userId}`
    );
    if (rateLimitFlag) throw new Error("Please wait....");

    // Ensure content is valid before proceeding
    if (typeof data.content !== 'string' || data.content.trim() === '') {
         console.error("Tweet content is invalid or empty:", data.content);
         throw new Error("Tweet content cannot be empty.");
    }

    // Prepare the data specifically for Prisma create
    const prismaData = {
      content: data.content, // Use validated content if needed
      // Explicitly set to null if imageURL is empty string, undefined, or null
      imageURL: (data.imageURL && data.imageURL.trim() !== '') ? data.imageURL.trim() : null,
      author: { connect: { id: data.userId } },
    };

    // Log #2: What is actually being passed to Prisma create
    console.log("***********************************************************************************");
    console.log("Data being passed to prismaClient.tweet.create:", JSON.stringify(prismaData, null, 2));
    console.log("***********************************************************************************");


    try {
        // Now call Prisma create with the prepared data
        const tweet = await prismaClient.tweet.create({
            data: prismaData,
        });

        // Log #3 (Optional): Log the result returned by Prisma
        // console.log("Tweet created successfully in DB:", JSON.stringify(tweet, null, 2));

        // Update Redis cache
        await redisClient.setex(`RATE_LIMIT:TWEET:${data.userId}`, 10, 1);
        await redisClient.del("ALL_TWEETS"); // Invalidate the general tweet cache

        return tweet; // Return the created tweet

    } catch (error) {
        console.error("Prisma create error in TweetService:", error); // Log the specific Prisma error
        // It's often useful to re-throw the error so the GraphQL layer can handle it
        throw new Error(`Failed to create tweet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public static async getAllTweets() {
    const cachedTweets = await redisClient.get("ALL_TWEETS");
    if (cachedTweets) {
        try {
            // It's good practice to handle potential JSON parsing errors
            return JSON.parse(cachedTweets);
        } catch (error) {
            console.error("Failed to parse tweets from cache:", error);
            // If parsing fails, delete the bad cache entry and fetch fresh data
            await redisClient.del("ALL_TWEETS");
        }
    }

    const tweets = await prismaClient.tweet.findMany({
      orderBy: { createdAt: "desc" },
      // Consider adding includes if needed by the frontend directly here
      // include: { author: true }
    });

    // Cache the fetched data only if there are tweets
    if (tweets && tweets.length > 0) {
        // Add cache expiration (e.g., 5 minutes)
        await redisClient.set("ALL_TWEETS", JSON.stringify(tweets), "EX", 300);
    }
    return tweets;
  }
}

export default TweetService;