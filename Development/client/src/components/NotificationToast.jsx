// client/src/components/NotificationToast.jsx
import { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, UserPlus, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationToast = () => {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const handleShowToast = (event) => {
      const notification = event.detail;
      const id = notification._id;

      setToasts((prev) => [
        ...prev,
        { id, notification, show: true },
      ]);

      // Auto-remove after 5 seconds
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    };

    window.addEventListener('show-notification-toast', handleShowToast);

    return () => {
      window.removeEventListener('show-notification-toast', handleShowToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" fill="currentColor" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'friend-request':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'profile-view':
        return <Eye className="w-5 h-5 text-purple-500" />;
      case 'friend-post':
        return <FileText className="w-5 h-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const handleToastClick = (notification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'friend-post':
        navigate(`/post/${notification.relatedId}`);
        break;
      case 'message':
        navigate(`/messages/${notification.relatedId}`);
        break;
      case 'profile-view':
      case 'friend-request':
        navigate(`/profile/${notification.actorId}`);
        break;
      default:
        break;
    }
    removeToast(notification._id);
  };

  return (
    <div className="fixed top-20 right-4 z-[200] flex flex-col gap-2">
      {toasts.map(({ id, notification, show }) => (
        <div
          key={id}
          className={`
            flex items-start gap-3 p-4 bg-white dark:bg-grey-800 rounded-lg shadow-lg border border-grey-200 dark:border-grey-700 max-w-sm cursor-pointer
            transform transition-all duration-300
            ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
            hover:shadow-xl hover:scale-105
          `}
          onClick={() => handleToastClick(notification)}
        >
          {/* Actor Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={notification.actorPicture || '/default-avatar.png'}
              alt={notification.actorName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-grey-800 rounded-full p-0.5">
              {getNotificationIcon(notification.type)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-grey-700 dark:text-grey-200 line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-grey-500 dark:text-grey-400 mt-1">
              Just now
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeToast(id);
            }}
            className="flex-shrink-0 p-1 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
          >
            <X className="w-4 h-4 text-grey-500" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;