// scenes/widgets/UserWidget.jsx (UPDATED - Add this import and button)
import { Settings, MapPin, GraduationCap, Link as LinkIcon, Plus, ExternalLink, Check, Bell } from "lucide-react";
import UserImage from "components/UserImage";
import FlexBetween from "components/FlexBetween";
import WidgetWrapper from "components/WidgetWrapper";
import NotificationSettings from "components/NotificationSettings"; // 🆕 NEW IMPORT
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "config/api";
import { setUser } from "state";

const UserWidget = ({ userId, picturePath }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const isOwnProfile = userId === loggedInUserId;
  
  const [twitterDetails, setTwitterDetails] = useState({ url: "", openInput: false, saving: false });
  const [linkedInDetails, setLinkedInDetails] = useState({ url: "", openInput: false, saving: false });
  
  // 🆕 NEW STATE FOR SETTINGS MODAL
  const [showSettings, setShowSettings] = useState(false);

  const getUser = async () => {
    const response = await fetch(API_ENDPOINTS.USER_BY_ID(userId), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setUser(data);
    
    // Load saved URLs
    if (data.twitterUrl) {
      setTwitterDetails({ url: data.twitterUrl, openInput: false, saving: false });
    }
    if (data.linkedInUrl) {
      setLinkedInDetails({ url: data.linkedInUrl, openInput: false, saving: false });
    }
  };

  const updateSocialUrls = async (twitterUrl, linkedInUrl) => {
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_SOCIAL_URLS(userId), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitterUrl: twitterUrl,
          linkedInUrl: linkedInUrl,
        }),
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update social URLs:", error);
      return false;
    }
  };

  useEffect(() => {
    getUser();
  }, [userId]);

  if (!user) {
    return null;
  }

  const { firstName, lastName, location, Year, viewedProfile, impressions, friends } = user;

  const goToTwitter = () => {
    if (twitterDetails.url) {
      window.open(twitterDetails.url, "_blank");
    }
  };

  const goToLinkedIn = () => {
    if (linkedInDetails.url) {
      window.open(linkedInDetails.url, "_blank");
    }
  };

  const validateTwitterUrl = async (event) => {
    if (event.key === "Enter") {
      const inputUrl = event.target.value.trim();
      if (inputUrl && (inputUrl.startsWith("https://x.com/") || inputUrl.startsWith("https://twitter.com/"))) {
        setTwitterDetails({ ...twitterDetails, saving: true });
        const success = await updateSocialUrls(inputUrl, linkedInDetails.url);
        if (success) {
          setTwitterDetails({ url: inputUrl, openInput: false, saving: false });
        } else {
          setTwitterDetails({ ...twitterDetails, saving: false });
          alert("Failed to save Twitter URL. Please try again.");
        }
      } else {
        alert("Please enter a valid Twitter/X URL (e.g., https://x.com/username)");
      }
    }
  };

  const validateLinkedInUrl = async (event) => {
    if (event.key === "Enter") {
      const inputUrl = event.target.value.trim();
      if (inputUrl && inputUrl.startsWith("https://www.linkedin.com/in/")) {
        setLinkedInDetails({ ...linkedInDetails, saving: true });
        const success = await updateSocialUrls(twitterDetails.url, inputUrl);
        if (success) {
          setLinkedInDetails({ url: inputUrl, openInput: false, saving: false });
        } else {
          setLinkedInDetails({ ...linkedInDetails, saving: false });
          alert("Failed to save LinkedIn URL. Please try again.");
        }
      } else {
        alert("Please enter a valid LinkedIn URL (e.g., https://www.linkedin.com/in/username)");
      }
    }
  };

  const removeTwitterUrl = async () => {
    if (window.confirm("Are you sure you want to remove your Twitter URL?")) {
      const success = await updateSocialUrls("", linkedInDetails.url);
      if (success) {
        setTwitterDetails({ url: "", openInput: false, saving: false });
      }
    }
  };

  const removeLinkedInUrl = async () => {
    if (window.confirm("Are you sure you want to remove your LinkedIn URL?")) {
      const success = await updateSocialUrls(twitterDetails.url, "");
      if (success) {
        setLinkedInDetails({ url: "", openInput: false, saving: false });
      }
    }
  };

  return (
    <>
      <WidgetWrapper>
        {/* Profile Section */}
        <FlexBetween className="pb-4 cursor-pointer group" onClick={() => navigate(`/profile/${userId}`)}>
          <FlexBetween gap="gap-4">
            <UserImage image={picturePath} />
            <div>
              <h4 className="text-lg font-semibold text-grey-800 dark:text-grey-100 group-hover:text-primary-500 transition-colors duration-200">
                {firstName} {lastName}
              </h4>
              <p className="text-sm text-grey-500 dark:text-grey-400">
                {friends.length} Connections
              </p>
            </div>
          </FlexBetween>
          
          {/* 🆕 SETTINGS BUTTON - Only show on own profile */}
          {isOwnProfile && (
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(true);
                }}
                className="p-2 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/30 text-primary-600 dark:text-primary-400 transition-all duration-200"
                title="Notification Settings"
              >
                <Bell className="w-5 h-5" />
              </button>
              <Settings className="w-5 h-5 text-grey-400 dark:text-grey-500 group-hover:text-primary-500 transition-colors duration-200" />
            </div>
          )}
          
          {!isOwnProfile && (
            <Settings className="w-5 h-5 text-grey-400 dark:text-grey-500 group-hover:text-primary-500 transition-colors duration-200" />
          )}
        </FlexBetween>

        <div className="border-t border-grey-100 dark:border-grey-700 my-4" />

        {/* Location and Year */}
        <div className="space-y-3 py-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-grey-500 dark:text-grey-400" />
            <p className="text-grey-600 dark:text-grey-300">{location}</p>
          </div>
          <div className="flex items-center gap-3">
            <GraduationCap className="w-5 h-5 text-grey-500 dark:text-grey-400" />
            <p className="text-grey-600 dark:text-grey-300">{Year}</p>
          </div>
        </div>

        <div className="border-t border-grey-100 dark:border-grey-700 my-4" />

        {/* Profile Stats */}
        <div className="space-y-2 py-4">
          <FlexBetween>
            <p className="text-sm text-grey-500 dark:text-grey-400">Profile views</p>
            <p className="text-sm font-semibold text-grey-700 dark:text-grey-200">{viewedProfile}</p>
          </FlexBetween>
          <FlexBetween>
            <p className="text-sm text-grey-500 dark:text-grey-400">Post impressions</p>
            <p className="text-sm font-semibold text-grey-700 dark:text-grey-200">{impressions}</p>
          </FlexBetween>
        </div>

        <div className="border-t border-grey-100 dark:border-grey-700 my-4" />

        {/* Social Profiles */}
        <div className="py-4">
          <h4 className="text-base font-semibold text-grey-700 dark:text-grey-200 mb-4">
            Social Profiles
          </h4>

          {/* Twitter */}
          <FlexBetween className="mb-3">
            <FlexBetween gap="gap-3">
              <div className="w-10 h-10 bg-[#1DA1F2] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-grey-700 dark:text-grey-200">Twitter</p>
                <p className="text-xs text-grey-500 dark:text-grey-400 truncate">
                  {twitterDetails.url ? "Connected" : "Social Network"}
                </p>
              </div>
            </FlexBetween>
            
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                {twitterDetails.url && (
                  <>
                    <button
                      onClick={goToTwitter}
                      className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200 group"
                      title="Open Twitter profile"
                    >
                      <ExternalLink className="w-4 h-4 text-primary-500 group-hover:text-primary-600" />
                    </button>
                    <button
                      onClick={removeTwitterUrl}
                      className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      title="Remove URL"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
                {!twitterDetails.url && (
                  <button
                    onClick={() => setTwitterDetails({ ...twitterDetails, openInput: !twitterDetails.openInput })}
                    className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
                    title="Add Twitter URL"
                  >
                    <Plus className="w-4 h-4 text-grey-500 dark:text-grey-400" />
                  </button>
                )}
              </div>
            ) : (
              twitterDetails.url && (
                <button
                  onClick={goToTwitter}
                  className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200 group"
                  title="Open Twitter profile"
                >
                  <ExternalLink className="w-4 h-4 text-primary-500 group-hover:text-primary-600" />
                </button>
              )
            )}
          </FlexBetween>
          
          {isOwnProfile && twitterDetails.openInput && (
            <div className="mb-3">
              <input
                className="w-full px-3 py-2 text-sm rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-700 text-grey-700 dark:text-grey-100 outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                placeholder="https://x.com/username (Press Enter to save)"
                onKeyDown={validateTwitterUrl}
                disabled={twitterDetails.saving}
              />
              {twitterDetails.saving && (
                <p className="text-xs text-primary-500 mt-1">Saving...</p>
              )}
            </div>
          )}

          {/* LinkedIn */}
          <FlexBetween>
            <FlexBetween gap="gap-3">
              <div className="w-10 h-10 bg-[#0077B5] rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-grey-700 dark:text-grey-200">LinkedIn</p>
                <p className="text-xs text-grey-500 dark:text-grey-400 truncate">
                  {linkedInDetails.url ? "Connected" : "Network Platform"}
                </p>
              </div>
            </FlexBetween>
            
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                {linkedInDetails.url && (
                  <>
                    <button
                      onClick={goToLinkedIn}
                      className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200 group"
                      title="Open LinkedIn profile"
                    >
                      <ExternalLink className="w-4 h-4 text-primary-500 group-hover:text-primary-600" />
                    </button>
                    <button
                      onClick={removeLinkedInUrl}
                      className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      title="Remove URL"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
                {!linkedInDetails.url && (
                  <button
                    onClick={() => setLinkedInDetails({ ...linkedInDetails, openInput: !linkedInDetails.openInput })}
                    className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
                    title="Add LinkedIn URL"
                  >
                    <Plus className="w-4 h-4 text-grey-500 dark:text-grey-400" />
                  </button>
                )}
              </div>
            ) : (
              linkedInDetails.url && (
                <button
                  onClick={goToLinkedIn}
                  className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200 group"
                  title="Open LinkedIn profile"
                >
                  <ExternalLink className="w-4 h-4 text-primary-500 group-hover:text-primary-600" />
                </button>
              )
            )}
          </FlexBetween>
          
          {isOwnProfile && linkedInDetails.openInput && (
            <div className="mt-3">
              <input
                className="w-full px-3 py-2 text-sm rounded-lg border border-grey-200 dark:border-grey-700 bg-white dark:bg-grey-700 text-grey-700 dark:text-grey-100 outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                placeholder="https://www.linkedin.com/in/username (Press Enter to save)"
                onKeyDown={validateLinkedInUrl}
                disabled={linkedInDetails.saving}
              />
              {linkedInDetails.saving && (
                <p className="text-xs text-primary-500 mt-1">Saving...</p>
              )}
            </div>
          )}
        </div>
      </WidgetWrapper>

      {/* 🆕 NOTIFICATION SETTINGS MODAL */}
      <NotificationSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
};

export default UserWidget;