import React from 'react';
import { useChat } from '@/context/ChatContext';

const ChatHeader: React.FC = () => {
  const { 
    currentChannelId, 
    currentDirectUserId, 
    channels, 
    users 
  } = useChat();

  const getCurrentName = () => {
    if (currentChannelId) {
      const channel = channels.find(c => c.id === currentChannelId);
      return `# ${channel?.name || ''}`;
    } else if (currentDirectUserId) {
      const user = users.find(u => u.id === currentDirectUserId);
      return user?.displayName || user?.username || '';
    }
    return '';
  };

  const getMembers = () => {
    if (currentChannelId) {
      // For simplicity, we're just showing a placeholder
      // In a real app, you'd want to query the number of members in this channel
      return `${Math.floor(Math.random() * 20) + 5} members`;
    }
    return '';
  };

  return (
    <div className="h-16 border-b border-gray-800 flex items-center justify-between px-4 md:px-6 bg-background z-10">
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-foreground">{getCurrentName()}</h2>
        <span className="ml-2 text-muted-foreground text-sm hidden md:inline">{getMembers()}</span>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-2 text-muted-foreground hover:text-primary rounded-full">
          <i className="ri-user-add-line"></i>
        </button>
        <button className="p-2 text-muted-foreground hover:text-primary rounded-full">
          <i className="ri-information-line"></i>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
