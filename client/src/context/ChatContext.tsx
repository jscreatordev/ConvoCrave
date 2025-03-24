import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { chatSocket } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'wouter';

interface User {
  id: number;
  username: string;
  displayName?: string;
  avatar?: string;
  status: string;
  title?: string;
}

interface Channel {
  id: number;
  name: string;
  description?: string;
  createdById: number;
}

interface Message {
  id: number;
  content?: string;
  image?: string;
  channelId?: number;
  senderId: number;
  receiverId?: number;
  createdAt: Date;
  sender?: User;
}

interface ChatContextType {
  currentUser: User | null;
  users: User[];
  channels: Channel[];
  channelMessages: Record<number, Message[]>;
  directMessages: Record<number, Message[]>;
  currentChannelId: number | null;
  currentDirectUserId: number | null;
  setCurrentChannelId: (id: number | null) => void;
  setCurrentDirectUserId: (id: number | null) => void;
  sendMessage: (content: string, image?: string) => void;
  createChannel: (name: string, description: string) => void;
  isAuthenticated: boolean;
  login: (userId: number) => void;
  logout: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelMessages, setChannelMessages] = useState<Record<number, Message[]>>({});
  const [directMessages, setDirectMessages] = useState<Record<number, Message[]>>({});
  const [currentChannelId, setCurrentChannelId] = useState<number | null>(null);
  const [currentDirectUserId, setCurrentDirectUserId] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const { toast } = useToast();
  const [location, navigate] = useLocation();

  useEffect(() => {
    // Try to restore session from localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        login(user.id);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  useEffect(() => {
    // Setup socket event handlers
    chatSocket.on('auth_success', handleAuthSuccess);
    chatSocket.on('auth_error', handleAuthError);
    chatSocket.on('users_list', handleUsersList);
    chatSocket.on('channels_list', handleChannelsList);
    chatSocket.on('channel_messages', handleChannelMessages);
    chatSocket.on('direct_messages', handleDirectMessages);
    chatSocket.on('channel_message', handleNewChannelMessage);
    chatSocket.on('direct_message', handleNewDirectMessage);
    chatSocket.on('user_status', handleUserStatus);
    chatSocket.on('new_channel', handleNewChannel);
    chatSocket.on('error', handleError);
    chatSocket.on('disconnect', handleDisconnect);
    
    return () => {
      // Clean up event handlers on unmount
      chatSocket.off('auth_success');
      chatSocket.off('auth_error');
      chatSocket.off('users_list');
      chatSocket.off('channels_list');
      chatSocket.off('channel_messages');
      chatSocket.off('direct_messages');
      chatSocket.off('channel_message');
      chatSocket.off('direct_message');
      chatSocket.off('user_status');
      chatSocket.off('new_channel');
      chatSocket.off('error');
      chatSocket.off('disconnect');
    };
  }, []);

  // When currentChannelId changes, fetch messages for that channel
  useEffect(() => {
    if (currentChannelId && isAuthenticated) {
      chatSocket.fetchChannelMessages(currentChannelId);
      setCurrentDirectUserId(null); // Reset direct message selection
    }
  }, [currentChannelId, isAuthenticated]);

  // When currentDirectUserId changes, fetch messages for that user
  useEffect(() => {
    if (currentDirectUserId && isAuthenticated) {
      chatSocket.fetchDirectMessages(currentDirectUserId);
      setCurrentChannelId(null); // Reset channel selection
    }
  }, [currentDirectUserId, isAuthenticated]);

  // Socket event handlers
  const handleAuthSuccess = (data: any) => {
    setCurrentUser(data.user);
    setIsAuthenticated(true);
    
    // Save user to localStorage for session persistence
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    
    toast({
      title: "Connected!",
      description: "Successfully connected to chat server",
    });
    
    // Default to general channel if available
    if (channels.length > 0) {
      const generalChannel = channels.find(c => c.name === 'general');
      if (generalChannel) {
        setCurrentChannelId(generalChannel.id);
      } else {
        setCurrentChannelId(channels[0].id);
      }
    }
  };

  const handleAuthError = (data: any) => {
    toast({
      title: "Authentication Error",
      description: data.message || "Failed to authenticate",
      variant: "destructive",
    });
    
    logout();
  };

  const handleUsersList = (data: any) => {
    setUsers(data.users);
  };

  const handleChannelsList = (data: any) => {
    setChannels(data.channels);
    
    // If no current channel set, default to first one
    if (!currentChannelId && data.channels.length > 0) {
      const generalChannel = data.channels.find((c: Channel) => c.name === 'general');
      if (generalChannel) {
        setCurrentChannelId(generalChannel.id);
      } else {
        setCurrentChannelId(data.channels[0].id);
      }
    }
  };

  const handleChannelMessages = (data: any) => {
    setChannelMessages(prev => ({
      ...prev,
      [data.channelId]: data.messages
    }));
  };

  const handleDirectMessages = (data: any) => {
    setDirectMessages(prev => ({
      ...prev,
      [data.userId]: data.messages
    }));
  };

  const handleNewChannelMessage = (data: any) => {
    const { message, channelId } = data;
    
    // Add to existing messages for this channel
    setChannelMessages(prev => {
      const existing = prev[channelId] || [];
      return {
        ...prev,
        [channelId]: [...existing, message]
      };
    });
    
    // Show notification if not in the current channel
    if (currentChannelId !== channelId && message.senderId !== currentUser?.id) {
      const channel = channels.find(c => c.id === channelId);
      toast({
        title: `New message in #${channel?.name || 'channel'}`,
        description: message.content?.substring(0, 50) || 'New message',
      });
    }
  };

  const handleNewDirectMessage = (data: any) => {
    const { message } = data;
    const otherUserId = message.senderId === currentUser?.id ? message.receiverId : message.senderId;
    
    if (!otherUserId) return;
    
    // Add to existing messages for this user
    setDirectMessages(prev => {
      const existing = prev[otherUserId] || [];
      return {
        ...prev,
        [otherUserId]: [...existing, message]
      };
    });
    
    // Show notification if not in the current direct message thread
    if (currentDirectUserId !== otherUserId && message.senderId !== currentUser?.id) {
      const user = users.find(u => u.id === message.senderId);
      toast({
        title: `New message from ${user?.displayName || user?.username || 'User'}`,
        description: message.content?.substring(0, 50) || 'New message',
      });
    }
  };

  const handleUserStatus = (data: any) => {
    setUsers(prev => prev.map(user => {
      if (user.id === data.userId) {
        return { ...user, status: data.status };
      }
      return user;
    }));
  };

  const handleNewChannel = (data: any) => {
    setChannels(prev => [...prev, data.channel]);
  };

  const handleError = (data: any) => {
    toast({
      title: "Error",
      description: data.message || "An error occurred",
      variant: "destructive",
    });
  };

  const handleDisconnect = () => {
    toast({
      title: "Disconnected",
      description: "Lost connection to server. Reconnecting...",
      variant: "destructive",
    });
  };

  // Actions
  const login = (userId: number) => {
    chatSocket.connect(userId);
  };

  const logout = () => {
    chatSocket.disconnect();
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const sendMessage = (content: string, image?: string) => {
    if (!isAuthenticated) return;
    
    if (currentChannelId) {
      chatSocket.sendMessage(content, image, currentChannelId);
    } else if (currentDirectUserId) {
      chatSocket.sendMessage(content, image, undefined, currentDirectUserId);
    }
  };

  const createChannel = (name: string, description: string) => {
    if (!isAuthenticated) return;
    
    chatSocket.createChannel(name, description);
  };

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        users,
        channels,
        channelMessages,
        directMessages,
        currentChannelId,
        currentDirectUserId,
        setCurrentChannelId,
        setCurrentDirectUserId,
        sendMessage,
        createChannel,
        isAuthenticated,
        login,
        logout
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
