import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Configure S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/**
 * Generate a unique file name
 */
const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString("hex");
  const extension = originalName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
};

/**
 * Get presigned URL for uploading (PUT)
 * @param {string} fileType - MIME type (e.g., 'image/jpeg')
 * @param {string} folder - Folder in S3 bucket (e.g., 'profiles', 'posts')
 * @returns {Promise<{uploadUrl: string, key: string, accessUrl: string}>}
 */
export const getUploadPresignedUrl = async (fileType, folder = "uploads") => {
  try {
    // Generate unique file name
    const fileName = generateFileName(`file.${fileType.split("/")[1]}`);
    const key = `${folder}/${fileName}`;

    // Create PUT command
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    // Generate presigned URL (valid for 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // Generate the public access URL
    const accessUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
      uploadUrl,
      key,
      accessUrl,
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw error;
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 */
export const deleteFileFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`File deleted successfully: ${key}`);
    return true;
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw error;
  }
};

/**
 * Extract S3 key from access URL
 * @param {string} url - Full S3 URL
 * @returns {string} - S3 key
 */
export const extractKeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    // Remove leading slash
    return urlObj.pathname.substring(1);
  } catch (error) {
    console.error("Error extracting key from URL:", error);
    return null;
  }
};

export default s3Client;