// twitter-clone-server/src/index.ts

import express from "express";
import bodyParser from "body-parser";
import cors from "cors"; // Make sure cors is imported
import { initServer } from "./app"; // Your GraphQL server setup from ./app/index.ts
import * as dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env file

// Import Uploadthing handler
import { createRouteHandler } from "uploadthing/express";
import { ourFileRouter } from "./app/api/uploadthing/core"; // Ensure this path is correct

async function init() {
  // 1. Initialize Express app & configure GraphQL endpoint within initServer
  const app = await initServer();

  // --- Middleware Configuration ---

  // 2. Configure CORS Globally (IMPORTANT: Place before routes that need CORS)
  const allowedOrigins = [
    process.env.FRONTEND_URL, // Your primary deployed frontend URL from env
    "https://pulse-stream.onrender.com", // Local development frontend
    // Add any other origins you need to allow (e.g., staging URLs)
  ].filter(Boolean) as string[]; // .filter(Boolean) removes any undefined/null values if FRONTEND_URL isn't set

  if (!process.env.FRONTEND_URL) {
    console.warn(
      "------------------------------------------------------------------------------------"
    );
    console.warn(
      "WARN: FRONTEND_URL environment variable is not set on the backend server."
    );
    console.warn(
      "CORS might block requests from your deployed frontend ('https://pulse-stream.onrender.com' etc)."
    );
    console.warn(
      `Currently allowing origins: ${JSON.stringify(allowedOrigins)}`
    );
    console.warn(
      "Set FRONTEND_URL in your backend's Render Environment Variables."
    );
    console.warn(
      "------------------------------------------------------------------------------------"
    );
    // Consider adding the expected Render URL as a fallback if needed, but env var is better:
    // if (!allowedOrigins.includes('https://pulse-stream.onrender.com')) {
    //     allowedOrigins.push('https://pulse-stream.onrender.com');
    // }
  } else {
    console.log(`CORS Allowed Origins: ${JSON.stringify(allowedOrigins)}`);
  }

  app.use(
    cors({
      origin: allowedOrigins, // Use the array of allowed origins
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Be explicit about methods
      allowedHeaders: ["Content-Type", "Authorization"], // Be explicit about allowed headers
      // credentials: true // Only needed if using cookies/sessions across domains
    })
  );

  // 3. Apply bodyParser globally (can usually come after CORS)
  app.use(bodyParser.json());

  // --- Route Definitions ---

  // 4. Define other API routes (like UploadThing) AFTER global middleware
  //    The GraphQL endpoint ('/graphql') is assumed to be configured within initServer()
  app.use(
    "/api/uploadthing",
    createRouteHandler({
      router: ourFileRouter,
      // config: { ... } // Optional: Add Uploadthing config if needed
    })
  );

  // 5. Define a simple root/health check route (optional)
  app.get("/", (req, res) =>
    res.status(200).json({ message: "Backend server is running" })
  );

  // --- Start the Server ---
  const PORT = process.env.PORT || 8000; // Render often sets PORT automatically
  app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));
}

// --- Start the initialization process ---
init().catch((error) => {
  // Added basic error handling for the init function itself
  console.error("Failed to initialize server:", error);
  process.exit(1);
});
