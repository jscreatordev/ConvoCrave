import React, { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { Badge } from '@/components/ui/badge';
import { X, Users } from 'lucide-react';

interface CreateGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupChatModal: React.FC<CreateGroupChatModalProps> = ({ isOpen, onClose }) => {
  const { users, createGroupChat, currentUser } = useChat();
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Filter out the current user and already selected users
  const filteredUsers = users.filter(user => 
    user.id !== currentUser?.id && 
    !selectedUsers.includes(user.id) &&
    (user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase())))
  );
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setDescription('');
      setSelectedUsers([]);
      setSearchTerm('');
      setError('');
    }
  }, [isOpen]);

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => [...prev, userId]);
    setSearchTerm('');
  };

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers(prev => prev.filter(id => id !== userId));
  };

  const getUserById = (id: number) => {
    return users.find(user => user.id === id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }
    
    if (selectedUsers.length === 0) {
      setError('Please select at least one user for the group chat');
      return;
    }
    
    // Validate group name format
    if (!/^[a-z0-9-_]+$/.test(groupName)) {
      setError('Group name can only contain lowercase letters, numbers, hyphens, and underscores');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      createGroupChat(groupName, description, selectedUsers);
      
      // Reset form
      setGroupName('');
      setDescription('');
      setSelectedUsers([]);
      
      // Close modal
      onClose();
    } catch (err) {
      setError('Failed to create group chat. Please try again.');
      console.error('Create group chat error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl text-black">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-black">Create Group Chat</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1 text-black">Group Name</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                <Users className="h-4 w-4" />
              </span>
              <input 
                type="text" 
                id="groupName" 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value.toLowerCase())}
                className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 border p-2 focus:border-primary focus:ring-primary sm:text-sm text-black"
                placeholder="e.g. project-team" 
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="groupDescription" className="block text-sm font-medium text-gray-700 mb-1 text-black">Description (optional)</label>
            <input 
              type="text" 
              id="groupDescription" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-md border-gray-300 border p-2 focus:border-primary focus:ring-primary sm:text-sm text-black"
              placeholder="What's this group about?"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-black">Add Members</label>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-md border-gray-300 border p-2 focus:border-primary focus:ring-primary sm:text-sm text-black mb-2"
              placeholder="Search users..."
            />
            
            {/* Selected users */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedUsers.map(userId => {
                  const user = getUserById(userId);
                  return (
                    <Badge key={userId} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                      {user?.displayName || user?.username}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveUser(userId)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
            
            {/* User search results */}
            {searchTerm && (
              <div className="mt-1 max-h-48 overflow-y-auto border border-gray-300 rounded-md">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <div 
                      key={user.id} 
                      className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                      onClick={() => handleSelectUser(user.id)}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-2 bg-gray-200">
                        {user.avatar && (
                          <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{user.displayName || user.username}</div>
                        {user.displayName && <div className="text-xs text-gray-500">@{user.username}</div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500 text-center">No users found</div>
                )}
              </div>
            )}
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
              disabled={isSubmitting || selectedUsers.length === 0}
            >
              {isSubmitting ? 'Creating...' : 'Create Group Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupChatModal;