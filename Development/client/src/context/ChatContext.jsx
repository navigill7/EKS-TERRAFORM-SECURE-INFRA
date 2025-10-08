// client/src/context/ChatContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);

  // Initialize socket connection
  useEffect(() => {
    if (!token || !user) return;

    const CHAT_SERVER_URL = process.env.REACT_APP_CHAT_SERVER_URL || 'http://localhost:4000';
    
    const newSocket = io(CHAT_SERVER_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat server');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
    });

    // Online friends list
    newSocket.on('friends:online', ({ userIds }) => {
      setOnlineUsers(userIds);
    });

    // User online status
    newSocket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => [...new Set([...prev, userId])]);
    });

    // User offline status
    newSocket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    // New message received
    newSocket.on('message:new', ({ message }) => {
      setMessages((prev) => ({
        ...prev,
        [message.conversationId]: [
          ...(prev[message.conversationId] || []),
          message,
        ],
      }));

      // Update conversation list
      fetchConversations();
    });

    // Typing indicators
    newSocket.on('typing:start', ({ conversationId, userId, user: typingUser }) => {
      if (userId !== user._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [conversationId]: typingUser,
        }));
      }
    });

    newSocket.on('typing:stop', ({ conversationId, userId }) => {
      if (userId !== user._id) {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
      }
    });

    // Unread count
    newSocket.on('unread:total', ({ count }) => {
      setUnreadCount(count);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!token) return;

    try {
      const CHAT_API_URL = process.env.REACT_APP_CHAT_API_URL || 'http://localhost:4000/api/chat';
      const response = await fetch(`${CHAT_API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, [token]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId) => {
    if (!token || !conversationId) return;

    try {
      const CHAT_API_URL = process.env.REACT_APP_CHAT_API_URL || 'http://localhost:4000/api/chat';
      const response = await fetch(
        `${CHAT_API_URL}/conversations/${conversationId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setMessages((prev) => ({
        ...prev,
        [conversationId]: data.messages,
      }));
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [token]);

  // Send message
  const sendMessage = useCallback((recipientId, content) => {
    if (!socket || !content.trim()) return;

    socket.emit('message:send', {
      recipientId,
      content: content.trim(),
    });
  }, [socket]);

  // Join conversation
  const joinConversation = useCallback((conversationId) => {
    if (!socket) return;
    socket.emit('conversation:join', conversationId);
    fetchMessages(conversationId);
  }, [socket, fetchMessages]);

  // Leave conversation
  const leaveConversation = useCallback((conversationId) => {
    if (!socket) return;
    socket.emit('conversation:leave', conversationId);
  }, [socket]);

  // Start typing
  const startTyping = useCallback((conversationId) => {
    if (!socket) return;
    socket.emit('typing:start', { conversationId });
  }, [socket]);

  // Stop typing
  const stopTyping = useCallback((conversationId) => {
    if (!socket) return;
    socket.emit('typing:stop', { conversationId });
  }, [socket]);

  // Mark messages as read
  const markAsRead = useCallback((conversationId) => {
    if (!socket) return;
    socket.emit('messages:read', { conversationId });
  }, [socket]);

  // Start new conversation
  const startConversation = useCallback((otherUser) => {
    setActiveConversation({
      participant: otherUser,
      messages: [],
      _id: null, // Will be created on first message
    });
    setIsChatOpen(true);
  }, []);

  const value = {
    socket,
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    onlineUsers,
    typingUsers,
    unreadCount,
    isChatOpen,
    setIsChatOpen,
    fetchConversations,
    fetchMessages,
    sendMessage,
    joinConversation,
    leaveConversation,
    startTyping,
    stopTyping,
    markAsRead,
    startConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};