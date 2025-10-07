// components/SearchUsers.jsx
import { useState, useEffect, useRef } from "react";
import { Search, X, User, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { API_ENDPOINTS } from "config/api";
import UserImage from "./UserImage";

const SearchUsers = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = useSelector((state) => state.token);
  const searchInputRef = useRef(null);
  const modalRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  // Debounced search function
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchUsers(searchQuery);
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setError("");
      } else {
        setSearchResults([]);
        setError("Type at least 2 characters to search");
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const searchUsers = async (query) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_ENDPOINTS.USERS}/search`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = await response.json();
      setSearchResults(data);

      if (data.length === 0) {
        setError("No users found");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search users. Please try again.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    onClose();
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleClear = () => {
    setSearchQuery("");
    setSearchResults([]);
    setError("");
    searchInputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl bg-white dark:bg-grey-800 rounded-2xl shadow-2xl animate-scale-in"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-grey-100 dark:border-grey-700">
          <Search className="w-5 h-5 text-grey-400 dark:text-grey-500 flex-shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name..."
            className="flex-1 bg-transparent border-none outline-none text-grey-700 dark:text-grey-100 placeholder-grey-400 dark:placeholder-grey-500 text-lg"
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-grey-400 dark:text-grey-500" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-grey-500 dark:text-grey-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <User className="w-12 h-12 text-grey-300 dark:text-grey-600 mb-3" />
              <p className="text-grey-500 dark:text-grey-400 text-center">
                {error}
              </p>
            </div>
          )}

          {!loading && !error && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <User className="w-12 h-12 text-grey-300 dark:text-grey-600 mb-3" />
              <p className="text-grey-500 dark:text-grey-400 text-center">
                No users found matching "{searchQuery}"
              </p>
            </div>
          )}

          {!loading && searchResults.length > 0 && (
            <div className="divide-y divide-grey-100 dark:divide-grey-700">
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserClick(user._id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-grey-50 dark:hover:bg-grey-700/50 transition-colors duration-200 group"
                >
                  <UserImage image={user.picturePath} size="50px" />
                  <div className="flex-1 text-left">
                    <h4 className="font-medium text-grey-800 dark:text-grey-100 group-hover:text-primary-500 transition-colors duration-200">
                      {user.firstName} {user.lastName}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-grey-500 dark:text-grey-400">
                      {user.Year && (
                        <span>{user.Year}</span>
                      )}
                      {user.location && (
                        <>
                          {user.Year && <span>•</span>}
                          <span>{user.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    View Profile →
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && searchQuery.trim().length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Search className="w-12 h-12 text-grey-300 dark:text-grey-600 mb-3" />
              <p className="text-grey-500 dark:text-grey-400 text-center">
                Start typing to search for users
              </p>
              <p className="text-sm text-grey-400 dark:text-grey-500 mt-2">
                Search by first name or last name
              </p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        {searchResults.length > 0 && (
          <div className="p-3 border-t border-grey-100 dark:border-grey-700 bg-grey-50 dark:bg-grey-900/50">
            <p className="text-xs text-grey-500 dark:text-grey-400 text-center">
              {searchResults.length} user{searchResults.length !== 1 ? "s" : ""} found
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SearchUsers;