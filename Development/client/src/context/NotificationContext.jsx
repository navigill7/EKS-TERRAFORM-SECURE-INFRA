// client/src/context/NotificationContext.jsx (FIXED)
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

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
  const [stompClient, setStompClient] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);

  // Initialize STOMP connection
  useEffect(() => {
    if (!token || !user) {
      console.log('⏸️ Skipping WebSocket - no token or user');
      return;
    }

    console.log('🔌 Initializing STOMP connection...');

    // Create STOMP client with SockJS
    const client = new Client({
      webSocketFactory: () => new SockJS(`${NOTIFICATION_SERVICE_URL}/ws`),
      
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      debug: (str) => {
        console.log('STOMP Debug:', str);
      },

      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        console.log('✅ Connected to notification service');
        setIsConnected(true);

        // Subscribe to user-specific notifications
        client.subscribe(`/user/queue/notification:new`, (message) => {
          console.log('🔔 New notification:', message);
          try {
            const notification = JSON.parse(message.body);
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            showToast(notification);
          } catch (error) {
            console.error('Error parsing notification:', error);
          }
        });

        // Subscribe to notification updates
        client.subscribe(`/user/queue/notification:updated`, (message) => {
          console.log('🔄 Notification updated:', message);
          try {
            const notification = JSON.parse(message.body);
            setNotifications((prev) =>
              prev.map((n) => (n._id === notification._id ? notification : n))
            );
          } catch (error) {
            console.error('Error parsing updated notification:', error);
          }
        });

        // Subscribe to unread count updates
        client.subscribe(`/user/queue/notification:unread-count`, (message) => {
          console.log('📊 Unread count update:', message);
          try {
            const data = JSON.parse(message.body);
            setUnreadCount(data.count);
          } catch (error) {
            console.error('Error parsing unread count:', error);
          }
        });

        // Subscribe to read confirmations
        client.subscribe(`/user/queue/notification:read-success`, (message) => {
          console.log('✅ Read confirmation:', message);
          try {
            const data = JSON.parse(message.body);
            setNotifications((prev) =>
              prev.map((n) =>
                n._id === data.notificationId ? { ...n, read: true } : n
              )
            );
          } catch (error) {
            console.error('Error parsing read confirmation:', error);
          }
        });

        // Subscribe to all read confirmations
        client.subscribe(`/user/queue/notification:all-read-success`, () => {
          console.log('✅ All notifications marked as read');
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
          setUnreadCount(0);
        });
      },

      onStompError: (frame) => {
        console.error('❌ STOMP error:', frame);
        setIsConnected(false);
      },

      onWebSocketClose: () => {
        console.log('🔌 WebSocket closed');
        setIsConnected(false);
      },

      onDisconnect: () => {
        console.log('❌ Disconnected from notification service');
        setIsConnected(false);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      console.log('🔌 Closing STOMP connection');
      if (client) {
        client.deactivate();
      }
    };
  }, [token, user]);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
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
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [token]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    if (!stompClient || !stompClient.connected) {
      console.warn('⚠️ STOMP not connected');
      return;
    }

    stompClient.publish({
      destination: '/app/notification.markRead',
      body: JSON.stringify({ notificationId }),
    });
  }, [stompClient]);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    if (!stompClient || !stompClient.connected) {
      console.warn('⚠️ STOMP not connected');
      return;
    }

    stompClient.publish({
      destination: '/app/notification.markAllRead',
      body: JSON.stringify({}),
    });
  }, [stompClient]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!token) return;

    try {
      const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [token]);

  // Show toast notification
  const showToast = (notification) => {
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
    stompClient,
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