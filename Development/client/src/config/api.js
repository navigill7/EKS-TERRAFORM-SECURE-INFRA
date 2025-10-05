const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,

  // User endpoints
  USERS: `${API_BASE_URL}/users`,
  USER_BY_ID: (userId) => `${API_BASE_URL}/users/${userId}`,
  USER_FRIENDS: (userId) => `${API_BASE_URL}/users/${userId}/friends`,
  ADD_REMOVE_FRIEND: (userId, friendId) => `${API_BASE_URL}/users/${userId}/${friendId}`,
  UPDATE_SOCIAL_URLS: (userId) => `${API_BASE_URL}/users/${userId}/social`,

  // Post endpoints
  POSTS: `${API_BASE_URL}/posts`,
  USER_POSTS: (userId) => `${API_BASE_URL}/posts/${userId}/posts`,
  LIKE_POST: (postId) => `${API_BASE_URL}/posts/${postId}/like`,

  // S3 endpoints
  S3_UPLOAD_URL: `${API_BASE_URL}/s3/upload-url`,

  // Assets - Keep for backwards compatibility
  ASSET: (filename) => {
    // If it's already a full URL (S3), return as is
    if (filename.startsWith('http')) {
      return filename;
    }
    // Otherwise, use local assets
    return `${API_BASE_URL}/assets/${filename}`;
  },
};

export default API_BASE_URL;
