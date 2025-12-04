// client/src/components/NotificationBell.jsx
import { Bell } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const NotificationBell = () => {
  const { unreadCount, setShowNotificationCenter, showNotificationCenter } = useNotifications();

  const handleClick = () => {
    setShowNotificationCenter(!showNotificationCenter);
  };

  return (
    <button
      onClick={handleClick}
      className="relative p-2.5 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors duration-200"
      title="Notifications"
    >
      <Bell className="w-6 h-6 text-grey-700 dark:text-grey-100" />
      
      {/* Unread count badge */}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      
      {/* Connection indicator (optional) */}
      {/* <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-grey-800 ${
        isConnected ? 'bg-green-500' : 'bg-grey-400'
      }`} /> */}
    </button>
  );
};

export default NotificationBell;