import { API_ENDPOINTS } from "config/api";

/**
 * Upload file to S3 using presigned URL
 * @param {File} file - The file to upload
 * @param {string} type - 'profile' or 'post'
 * @param {string} token - JWT token
 * @returns {Promise<string>} - The S3 access URL
 */
export const uploadToS3 = async (file, type, token) => {
  try {
    console.log("📤 Starting S3 upload for:", file.name);
    console.log("📄 File type:", file.type);
    console.log("📦 File size:", (file.size / 1024).toFixed(2), "KB");

    // Step 1: Get presigned URL from backend
    const endpoint = type === 'profile' 
      ? `${API_ENDPOINTS.S3_UPLOAD_URL}/profile`
      : `${API_ENDPOINTS.S3_UPLOAD_URL}/post`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,  // ✅ FIXED: Added fileName
        fileType: file.type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Backend error:", errorData);
      throw new Error(errorData.message || `Failed to get upload URL (${response.status})`);
    }

    const { uploadUrl, accessUrl } = await response.json();
    console.log("✅ Got presigned URL");

    // Step 2: Upload file directly to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      console.error("❌ S3 upload failed:", uploadResponse.status, uploadResponse.statusText);
      throw new Error(`Failed to upload to S3 (${uploadResponse.status})`);
    }

    console.log("✅ File uploaded successfully to S3");
    console.log("🔗 Access URL:", accessUrl);

    return accessUrl;
  } catch (error) {
    console.error("❌ Error uploading to S3:", error);
    throw error;
  }
};