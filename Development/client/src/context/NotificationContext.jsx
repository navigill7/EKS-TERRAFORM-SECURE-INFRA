// client/src/context/NotificationContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

const NOTIFICATION_SERVICE_URL = process.env.REACT_APP_NOTIFICATION_SERVICE_URL || 'http://localhost:4001';

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !user) return;

    const newSocket = io(NOTIFICATION_SERVICE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to notification service');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from notification service');
      setIsConnected(false);
    });

    // Handle new notification
    newSocket.on('notification:new', (notification) => {
      console.log('🔔 New notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      
      // Show toast notification
      showToast(notification);
    });

    // Handle notification update (grouped)
    newSocket.on('notification:updated', (notification) => {
      console.log('🔄 Notification updated:', notification);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? notification : n))
      );
    });

    // Handle unread count
    newSocket.on('notification:unread-count', ({ count }) => {
      console.log('📊 Unread count:', count);
      setUnreadCount(count);
    });

    // Handle read confirmation
    newSocket.on('notification:read-success', ({ notificationId }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
    });

    // Handle all read confirmation
    newSocket.on('notification:all-read-success', () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user]);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [token]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [token]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    if (!socket) return;
    socket.emit('notification:mark-read', notificationId);
  }, [socket]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    if (!socket) return;
    socket.emit('notification:mark-all-read');
  }, [socket]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!token) return;

    try {
      await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [token]);

  // Show toast notification
  const showToast = (notification) => {
    // This will be handled by a toast component
    const event = new CustomEvent('show-notification-toast', { detail: notification });
    window.dispatchEvent(event);
  };

  // Fetch notifications on mount
  useEffect(() => {
    if (token) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [token, fetchNotifications, fetchUnreadCount]);

  const value = {
    socket,
    notifications,
    unreadCount,
    isConnected,
    showNotificationCenter,
    setShowNotificationCenter,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};