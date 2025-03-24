import React, { useState, useRef } from 'react';
import { useChat } from '@/context/ChatContext';

const MessageInput: React.FC = () => {
  const { 
    currentChannelId, 
    currentDirectUserId, 
    sendMessage 
  } = useChat();
  
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLDivElement>(null);

  const isActive = currentChannelId !== null || currentDirectUserId !== null;
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!isActive || (!message.trim() && !imagePreview)) return;
    
    sendMessage(message, imagePreview || undefined);
    
    // Clear inputs
    setMessage('');
    setImagePreview(null);
    if (messageInputRef.current) {
      messageInputRef.current.innerText = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleInputChange = (e: React.FormEvent<HTMLDivElement>) => {
    setMessage(e.currentTarget.innerText);
  };

  const targetName = currentChannelId 
    ? `#${currentChannelId}`
    : currentDirectUserId 
      ? 'user'
      : '';

  return (
    <div className="border-t border-gray-800 p-4 bg-background">
      <div className="flex items-center">
        <div className="relative flex-1">
          <div className="border border-gray-700 rounded-lg p-3 bg-muted flex items-end space-x-2">
            {/* Text input area */}
            <div className="flex-1">
              <div 
                id="messageInput" 
                ref={messageInputRef}
                className="outline-none w-full min-h-[60px] max-h-32 overflow-auto custom-scrollbar text-foreground" 
                contentEditable={isActive}
                placeholder={isActive ? `Message ${targetName}` : 'Select a channel or user to start messaging'}
                onKeyDown={handleKeyDown}
                onInput={handleInputChange}
              ></div>
              
              {/* Image preview */}
              {imagePreview && (
                <div className="mt-2 relative">
                  <img 
                    src={imagePreview} 
                    alt="Image preview" 
                    className="max-h-[200px] object-contain rounded-md border border-gray-700" 
                  />
                  <button 
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-75"
                  >
                    <i className="ri-close-line"></i>
                  </button>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {/* Image upload button */}
              <button 
                onClick={() => imageInputRef.current?.click()} 
                className="text-muted-foreground hover:text-primary p-2 rounded-full" 
                title="Upload image"
                disabled={!isActive}
              >
                <i className="ri-image-line text-xl"></i>
                <input 
                  ref={imageInputRef}
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                />
              </button>
              
              {/* Send button */}
              <button 
                onClick={handleSendMessage}
                className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isActive || (!message.trim() && !imagePreview)}
              >
                <i className="ri-send-plane-fill text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
