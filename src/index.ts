// twitter-clone-server/src/index.ts

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { initServer } from "./app";
import * as dotenv from "dotenv";
dotenv.config();

import { createRouteHandler } from "uploadthing/express";
import { ourFileRouter } from "./app/api/uploadthing/core";

async function init() {
  const app = express();

  // --- CORS Configuration ---
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
  ].filter(Boolean) as string[];

  if (!process.env.FRONTEND_URL) {
    console.warn(
      "------------------------------------------------------------------------------------"
    );
    console.warn(
      "WARN: Required environment variable 'FRONTEND_URL' is not set on the backend server."
    );
    console.warn("CORS might block requests from your deployed frontend.");
    console.warn(
      `Currently allowing origins based on defaults/other settings: ${JSON.stringify(
        allowedOrigins
      )}`
    );
    console.warn(
      "ACTION: Set FRONTEND_URL in your backend's Render Environment Variables (e.g., https://pulse-stream.onrender.com)."
    );
    console.warn(
      "------------------------------------------------------------------------------------"
    );
  } else {
    console.log(
      `INFO: CORS Allowed Origins configured: ${JSON.stringify(allowedOrigins)}`
    );
  }

  const corsOptions = {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  // --- Explicit OPTIONS Handling (Add This Section) ---
  // Handle OPTIONS requests explicitly for all routes *before* the main CORS middleware.
  // This often helps resolve stubborn preflight issues.
  app.options("*", cors(corsOptions)); // Enable preflight across-the-board
  // --- End Explicit OPTIONS Handling ---

  // Apply CORS middleware globally for non-OPTIONS requests
  app.use(cors(corsOptions));

  // Apply bodyParser globally
  app.use(bodyParser.json());

  // --- Route Definitions ---
  // Initialize Apollo Server & GraphQL endpoint (assuming it adds /graphql)
  await initServer(app); // Pass app to be configured

  // UploadThing route handler
  app.use(
    "/api/uploadthing",
    createRouteHandler({
      router: ourFileRouter,
    })
  );

  // Root/health check route
  app.get("/", (req, res) =>
    res.status(200).json({ message: "Twitter Clone Backend is running" })
  );

  // --- Start the Server ---
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () =>
    console.log(`Backend server started successfully on PORT: ${PORT}`)
  );
}

// --- Start the initialization process ---
init().catch((error) => {
  console.error("FATAL: Failed to initialize server:", error);
  process.exit(1);
});
