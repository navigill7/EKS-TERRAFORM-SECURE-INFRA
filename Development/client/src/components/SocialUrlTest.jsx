import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { API_ENDPOINTS } from "config/api";

/**
 * Testing Component for Social URLs
 * This component helps verify that social URLs are being saved and loaded correctly
 * Remove this file after testing is complete
 */
const SocialUrlsTest = () => {
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const [fetchedUser, setFetchedUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUserData = async () => {
    if (!user?._id) return;
    
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.USER_BY_ID(user._id), {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setFetchedUser(data);
      console.log("Fetched User Data:", data);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-grey-800 border border-grey-200 dark:border-grey-700 rounded-lg p-4 max-w-sm shadow-lg z-50">
      <h3 className="font-bold text-grey-800 dark:text-grey-100 mb-2">
        🔍 Social URLs Test
      </h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-grey-500 dark:text-grey-400">Redux State:</p>
          <p className="text-xs text-grey-700 dark:text-grey-200 break-all">
            Twitter: {user.twitterUrl || "Not set"}
          </p>
          <p className="text-xs text-grey-700 dark:text-grey-200 break-all">
            LinkedIn: {user.linkedInUrl || "Not set"}
          </p>
        </div>

        {fetchedUser && (
          <div className="pt-2 border-t border-grey-200 dark:border-grey-700">
            <p className="text-grey-500 dark:text-grey-400">Database:</p>
            <p className="text-xs text-grey-700 dark:text-grey-200 break-all">
              Twitter: {fetchedUser.twitterUrl || "Not set"}
            </p>
            <p className="text-xs text-grey-700 dark:text-grey-200 break-all">
              LinkedIn: {fetchedUser.linkedInUrl || "Not set"}
            </p>
          </div>
        )}

        <button
          onClick={fetchUserData}
          disabled={loading}
          className="w-full mt-2 px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-xs disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>

        <p className="text-xs text-grey-400 mt-2">
          Check browser console for detailed logs
        </p>
      </div>
    </div>
  );
};

export default SocialUrlsTest;