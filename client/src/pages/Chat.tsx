import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'wouter';
import { useChat } from '@/context/ChatContext';
import Sidebar from '@/components/chat/Sidebar';
import MessageList from '@/components/chat/MessageList';
import MessageInput from '@/components/chat/MessageInput';
import ChatHeader from '@/components/chat/ChatHeader';

const Chat: React.FC = () => {
  const { isAuthenticated } = useChat();
  const [location, navigate] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileSidebarOpen} 
        onMobileClose={() => setIsMobileSidebarOpen(false)} 
      />

      {/* Mobile sidebar toggle */}
      <div className="md:hidden absolute top-4 left-4 z-20">
        <button 
          className="p-2 rounded-md bg-dark text-white"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        >
          <i className="ri-menu-line text-xl"></i>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <ChatHeader />
        <MessageList />
        <MessageInput />
      </div>
    </div>
  );
};

export default Chat;
