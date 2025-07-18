import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import CreateChannelModal from './CreateChannelModal';
import CreateGroupChatModal from './CreateGroupChatModal';
import UserListModal from './UserListModal';
import { Plus, Users, LogOut } from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose }) => {
  const { 
    currentUser, 
    channels, 
    users, 
    currentChannelId, 
    currentDirectUserId,
    unreadChannels,
    setCurrentChannelId, 
    setCurrentDirectUserId,
    joinChannel,
    logout
  } = useChat();

  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [isCreateGroupChatModalOpen, setIsCreateGroupChatModalOpen] = useState(false);
  const [isUserListModalOpen, setIsUserListModalOpen] = useState(false);

  const handleSelectChannel = (channelId: number) => {
    setCurrentChannelId(channelId);
    if (window.innerWidth < 768) {
      onMobileClose();
    }
  };

  const handleSelectUser = (userId: number) => {
    setCurrentDirectUserId(userId);
    if (window.innerWidth < 768) {
      onMobileClose();
    }
  };

  // Get online users for DM list
  const onlineUsers = users.filter(user => user.id !== currentUser?.id);

  const sidebarClasses = `
    ${isMobileOpen ? 'fixed z-30 inset-0 md:relative' : 'hidden md:flex'} 
    md:flex-col md:w-64 bg-background text-foreground h-full border-r border-gray-800 flex-shrink-0
  `;

  return (
    <>
      <div id="sidebar" className={sidebarClasses}>
        {/* App header */}
        <div className="px-4 h-16 flex items-center justify-between border-b border-gray-800">
          <h1 className="text-xl font-semibold text-primary">ConvoCrave</h1>
          {/* User menu trigger */}
          <div id="userMenuTrigger" className="relative cursor-pointer" onClick={logout}>
            <i className="ri-more-2-fill text-muted-foreground hover:text-primary text-xl"></i>
          </div>
        </div>

        {/* User profile section */}
        <div className="p-4 border-b border-gray-800">
          {/* User status */}
          <div className="flex items-center">
            <div className="relative">
              <img 
                src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username}`}
                alt="User avatar" 
                className="w-10 h-10 rounded-full border-2 border-primary"
              />
              <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500"></span>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium">
                {currentUser?.displayName || currentUser?.username}
              </div>
              <div className="text-xs text-muted-foreground flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Channels section */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channels</h2>
            <button 
              className="text-muted-foreground hover:text-primary text-xs"
              onClick={() => setIsCreateChannelModalOpen(true)}
            >
              <i className="ri-add-line text-lg"></i>
            </button>
          </div>
          
          {/* Channel list */}
          <div className="mt-2 space-y-1 custom-scrollbar max-h-40 overflow-y-auto">
            {channels.map(channel => {
              const isUnread = unreadChannels.includes(channel.id);
              return (
                <div 
                  key={channel.id}
                  data-channel-id={channel.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted ${
                    currentChannelId === channel.id ? 'bg-primary/20' : ''
                  }`}
                  onClick={() => handleSelectChannel(channel.id)}
                >
                  <div className="flex items-center">
                    <span className="text-sm font-medium"># {channel.name}</span>
                    {channel.isGroupChat && (
                      <Users className="h-3 w-3 ml-1 text-muted-foreground" />
                    )}
                  </div>
                  {isUnread && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-2 space-y-1">
            <button
              className="w-full flex items-center justify-center mt-2 px-2 py-1.5 rounded-md border border-dashed border-muted-foreground/50 text-muted-foreground hover:text-primary hover:border-primary"
              onClick={() => setIsCreateChannelModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="text-xs">New Channel</span>
            </button>
          </div>
        </div>

        {/* Direct messages section */}
        <div className="px-4 py-2 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Direct Messages</h2>
            <div className="flex space-x-1">
              <button 
                className="text-muted-foreground hover:text-primary text-xs p-1 rounded hover:bg-muted"
                onClick={() => setIsCreateGroupChatModalOpen(true)}
                title="Create Group Chat"
              >
                <Users className="h-4 w-4" />
              </button>
              <button 
                className="text-muted-foreground hover:text-primary text-xs p-1 rounded hover:bg-muted"
                onClick={() => setIsUserListModalOpen(true)}
                title="Direct Message"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* DM list */}
          <div className="mt-2 space-y-1 custom-scrollbar max-h-60 overflow-y-auto">
            {onlineUsers.map(user => {
              const statusColor = user.status === 'online' ? 'bg-green-500' : 
                                  user.status === 'away' ? 'bg-amber-500' : 'bg-gray-500';
              return (
                <div 
                  key={user.id}
                  className={`flex items-center px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted ${
                    currentDirectUserId === user.id ? 'bg-primary/20' : ''
                  }`}
                  onClick={() => handleSelectUser(user.id)}
                >
                  <div className="relative">
                    <span className={`w-2 h-2 absolute right-0 bottom-0 rounded-full ${statusColor}`}></span>
                    <img 
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                      alt={user.displayName || user.username} 
                      className="w-6 h-6 rounded-full"
                    />
                  </div>
                  <span className="ml-2 text-sm">{user.displayName || user.username}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <CreateChannelModal 
        isOpen={isCreateChannelModalOpen} 
        onClose={() => setIsCreateChannelModalOpen(false)} 
      />
      
      <UserListModal 
        isOpen={isUserListModalOpen} 
        onClose={() => setIsUserListModalOpen(false)} 
        onSelectUser={handleSelectUser}
      />
      
      <CreateGroupChatModal
        isOpen={isCreateGroupChatModalOpen}
        onClose={() => setIsCreateGroupChatModalOpen(false)}
      />
    </>
  );
};

export default Sidebar;
