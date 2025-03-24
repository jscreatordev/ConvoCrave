import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ isOpen, onClose }) => {
  const { createChannel } = useChat();
  
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!channelName.trim()) {
      setError('Channel name is required');
      return;
    }
    
    // Validate channel name format
    if (!/^[a-z0-9-_]+$/.test(channelName)) {
      setError('Channel name can only contain lowercase letters, numbers, hyphens, and underscores');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      createChannel(channelName, description);
      
      // Reset form
      setChannelName('');
      setDescription('');
      
      // Close modal
      onClose();
    } catch (err) {
      setError('Failed to create channel. Please try again.');
      console.error('Create channel error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl text-black">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-black">Create Channel</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="channelName" className="block text-sm font-medium text-gray-700 mb-1 text-black">Channel Name</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                #
              </span>
              <input 
                type="text" 
                id="channelName" 
                value={channelName}
                onChange={(e) => setChannelName(e.target.value.toLowerCase())}
                className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 border p-2 focus:border-primary focus:ring-primary sm:text-sm text-black"
                placeholder="e.g. design-team" 
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="channelDescription" className="block text-sm font-medium text-gray-700 mb-1 text-black">Description (optional)</label>
            <input 
              type="text" 
              id="channelDescription" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-md border-gray-300 border p-2 focus:border-primary focus:ring-primary sm:text-sm text-black"
              placeholder="What's this channel about?"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
