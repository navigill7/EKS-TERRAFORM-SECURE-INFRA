import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Navbar from "scenes/navbar";
import ConnectionListWidget from "scenes/widgets/ConnectionListWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import UserWidget from "scenes/widgets/UserWidget";
import { API_ENDPOINTS } from "config/api";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const { userId } = useParams();
  const token = useSelector((state) => state.token);

  const getUser = async () => {
    const response = await fetch(API_ENDPOINTS.USER_BY_ID(userId), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    setUser(data);
  };

  useEffect(() => {
    getUser();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-grey-50 dark:bg-grey-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-grey-900">
      <Navbar />
      <div className="w-full px-[6%] py-8">
        <div className="flex flex-col lg:flex-row gap-6 justify-center">
          {/* Left Sidebar */}
          <div className="w-full lg:w-[26%] space-y-6">
            <UserWidget userId={userId} picturePath={user.picturePath} />
            <ConnectionListWidget userId={userId} />
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-[42%] space-y-6">
            <MyPostWidget picturePath={user.picturePath} />
            <PostsWidget userId={userId} isProfile />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;