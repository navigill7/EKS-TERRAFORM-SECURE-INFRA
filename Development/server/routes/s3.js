import express from "express";
import { getUploadPresignedUrl } from "../utils/s3.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET presigned URL for profile picture upload (NO AUTH for registration)
 * POST /s3/upload-url/profile
 */
router.post("/upload-url/profile", async (req, res) => {
  try {
    const { fileType } = req.body;

    if (!fileType) {
      return res.status(400).json({ message: "File type is required" });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ 
        message: "Invalid file type. Only JPEG, PNG, and WebP are allowed." 
      });
    }

    const { uploadUrl, key, accessUrl } = await getUploadPresignedUrl(fileType, "profiles");

    res.status(200).json({
      uploadUrl,
      key,
      accessUrl,
    });
  } catch (error) {
    console.error("Error generating profile upload URL:", error);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
});

/**
 * GET presigned URL for post image upload (REQUIRES AUTH)
 * POST /s3/upload-url/post
 */
router.post("/upload-url/post", verifyToken, async (req, res) => {
  try {
    const { fileType } = req.body;

    if (!fileType) {
      return res.status(400).json({ message: "File type is required" });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({ 
        message: "Invalid file type. Only JPEG, PNG, and WebP are allowed." 
      });
    }

    const { uploadUrl, key, accessUrl } = await getUploadPresignedUrl(fileType, "posts");

    res.status(200).json({
      uploadUrl,
      key,
      accessUrl,
    });
  } catch (error) {
    console.error("Error generating post upload URL:", error);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
});

export default router;