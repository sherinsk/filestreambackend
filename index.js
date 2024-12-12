const express = require("express");
const { S3Client, GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const cors = require("cors");
require("dotenv").config();
const stream = require("stream");
const https = require("https");

const app = express();
app.use(express.json());

app.use(cors({
    origin: "https://reactfiledownload.vercel.app", // Replace with your frontend's URL
    exposedHeaders: ['Content-Disposition'],
    methods: ["GET","POST"], // Allowed methods
  }));

// Configure AWS SDK v3 for DigitalOcean Spaces
const s3Client = new S3Client({
  endpoint: "https://blr1.digitaloceanspaces.com",
  region: "blr1",
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  },
});

// Route to fetch the file securely using GET
app.post("/get-file", async (req, res) => {
  const fileKey = "hexis/4/qwerty";

  try {
    const headCommand = new HeadObjectCommand({
      Bucket: "stoventest2", // Your bucket name
      Key: fileKey,
    });
    const headResult = await s3Client.send(headCommand);
    const contentType = headResult.ContentType || "application/octet-stream";

    const getCommand = new GetObjectCommand({
      Bucket: "stoventest2", // Your bucket name
      Key: fileKey,
    });

    const fileStream = (await s3Client.send(getCommand)).Body;

    // Set response headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileKey.split('/').pop()}"`);
    res.setHeader("Cache-Control", "no-store");

    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      console.error("Stream error:", error);
      res.status(500).json({ message: "Error streaming the file" });
    });
  } catch (error) {
    console.error("Error retrieving file:", error);
    res.status(500).json({ message: "Failed to retrieve file" });
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
