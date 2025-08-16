# Twitter Clone (Next.js Frontend)

This project is a frontend clone of Twitter built using Next.js, React, TypeScript, GraphQL, and Tailwind CSS. It interacts with a GraphQL backend API to fetch and display tweets, manage users, handle authentication via Google OAuth, and allow users to post tweets, including image uploads.

## Features

- **Tweet Feed:** View a timeline of tweets from all users.
- **Create Tweets:** Post new tweets with text content.
- **Image Uploads:** Attach images to tweets (uploads handled via pre-signed S3 URLs obtained from the backend).
- **User Profiles:** View user profiles, including their tweets, followers, and following counts.
- **Follow/Unfollow Users:** Follow and unfollow other users directly from their profile pages or recommended lists.
- **Google Authentication:** Sign in using your Google account.
- **Recommended Users:** See a list of users you might know or want to follow.
- **Responsive Design:** Basic responsiveness using Tailwind CSS.
- **Typed API Interaction:** Leverages GraphQL Code Generator for end-to-end type safety with the GraphQL API.
- **Efficient Data Fetching:** Uses React Query for caching, background updates, and managing server state.

## Tech Stack

- **Frontend Framework:** [Next.js](https://nextjs.org/) (v13+ with Pages Router)
- **UI Library:** [React](https://reactjs.org/) (v18)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **API Communication:** [GraphQL](https://graphql.org/)
- **GraphQL Client:** [graphql-request](https://github.com/prisma-labs/graphql-request)
- **State Management (Server):** [TanStack Query (React Query)](https://tanstack.com/query/v4)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Authentication:** [Google OAuth (`@react-oauth/google`)](https://github.com/MomenSherif/react-oauth)
- **Code Generation:** [GraphQL Code Generator](https://the-guild.dev/graphql/codegen)
- **HTTP Client (for uploads):** [Axios](https://axios-http.com/)
- **Icons:** [React Icons](https://react-icons.github.io/react-icons/)

_Note: The backend GraphQL API (hosted at `https://d170eyh2z0r1e0.cloudfront.net/graphql`) and database are separate and not included in this repository._

## Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd piyushgarg-dev-twitter-clone
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Environment Variables:**
    This project requires specific environment variables for the GraphQL API endpoint and Google OAuth Client ID. Create a `.env.local` file in the root directory and add the following:

    ```env
    NEXT_PUBLIC_API_URL=your-client-id-goes-here
    ```

4.  **Run the development server:**
    This command also starts the GraphQL Code Generator in watch mode.

    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

5.  **Open your browser:**
    Navigate to [http://localhost:3000](http://localhost:3000).

## Usage

1.  **Login:** Click the "Login with Google" button in the right sidebar (if you are not logged in).
2.  **View Feed:** The main page (`/`) displays a feed of all tweets.
3.  **Create Tweet:** Use the text area at the top of the feed to enter your tweet. Click the image icon to upload an image. Click "Tweet" to post.
4.  **View Profile:** Click on a user's name or profile picture in a tweet, or on the "Profile" link in the left sidebar (when logged in) to navigate to a user's profile page (`/<user-id>`).
5.  **Follow/Unfollow:** On a user's profile page (if it's not your own), use the "Follow" or "Unfollow" button.
