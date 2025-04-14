import axios from "axios";
import { prismaClient } from "../../clients/db";
import JWTService from "../../services/jwt";
import { GraphqlContext } from "../../interfaces"; // Corrected path
import { User, Follows } from "@prisma/client";   // Import User and Follows
import UserService from "../../services/user";
import { redisClient } from "../../clients/redis";

// Define types for the included relations to make it cleaner
// Ensure these types accurately reflect your Prisma includes
type FollowsWithFollower = Follows & { follower: User };
type FollowsWithFollowing = Follows & { following: User };
type FollowsWithNestedFollowingData = Follows & {
    following: User & {
      followers: (Follows & {
        following: User;
      })[];
    };
};

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const resultToken = await UserService.verifyGoogleAuthToken(token);
    return resultToken;
  },
  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    const id = ctx.user?.id;
    if (!id) return null;

    const user = await UserService.getUserById(id);
    return user;
  },
  getUserById: async (
    parent: any,
    { id }: { id: string },
    ctx: GraphqlContext
  ) => UserService.getUserById(id),
};

const extraResolvers = {
  User: {
    tweets: (parent: User) =>
      prismaClient.tweet.findMany({ where: { author: { id: parent.id } } }),

    followers: async (parent: User): Promise<User[]> => { // Added return type promise
      const result = await prismaClient.follows.findMany({
        where: { following: { id: parent.id } },
        include: {
          follower: true,
        },
      });
      // Add explicit type annotation for 'el'
      return result.map((el: FollowsWithFollower) => el.follower);
    },

    following: async (parent: User): Promise<User[]> => { // Added return type promise
      const result = await prismaClient.follows.findMany({
        where: { follower: { id: parent.id } },
        include: {
          following: true,
        },
      });
      // Add explicit type annotation for 'el'
      return result.map((el: FollowsWithFollowing) => el.following);
    },

    recommendedUsers: async (parent: User, _: any, ctx: GraphqlContext): Promise<User[]> => { // Added return type promise
      if (!ctx.user) return [];

      const cachedValue = await redisClient.get(
        `RECOMMENDED_USERS:${ctx.user.id}`
      );

      if (cachedValue) {
        console.log("Cache Found");
        try {
          // Safely parse JSON
          const parsedUsers = JSON.parse(cachedValue);
          return Array.isArray(parsedUsers) ? parsedUsers : [];
        } catch (error) {
          console.error("Failed to parse recommended users cache:", error);
          // Invalidate cache if parsing fails
          await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
          return [];
        }
      }

      console.log("Cache Not Found");

      const myFollowings = await prismaClient.follows.findMany({
        where: {
          follower: { id: ctx.user.id },
        },
        include: {
          // Ensure nested includes match the type `FollowsWithNestedFollowingData`
          following: {
            include: {
              followers: { include: { following: true } },
            },
          },
        },
      });

      const users: User[] = [];
      const recommendedUserIds = new Set<string>(); // Use Set to avoid duplicates

      for (const followings of myFollowings) {
         // Type assertion or check if 'following' and 'followers' exist
        if (followings.following?.followers) {
            // Add type annotation for the inner loop element
            for (const followingOfFollowedUser of followings.following.followers) {
                const potentialUser = followingOfFollowedUser.following;
                if (
                    potentialUser.id !== ctx.user.id &&
                    // Check if we are already following this potential user
                    !myFollowings.some( // Use .some for efficiency
                        (e: FollowsWithNestedFollowingData) => e.following?.id === potentialUser.id
                    ) &&
                    // Check if we already added this user to recommendations
                    !recommendedUserIds.has(potentialUser.id)
                ) {
                    users.push(potentialUser);
                    recommendedUserIds.add(potentialUser.id); // Track added user ID
                }
            }
        }
      }

      // Cache the result only if users array is not empty, prevent caching empty arrays indefinitely
      if (users.length > 0) {
          await redisClient.set(
            `RECOMMENDED_USERS:${ctx.user.id}`,
            JSON.stringify(users),
            "EX", // Add expiration (e.g., 1 hour)
            3600
          );
      }


      return users;
    },
  },
};

const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ): Promise<boolean> => { // Added return type promise
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");

    // Prevent following self
    if (ctx.user.id === to) {
        throw new Error("You cannot follow yourself.");
    }

    await UserService.followUser(ctx.user.id, to);
    // Invalidate caches after mutation
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    await redisClient.del(`user:${ctx.user.id}`); // Example: invalidate current user cache if any
    await redisClient.del(`user:${to}`);         // Example: invalidate followed user cache if any
    return true;
  },
  unfollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ): Promise<boolean> => { // Added return type promise
    if (!ctx.user || !ctx.user.id) throw new Error("unauthenticated");
    await UserService.unfollowUser(ctx.user.id, to);
    // Invalidate caches after mutation
    await redisClient.del(`RECOMMENDED_USERS:${ctx.user.id}`);
    await redisClient.del(`user:${ctx.user.id}`); // Example: invalidate current user cache if any
    await redisClient.del(`user:${to}`);         // Example: invalidate unfollowed user cache if any
    return true;
  },
};

export const resolvers = { queries, extraResolvers, mutations };