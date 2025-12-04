// client/src/scenes/navbar/index.jsx (UPDATED)
import { useState } from "react";
import { 
  Search, 
  MessageCircle, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Users, 
  ChevronDown,
  LogOut,
  User
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setMode, setLogout } from "state";
import { useNavigate } from "react-router-dom";
import FlexBetween from "components/FlexBetween";
import SearchUsers from "components/SearchUsers";
import ChatInterface from "components/ChatInterface";
import NotificationBell from "components/NotificationBell"; // 🆕 NEW IMPORT
import NotificationCenter from "components/NotificationCenter"; // 🆕 NEW IMPORT

const Navbar = () => {
  const [isMobileMenuToggled, setIsMobileMenuToggled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const mode = useSelector((state) => state.mode);
  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  const navigateToAlumni = () => {
    navigate("./alumniPage");
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleChatClick = () => {
    setIsChatOpen(true);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 px-[6%] py-4 bg-white/80 dark:bg-grey-800/80 backdrop-blur-lg border-b border-grey-100 dark:border-grey-700 shadow-sm">
        <FlexBetween>
          {/* Logo and Search */}
          <FlexBetween gap="gap-7">
            <h1
              onClick={() => navigate("/home")}
              className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform duration-200"
            >
              Uni-Link
            </h1>
            
            {/* Desktop Search */}
            <button
              onClick={handleSearchClick}
              className="hidden lg:flex items-center bg-grey-50 dark:bg-grey-700 rounded-full px-5 py-2.5 w-80 hover:bg-grey-100 dark:hover:bg-grey-600 transition-all duration-200 group"
            >
              <span className="flex-1 text-left text-grey-400 dark:text-grey-500 group-hover:text-grey-500 dark:group-hover:text-grey-400">
                Search users...
              </span>
              <Search className="w-5 h-5 text-grey-400 dark:text-grey-500 group-hover:text-primary-500 transition-colors duration-200" />
            </button>
          </FlexBetween>

          {/* Desktop Icons */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Mobile Search Button */}
            <button
              onClick={handleSearchClick}
              className="lg:hidden p-2.5 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
            >
              <Search className="w-6 h-6 text-grey-700 dark:text-grey-100" />
            </button>

            <button
              onClick={() => dispatch(setMode())}
              className="p-2.5 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
            >
              {mode === "dark" ? (
                <Sun className="w-6 h-6 text-grey-100" />
              ) : (
                <Moon className="w-6 h-6 text-grey-700" />
              )}
            </button>

            {/* 🆕 NOTIFICATION BELL */}
            <NotificationBell />

            {/* Chat Button */}
            <button 
              onClick={handleChatClick}
              className="p-2.5 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200 relative"
            >
              <MessageCircle className="w-6 h-6 text-grey-700 dark:text-grey-100" />
            </button>

            <button
              onClick={navigateToAlumni}
              className="p-2.5 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
            >
              <Users className="w-6 h-6 text-grey-700 dark:text-grey-100" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-grey-50 dark:bg-grey-700 hover:bg-grey-100 dark:hover:bg-grey-600 transition-colors duration-200"
              >
                <span className="text-sm font-medium text-grey-700 dark:text-grey-100">
                  {fullName}
                </span>
                <ChevronDown className={`w-4 h-4 text-grey-700 dark:text-grey-100 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-grey-800 rounded-lg shadow-lg border border-grey-100 dark:border-grey-700 py-2 animate-fade-in">
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(`/profile/${user._id}`);
                    }}
                    className="w-full px-4 py-2 text-left text-grey-700 dark:text-grey-100 hover:bg-grey-50 dark:hover:bg-grey-700 transition-colors duration-200 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={() => dispatch(setLogout())}
                    className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-grey-50 dark:hover:bg-grey-700 transition-colors duration-200 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {/* Mobile Search Button */}
            <button
              onClick={handleSearchClick}
              className="p-2 rounded-lg hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
            >
              <Search className="w-6 h-6 text-grey-700 dark:text-grey-100" />
            </button>

            {/* 🆕 MOBILE NOTIFICATION BELL */}
            <NotificationBell />

            <button
              onClick={() => setIsMobileMenuToggled(!isMobileMenuToggled)}
              className="p-2 rounded-lg hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
            >
              <Menu className="w-6 h-6 text-grey-700 dark:text-grey-100" />
            </button>
          </div>
        </FlexBetween>
      </nav>

      {/* Search Modal */}
      <SearchUsers 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />

      {/* Chat Interface */}
      <ChatInterface 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />

      {/* 🆕 NOTIFICATION CENTER */}
      <NotificationCenter />

      {/* Mobile Menu */}
      {isMobileMenuToggled && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={() => setIsMobileMenuToggled(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[85%] bg-white dark:bg-grey-800 z-50 shadow-2xl lg:hidden animate-slide-in">
            <div className="flex justify-end p-4">
              <button
                onClick={() => setIsMobileMenuToggled(false)}
                className="p-2 rounded-lg hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
              >
                <X className="w-6 h-6 text-grey-700 dark:text-grey-100" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-6 px-6 py-8">
              <button
                onClick={() => dispatch(setMode())}
                className="p-3 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
              >
                {mode === "dark" ? (
                  <Sun className="w-6 h-6 text-grey-100" />
                ) : (
                  <Moon className="w-6 h-6 text-grey-700" />
                )}
              </button>

              {/* Mobile Chat Button */}
              <button 
                onClick={() => {
                  setIsMobileMenuToggled(false);
                  handleChatClick();
                }}
                className="p-3 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
              >
                <MessageCircle className="w-6 h-6 text-grey-700 dark:text-grey-100" />
              </button>

              <button
                onClick={navigateToAlumni}
                className="p-3 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
              >
                <Users className="w-6 h-6 text-grey-700 dark:text-grey-100" />
              </button>

              <div className="w-full pt-6 border-t border-grey-200 dark:border-grey-700">
                <div className="text-center mb-4">
                  <p className="font-medium text-grey-700 dark:text-grey-100">{fullName}</p>
                </div>
                <button
                  onClick={() => dispatch(setLogout())}
                  className="w-full py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;