import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { initServer } from "./app"; // Your GraphQL server setup from ./app/index.ts
import * as dotenv from "dotenv";
dotenv.config();

// Import Uploadthing handler
import { createRouteHandler } from "uploadthing/express";
import { ourFileRouter } from "./app/api/uploadthing/core"; // Ensure this path is correct

async function init() {
  // 1. Initialize your Express app & GraphQL server
  //    initServer should configure the GraphQL endpoint on the returned app
  const app = await initServer();

  // 2. Apply Global Middleware (if not already done adequately in initServer)
  //    - bodyParser and cors are often essential and might already be in initServer.
  //    - If they are already applied in initServer for the '/graphql' route,
  //      you might still want to apply them globally here *before* other routes
  //      if those routes also need them. Re-applying is usually harmless.
  app.use(bodyParser.json());
  app.use(cors({
      // It's recommended to configure CORS more strictly for production:
      // origin: 'YOUR_FRONTEND_URL', // e.g., 'http://localhost:3000'
      // methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      // allowedHeaders: ['Content-Type', 'Authorization'],
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  }));

  // 3. Define other non-GraphQL API routes BEFORE the GraphQL endpoint if paths could conflict,
  //    or anywhere if paths are distinct.
  app.get("/", (req, res) =>
    res.status(200).json({ message: "Everything is good" })
  );

  // 4. Setup Uploadthing route handler
  //    This defines the '/api/uploadthing' endpoint.
  app.use(
    "/api/uploadthing",
    createRouteHandler({
      router: ourFileRouter,
      // config: { ... } // Optional: Add Uploadthing config if needed
    })
  );

  // 5. The GraphQL endpoint ('/graphql') should already be configured
  //    on the 'app' instance returned by initServer().

  // 6. Start the server
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));
}

// --- Start the initialization process ---
init();