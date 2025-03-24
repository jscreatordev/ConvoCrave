import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { X, Users } from 'lucide-react';
import { User } from '@shared/schema';

interface CreateGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupChatModal: React.FC<CreateGroupChatModalProps> = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket, users } = useChat();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      socket?.send(JSON.stringify({
        type: 'create_group_chat',
        name: groupName,
        description,
        memberIds: selectedUsers.map(u => u.id)
      }));

      onClose();
    } catch (err) {
      setError('Failed to create group chat');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserSelection = (user: User) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

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
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                <Users className="h-4 w-4" />
              </span>
              <input 
                type="text" 
                id="groupName" 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value.toLowerCase())}
                className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 border p-2 focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="e.g. project-team" 
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block w-full rounded-md border-gray-300 border p-2 focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Group description"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Members</label>
            <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
              {users.map(user => (
                <div 
                  key={user.id} 
                  className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleUserSelection(user)}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.some(u => u.id === user.id)}
                    onChange={() => {}}
                    className="h-4 w-4 text-primary border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700">{user.displayName}</p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                  </div>
                </div>
              ))}
            </div>
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