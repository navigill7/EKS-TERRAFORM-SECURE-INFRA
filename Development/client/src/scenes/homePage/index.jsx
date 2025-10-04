import React, { useEffect, useRef } from "react";
import Navbar from "scenes/navbar";
import { useSelector } from "react-redux";
import UserWidget from "scenes/widgets/UserWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import EventsWidget from "scenes/widgets/Events";
import ConnectionListWidget from "scenes/widgets/ConnectionListWidget";
import SocialUrlsTest from "components/SocialUrlTest"; 

const HomePage = () => {
  const { _id, picturePath } = useSelector((state) => state.user);
  const chatbotContainerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.botpress.cloud/webchat/v1/inject.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (chatbotContainerRef.current) {
        const scriptConfig = document.createElement("script");
        scriptConfig.src =
          "https://mediafiles.botpress.cloud/e949b4d4-406a-42bb-978f-d9089eb95921/webchat/config.js";
        scriptConfig.defer = true;
        chatbotContainerRef.current.appendChild(scriptConfig);
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-grey-50 dark:bg-grey-900">
      <Navbar />
      <div className="w-full px-[6%] py-8">
        <div className="flex flex-col lg:flex-row gap-6 justify-between">
          {/* Left Sidebar */}
          <div className="w-full lg:w-[26%]">
            <UserWidget userId={_id} picturePath={picturePath} />
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-[42%] space-y-6">
            <MyPostWidget picturePath={picturePath} />
            <PostsWidget userId={_id} />
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-full lg:w-[26%] space-y-6">
            <EventsWidget />
            <ConnectionListWidget userId={_id} />
          </div>
        </div>

        {/* Chatbot Container */}
        <div
          ref={chatbotContainerRef}
          className="fixed bottom-5 right-5 z-[999]"
        ></div>
      </div>
    </div>
  );
};

export default HomePage;