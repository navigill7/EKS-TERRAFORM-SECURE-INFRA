// client/src/components/NotificationCenter.jsx
import { useEffect, useRef } from 'react';
import { X, Check, CheckCheck, Trash2, Heart, MessageCircle, UserPlus, Eye, FileText  , Bell} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const {
    notifications,
    unreadCount,
    showNotificationCenter,
    setShowNotificationCenter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowNotificationCenter(false);
      }
    };

    if (showNotificationCenter) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [showNotificationCenter, setShowNotificationCenter]);

  // Close on ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        setShowNotificationCenter(false);
      }
    };

    if (showNotificationCenter) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showNotificationCenter, setShowNotificationCenter]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'friend-request':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'profile-view':
        return <Eye className="w-5 h-5 text-purple-500" />;
      case 'friend-post':
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return <Bell className="w-5 h-5 text-grey-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'friend-post':
        // Navigate to post (you'll need to implement this)
        navigate(`/post/${notification.relatedId}`);
        break;
      case 'message':
        // Open chat with conversation
        navigate(`/messages/${notification.relatedId}`);
        break;
      case 'profile-view':
      case 'friend-request':
        // Navigate to actor's profile
        navigate(`/profile/${notification.actorId}`);
        break;
      default:
        break;
    }

    setShowNotificationCenter(false);
  };

  const formatTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInSeconds = Math.floor((now - notifDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return notifDate.toLocaleDateString();
  };

  if (!showNotificationCenter) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end pt-16 pr-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" />

      {/* Notification Panel */}
      <div
        ref={modalRef}
        className="relative w-full max-w-md max-h-[calc(100vh-80px)] bg-white dark:bg-grey-800 rounded-2xl shadow-2xl overflow-hidden animate-slide-in"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-grey-800 border-b border-grey-200 dark:border-grey-700 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-grey-800 dark:text-grey-100">
              Notifications
            </h2>
            <button
              onClick={() => setShowNotificationCenter(false)}
              className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-grey-500" />
            </button>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="w-16 h-16 text-grey-300 dark:text-grey-600 mb-3" />
              <p className="text-grey-500 dark:text-grey-400 text-center">
                No notifications yet
              </p>
              <p className="text-sm text-grey-400 dark:text-grey-500 mt-1">
                We'll notify you when something happens
              </p>
            </div>
          ) : (
            <div className="divide-y divide-grey-100 dark:divide-grey-700">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 cursor-pointer transition-colors duration-200 ${
                    notification.read
                      ? 'hover:bg-grey-50 dark:hover:bg-grey-700/50'
                      : 'bg-primary-50/50 dark:bg-primary-900/10 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {/* Actor Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={notification.actorPicture || '/default-avatar.png'}
                        alt={notification.actorName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-grey-800 rounded-full p-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-grey-700 dark:text-grey-200">
                        {notification.message}
                      </p>
                      <p className="text-xs text-grey-500 dark:text-grey-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification._id);
                          }}
                          className="p-1.5 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-grey-500" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotificationCenter;