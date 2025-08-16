# Frequently Asked Questions (FAQ)

**Q1: Where is the backend code for this project?**

**A:** The backend code (GraphQL server, database interactions, business logic) is not included in this repository. This project focuses solely on the Next.js frontend client. The frontend interacts with a pre-existing GraphQL API hosted at `https://d170eyh2z0r1e0.cloudfront.net/graphql`.

**Q2: How does user authentication work?**

**A:** Authentication is handled using Google OAuth.
1.  The user clicks the "Login with Google" button (`@react-oauth/google` component).
2.  After successful Google authentication, a Google ID token is received by the frontend.
3.  This token is sent to the backend via the `verifyGoogleToken` GraphQL query.
4.  The backend verifies the token with Google, finds or creates a user in its database, and returns a JWT (JSON Web Token) to the frontend.
5.  The frontend stores this JWT in `localStorage` under the key `__twitter_token`.
6.  Subsequent requests to the GraphQL API include this JWT in the `Authorization: Bearer <token>` header (`clients/api.ts`). The backend uses this token to identify the authenticated user.

**Q3: How are tweet images uploaded and stored?**

**A:** Image uploads use pre-signed URLs, likely for direct-to-S3 uploads:
1.  The user selects an image file in the tweet composition area (`pages/index.tsx`).
2.  The frontend sends a request to the GraphQL API using the `getSignedURLForTweet` query, passing the desired file name and type.
3.  The backend generates a pre-signed URL (presumably for AWS S3) that grants temporary permission to upload a file with the specified characteristics. This URL is returned to the frontend.
4.  The frontend uses Axios (`axios.put`) to upload the image file directly to the received pre-signed URL. The backend/S3 handles the storage.
5.  Once the upload is successful, the frontend extracts the final URL of the uploaded image.
6.  When the user clicks "Tweet", the `createTweet` mutation is called with the tweet content *and* the URL of the uploaded image.

**Q4: What state management library is used?**

**A:** [TanStack Query (React Query)](https://tanstack.com/query/v4) is used primarily for managing server state. It handles data fetching, caching, background synchronization, and mutations (creating tweets, following/unfollowing users). It simplifies interacting with the GraphQL API and keeping the UI consistent with the server data. Local UI state (like the content of the tweet input) is managed using standard React state (`useState`).

**Q5: Why use GraphQL?**

**A:** GraphQL offers several advantages for this type of application:
*   **Declarative Data Fetching:** Clients ask for exactly the data they need, reducing over-fetching and under-fetching common with REST APIs.
*   **Strong Typing:** The GraphQL schema defines the API structure, enabling better tooling and type safety (used here with GraphQL Code Generator).
*   **Single Endpoint:** Typically, all requests go to a single GraphQL endpoint, simplifying API management.
*   **Efficient Development:** Frontend developers can request complex data structures in a single query, reducing the need for multiple round trips or specific backend endpoints for every view.

**Q6: Why use React Query?**

**A:** React Query excels at managing server state in React applications:
*   **Caching:** Automatically caches data from the API, making the UI feel faster and reducing redundant network requests.
*   **Background Updates:** Can automatically refetch data in the background to keep it fresh.
*   **Mutation Handling:** Provides helpers for managing loading/error states during data mutations and simplifies invalidating cached data after a mutation succeeds (e.g., refetching tweets after a new one is created).
*   **DevTools:** Offers excellent developer tools for inspecting cached data and query behavior.

**Q7: How can I add a new feature, like 'Likes'?**

**A:** To add a 'Likes' feature, you would typically:
1.  **Update Backend Schema:** Add mutations like `likeTweet(tweetId: ID!)` and `unlikeTweet(tweetId: ID!)` to the GraphQL schema. Update the `Tweet` type to include a `likeCount` field and possibly a `isLikedByCurrentUser` boolean field.
2.  **Regenerate Types:** Run the GraphQL Code Generator (`yarn dev` restarts it or run `yarn codegen` explicitly) to update the TypeScript types in the `gql/` directory.
3.  **Update GraphQL Operations:** Create new GraphQL mutation documents (e.g., in `graphql/mutation/tweet.ts`) for `likeTweet` and `unlikeTweet`. Update the `getAllTweets` query to fetch the new `likeCount` and `isLikedByCurrentUser` fields.
4.  **Create Hooks:** Potentially create new hooks in `hooks/tweet.ts` using `useMutation` for liking/unliking, handling optimistic updates, and invalidating the tweet query cache on success.
5.  **Update UI:** Modify the `FeedCard` component (`components/FeedCard/index.tsx`) to display the like count and add a button (e.g., a heart icon) that triggers the like/unlike mutation hook. Update the button's appearance based on the `isLikedByCurrentUser` status.

**Q8: The project uses `getServerSideProps` on the index and profile pages. Why?**

**A:** Using `getServerSideProps` allows Next.js to pre-render these pages on the server with data fetched before sending the HTML to the client.
*   **Profile Page (`pages/[id].tsx`):** Fetches the specific user's data based on the ID in the URL. This ensures the profile information is immediately available when the page loads, which is good for SEO and perceived performance.
*   **Index Page (`pages/index.tsx`):** Fetches the initial list of tweets. This provides the first batch of tweets quickly to the user without waiting for client-side JavaScript to load and fetch the data. React Query then takes over on the client-side for subsequent updates and interactions.