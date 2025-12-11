import React, { useEffect, useRef } from "react";
import Navbar from "scenes/navbar";
import { useSelector } from "react-redux";
import UserWidget from "scenes/widgets/UserWidget";
import MyPostWidget from "scenes/widgets/MyPostWidget";
import PostsWidget from "scenes/widgets/PostsWidget";
import EventsWidget from "scenes/widgets/Events";
import ConnectionListWidget from "scenes/widgets/ConnectionListWidget";

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
    <div className="min-h-screen bg-grey-50 dark:bg-grey-900 flex flex-col">
      <Navbar />
      
      {/* Fixed height container for the content below navbar */}
      <div className="flex-1 w-full px-[6%] py-8 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 justify-between h-full">
          {/* Left Sidebar - Fixed, Scrollable if content overflows */}
          <div className="w-full lg:w-[26%] lg:overflow-y-auto lg:h-[calc(100vh-120px)] space-y-6 scrollbar-thin scrollbar-thumb-grey-300 dark:scrollbar-thumb-grey-700 scrollbar-track-transparent">
            <UserWidget userId={_id} picturePath={picturePath} />
          </div>

          {/* Main Content - Fixed MyPostWidget + Scrollable Posts */}
          <div className="w-full lg:w-[42%] lg:h-[calc(100vh-120px)] flex flex-col space-y-6">
            {/* Fixed MyPostWidget */}
            <div className="flex-shrink-0">
              <MyPostWidget picturePath={picturePath} />
            </div>
            
            {/* Scrollable Posts Only */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-grey-300 dark:scrollbar-thumb-grey-700 scrollbar-track-transparent">
              <PostsWidget userId={_id} />
            </div>
          </div>

          {/* Right Sidebar - Fixed, Scrollable if content overflows */}
          <div className="hidden lg:block w-full lg:w-[26%] lg:overflow-y-auto lg:h-[calc(100vh-120px)] space-y-6 scrollbar-thin scrollbar-thumb-grey-300 dark:scrollbar-thumb-grey-700 scrollbar-track-transparent">
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

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thumb-grey-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 3px;
        }
        
        .dark .scrollbar-thumb-grey-700::-webkit-scrollbar-thumb {
          background-color: #374151;
          border-radius: 3px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
        
        .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #4b5563;
        }
      `}</style>
    </div>
  );
};

export default HomePage;