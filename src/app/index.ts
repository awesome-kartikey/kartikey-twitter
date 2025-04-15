// twitter-clone-server/src/app/index.ts

import express from "express";
// import bodyParser from "body-parser"; // Remove if applied globally in src/index.ts
// import cors from "cors"; // Remove if applied globally in src/index.ts
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { prismaClient } from "../clients/db"; // Verify path

import { User } from "./user"; // Verify path
import { Tweet } from "./tweet"; // Verify path
import { GraphqlContext } from "../interfaces"; // Verify path
import JWTService from "../services/jwt"; // Verify path

// Change function signature: Remove the 'app' parameter
export async function initServer() {
  // Create the app instance HERE
  const app = express();

  // Apply middleware needed ONLY for GraphQL here (if any)
  // bodyParser is often needed and might be applied globally OR just here
  // Example: app.use(bodyParser.json()); // Apply here if not global

  // Remove global routes like app.get('/') if they are handled in src/index.ts


  const graphqlServer = new ApolloServer<GraphqlContext>({
    typeDefs: `
       ${User.types}
       ${Tweet.types}

        type Query {
            ${User.queries}
            ${Tweet.queries}
        }

        type Mutation {
          ${Tweet.muatations}
          ${User.mutations}
        }
    `,
    resolvers: {
      Query: {
        ...User.resolvers.queries,
        ...Tweet.resolvers.queries,
      },
      Mutation: {
        ...Tweet.resolvers.mutations,
        ...User.resolvers.mutations,
      },
      ...Tweet.resolvers.extraResolvers,
      ...User.resolvers.extraResolvers,
    },
     // Consider disabling introspection & landing page plugin in production
     // introspection: process.env.NODE_ENV !== 'production',
  });

  await graphqlServer.start();

  // Attach GraphQL middleware to the app instance created within this function
  app.use(
    "/graphql",
    // If not using global cors in src/index.ts, you might add cors options here
    // cors(corsOptions), // Example if cors is needed specifically here
    expressMiddleware(graphqlServer, {
      context: async ({ req, res }) => {
        // Ensure Authorization header might be undefined
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : undefined;
        return {
          user: token ? JWTService.decodeToken(token) : undefined,
        };
      },
    })
  );

  // Return the configured app instance
  return app;
}