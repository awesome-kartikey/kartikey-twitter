import { Tweet } from "@prisma/client"; // Keep this import if needed elsewhere
import { prismaClient } from "../../clients/db";
import { GraphqlContext } from "../../interfaces";
import UserService from "../../services/user";
import TweetService, { CreateTweetPayload } from "../../services/tweet";

// Define the CreateTweetData interface locally instead of importing
interface CreateTweetData {
  content: string;
  imageURL?: string | null;
}

const queries = {
  getAllTweets: () => TweetService.getAllTweets(),
  // Keep other queries if they exist
};

const mutations = {
  createTweet: async (
    parent: any,
    // Correct: Destructure the 'payload' argument which matches the mutation variable
    { payload }: { payload: CreateTweetData },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("You are not authenticated");
    console.log("!!! Backend Resolver: Received payload:", JSON.stringify(payload)); // <-- ADD RESOLVER LOG

    // Correct: Access content and imageURL *from* the payload object
    const tweet = await TweetService.createTweet({
      content: payload.content,  // Use payload.content
      imageURL: payload.imageURL || undefined, // Convert null to undefined to match the expected type
      userId: ctx.user.id,
    });

    return tweet;
  },
  // Keep other mutations if they exist
};

const extraResolvers = {
  Tweet: {
    author: (parent: Tweet) => UserService.getUserById(parent.authorId),
  },
  // Keep other extraResolvers if they exist
};

export const resolvers = { mutations, extraResolvers, queries };