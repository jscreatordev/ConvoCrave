import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '@/context/ChatContext';
import ImagePreviewModal from './ImagePreviewModal';
import { format } from 'date-fns';

const MessageList: React.FC = () => {
  const { 
    currentChannelId, 
    currentDirectUserId, 
    channelMessages, 
    directMessages,
    channels,
    users,
    currentUser
  } = useChat();

  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine current messages based on whether we're viewing a channel or direct messages
  const currentMessages = currentChannelId 
    ? (channelMessages[currentChannelId] || [])
    : currentDirectUserId 
      ? (directMessages[currentDirectUserId] || [])
      : [];

  const currentName = currentChannelId 
    ? channels.find(c => c.id === currentChannelId)?.name
    : currentDirectUserId
      ? users.find(u => u.id === currentDirectUserId)?.displayName || 
        users.find(u => u.id === currentDirectUserId)?.username
      : '';

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleImageClick = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setIsImagePreviewOpen(true);
  };

  const formatMessageTime = (date: Date) => {
    return format(new Date(date), 'h:mm a');
  };

  if (!currentChannelId && !currentDirectUserId) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p>Select a channel or direct message to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar" id="messageContainer">
        <div className="space-y-4">
          {/* System message */}
          <div className="flex justify-center my-4">
            <div className="px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-500">
              {currentChannelId
                ? `This is the start of the #${currentName} channel`
                : `This is the start of your conversation with ${currentName}`}
            </div>
          </div>

          {/* Messages */}
          {currentMessages.map((message) => {
            const isCurrentUser = message.senderId === currentUser?.id;
            
            return (
              <div key={message.id} className="flex items-start">
                <img 
                  src={message.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.sender?.username}`} 
                  alt={message.sender?.displayName || message.sender?.username} 
                  className="w-10 h-10 rounded-full mr-3 mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium">
                      {message.sender?.displayName || message.sender?.username}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {message.createdAt ? formatMessageTime(message.createdAt) : ''}
                    </span>
                  </div>
                  {message.content && (
                    <div className="mt-1 text-gray-800">
                      {message.content}
                    </div>
                  )}
                  {message.image && (
                    <div className="mt-2">
                      <img 
                        src={message.image} 
                        alt="Uploaded image" 
                        className="rounded-lg border border-gray-200 max-w-sm max-h-60 object-cover cursor-pointer"
                        onClick={() => handleImageClick(message.image!)}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* End of messages marker for scrolling */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ImagePreviewModal 
        isOpen={isImagePreviewOpen}
        onClose={() => setIsImagePreviewOpen(false)}
        imageUrl={previewImage}
      />
    </>
  );
};

export default MessageList;
