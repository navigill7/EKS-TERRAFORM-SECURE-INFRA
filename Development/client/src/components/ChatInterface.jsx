import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Search, MoreVertical, ArrowLeft, Loader, Image, Plus, UserPlus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const CHAT_SERVICE_URL = process.env.REACT_APP_CHAT_SERVICE_URL || 'http://localhost:4000';
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const ChatInterface = ({ isOpen, onClose }) => {
  const user = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const userSearchTimeoutRef = useRef(null);

  // Socket initialization
  useEffect(() => {
    if (!isOpen || !token) return;

    const newSocket = io(CHAT_SERVICE_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to chat service');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from chat service');
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Closing socket connection');
      newSocket.close();
    };
  }, [isOpen, token]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleFriendsOnline = ({ userIds }) => {
      setOnlineUsers(new Set(userIds));
    };

    const handleUserOnline = ({ userId }) => {
      setOnlineUsers(prev => new Set([...prev, userId]));
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    };

    const handleNewMessage = ({ message, conversationId }) => {
      console.log('📨 New message received:', message);
      
      // Update messages if we're viewing this conversation
      if (selectedConversation && (selectedConversation._id === conversationId)) {
        setMessages(prevMessages => {
          // Prevent duplicates
          const exists = prevMessages.some(msg => msg._id === message._id);
          if (exists) {
            console.log('⚠️ Duplicate message prevented');
            return prevMessages;
          }
          return [...prevMessages, message];
        });
      }

      // Update conversation list
      setConversations(prevConversations => {
        const updated = prevConversations.map(conv => {
          if (conv._id === conversationId) {
            return {
              ...conv,
              lastMessage: message,
              lastMessageAt: message.createdAt,
              // Don't increment unread if we're viewing this conversation
              unreadCount: selectedConversation?._id === conversationId ? 0 : (conv.unreadCount || 0) + 1
            };
          }
          return conv;
        });
        
        // Sort by most recent message
        return updated.sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
          return dateB - dateA;
        });
      });
    };

    const handleTypingStart = ({ conversationId, userId, user: typingUser }) => {
      if (userId !== user._id && selectedConversation?._id === conversationId) {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: typingUser,
        }));
      }
    };

    const handleTypingStop = ({ conversationId }) => {
      setTypingUsers(prev => {
        const updated = { ...prev };
        delete updated[conversationId];
        return updated;
      });
    };

    // Register all event listeners
    socket.on('friends:online', handleFriendsOnline);
    socket.on('user:online', handleUserOnline);
    socket.on('user:offline', handleUserOffline);
    socket.on('message:new', handleNewMessage);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);

    // Cleanup function
    return () => {
      socket.off('friends:online', handleFriendsOnline);
      socket.off('user:online', handleUserOnline);
      socket.off('user:offline', handleUserOffline);
      socket.off('message:new', handleNewMessage);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket, selectedConversation, user?._id]);

  // Fetch conversations on open
  useEffect(() => {
    if (isOpen && token) {
      fetchConversations();
    }
  }, [isOpen, token]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // User search debounce
  useEffect(() => {
    if (userSearchQuery.trim().length >= 2) {
      clearTimeout(userSearchTimeoutRef.current);
      userSearchTimeoutRef.current = setTimeout(() => {
        searchUsersForNewChat(userSearchQuery);
      }, 300);
    } else {
      setUserSearchResults([]);
    }

    return () => {
      if (userSearchTimeoutRef.current) {
        clearTimeout(userSearchTimeoutRef.current);
      }
    };
  }, [userSearchQuery]);

  const searchUsersForNewChat = async (query) => {
    try {
      setSearchingUsers(true);
      const response = await fetch(`${API_BASE_URL}/users/search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter(u => u._id !== user._id);
        setUserSearchResults(filtered);
      }
    } catch (error) {
      console.error('❌ Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const startNewConversation = (selectedUser) => {
    setShowNewChat(false);
    setUserSearchQuery('');
    setUserSearchResults([]);
    
    // Check if conversation already exists
    const existing = conversations.find(
      conv => conv.participant._id === selectedUser._id
    );
    
    if (existing) {
      selectConversation(existing);
      return;
    }
    
    // Create temporary conversation
    const tempConversation = {
      _id: `temp-${selectedUser._id}`,
      participant: selectedUser,
      lastMessage: null,
      unreadCount: 0,
    };
    
    setSelectedConversation(tempConversation);
    setMessages([]);
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CHAT_SERVICE_URL}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      // Ensure data is an array
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${CHAT_SERVICE_URL}/api/chat/conversations/${conversationId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setMessages(data.messages || []);
      
      // Join conversation room and mark as read
      if (socket) {
        socket.emit('conversation:join', conversationId);
        socket.emit('messages:read', { conversationId });
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = (conversation) => {
    // Leave previous conversation room
    if (selectedConversation && !selectedConversation._id.startsWith('temp-')) {
      socket?.emit('conversation:leave', selectedConversation._id);
    }
    
    setSelectedConversation(conversation);
    
    if (!conversation._id.startsWith('temp-')) {
      fetchMessages(conversation._id);
    } else {
      setMessages([]);
    }
  };

  const sendMessage = useCallback((e) => {
    // Prevent default if called from form submission
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!newMessage.trim() || !selectedConversation || !socket) return;

    console.log('📤 Sending message...');

    // Emit message via socket
    socket.emit('message:send', {
      recipientId: selectedConversation.participant._id,
      content: newMessage.trim(),
    });

    // Clear input immediately
    setNewMessage('');
    
    // Stop typing indicator
    stopTyping();
  }, [newMessage, selectedConversation, socket]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!selectedConversation || selectedConversation._id.startsWith('temp-') || !socket) return;

    // Start typing indicator
    socket.emit('typing:start', { conversationId: selectedConversation._id });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const stopTyping = () => {
    if (selectedConversation && !selectedConversation._id.startsWith('temp-') && socket) {
      socket.emit('typing:stop', { conversationId: selectedConversation._id });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    `${conv.participant.firstName} ${conv.participant.lastName}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full sm:w-[900px] h-full sm:h-[600px] bg-white dark:bg-grey-800 sm:rounded-2xl shadow-2xl flex overflow-hidden animate-slide-in">
        
        {/* Conversations Sidebar */}
        <div className={`${selectedConversation ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-80 border-r border-grey-200 dark:border-grey-700`}>
          <div className="p-4 border-b border-grey-200 dark:border-grey-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-grey-800 dark:text-grey-100">
                Messages
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewChat(true)}
                  className="p-2 rounded-full bg-primary-500 hover:bg-primary-600 transition-colors"
                  title="New conversation"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors"
                >
                  <X className="w-5 h-5 text-grey-500" />
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-grey-100 dark:bg-grey-700 border-none outline-none text-grey-700 dark:text-grey-100"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && conversations.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                <UserPlus className="w-12 h-12 text-grey-300 dark:text-grey-600 mb-3" />
                <p className="text-grey-500 dark:text-grey-400 mb-2">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
                <button
                  onClick={() => setShowNewChat(true)}
                  className="mt-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm transition-colors"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-grey-50 dark:hover:bg-grey-700 transition-colors ${
                    selectedConversation?._id === conv._id ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={conv.participant.picturePath || '/default-avatar.png'}
                      alt={conv.participant.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {onlineUsers.has(conv.participant._id) && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-grey-800" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-grey-800 dark:text-grey-100 truncate">
                        {conv.participant.firstName} {conv.participant.lastName}
                      </p>
                      {conv.lastMessage && (
                        <span className="text-xs text-grey-400">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-grey-500 dark:text-grey-400 truncate">
                        {conv.lastMessage?.content || 'No messages yet'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-bold text-white bg-primary-500 rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* New Chat Modal */}
        {showNewChat && (
          <div className="absolute inset-0 bg-white dark:bg-grey-800 z-10 flex flex-col">
            <div className="p-4 border-b border-grey-200 dark:border-grey-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-grey-800 dark:text-grey-100">
                  New Message
                </h2>
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setUserSearchQuery('');
                    setUserSearchResults([]);
                  }}
                  className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grey-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-grey-100 dark:bg-grey-700 border-none outline-none text-grey-700 dark:text-grey-100"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {searchingUsers ? (
                <div className="flex items-center justify-center h-full">
                  <Loader className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : userSearchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full px-4 text-center">
                  <Search className="w-12 h-12 text-grey-300 dark:text-grey-600 mb-3" />
                  <p className="text-grey-500 dark:text-grey-400">
                    {userSearchQuery.length < 2
                      ? 'Type at least 2 characters to search'
                      : 'No users found'}
                  </p>
                </div>
              ) : (
                userSearchResults.map((searchUser) => (
                  <button
                    key={searchUser._id}
                    onClick={() => startNewConversation(searchUser)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-grey-50 dark:hover:bg-grey-700 transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={searchUser.picturePath || '/default-avatar.png'}
                        alt={searchUser.firstName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {onlineUsers.has(searchUser._id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-grey-800" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-grey-800 dark:text-grey-100">
                        {searchUser.firstName} {searchUser.lastName}
                      </p>
                      <p className="text-sm text-grey-500 dark:text-grey-400">
                        {searchUser.Year || 'Click to start chatting'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-grey-200 dark:border-grey-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="sm:hidden p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <img
                    src={selectedConversation.participant.picturePath || '/default-avatar.png'}
                    alt={selectedConversation.participant.firstName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {onlineUsers.has(selectedConversation.participant._id) && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-grey-800" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-grey-800 dark:text-grey-100">
                    {selectedConversation.participant.firstName} {selectedConversation.participant.lastName}
                  </h3>
                  <p className="text-xs text-grey-500 dark:text-grey-400">
                    {onlineUsers.has(selectedConversation.participant._id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <button className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700">
                <MoreVertical className="w-5 h-5 text-grey-500" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-grey-400 dark:text-grey-500">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isOwn = msg.sender._id === user._id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              isOwn
                                ? 'bg-primary-500 text-white rounded-br-none'
                                : 'bg-grey-100 dark:bg-grey-700 text-grey-800 dark:text-grey-100 rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm break-words">{msg.content}</p>
                          </div>
                          <p className={`text-xs text-grey-400 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {typingUsers[selectedConversation._id] && (
                    <div className="flex items-center gap-2 text-grey-500 dark:text-grey-400">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-grey-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-grey-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-grey-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-sm">
                        {typingUsers[selectedConversation._id].firstName} is typing...
                      </span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-grey-200 dark:border-grey-700">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <button 
                  type="button"
                  className="p-2 rounded-full hover:bg-grey-100 dark:hover:bg-grey-700 transition-colors"
                >
                  <Image className="w-5 h-5 text-grey-500" />
                </button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-2 rounded-full bg-grey-100 dark:bg-grey-700 border-none outline-none text-grey-700 dark:text-grey-100"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-2 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-grey-300 dark:disabled:bg-grey-700 transition-colors disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center bg-grey-50 dark:bg-grey-900">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <Send className="w-10 h-10 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-grey-800 dark:text-grey-100 mb-2">
                Select a conversation
              </h3>
              <p className="text-grey-500 dark:text-grey-400 mb-4">
                Choose a conversation to start messaging
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @media (min-width: 640px) {
          @keyframes slide-in {
            from {
              opacity: 0;
              transform: translateX(100%) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateX(0) scale(1);
            }
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;