import { createUploadthing, type FileRouter } from "uploadthing/server";
// import { GraphqlContext } from "@/interfaces";

const f = createUploadthing();

// Fake auth function
const auth = (req: Request) => {
    // replace the authetication logic here or pass in header
    // auth need user id to prevent other uploading the files
    return { id: "fakeId" }
};

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const user = await auth(req);

      if (!user) throw new Error("Unauthorized");

      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);

      console.log("file url", file.url);

      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;