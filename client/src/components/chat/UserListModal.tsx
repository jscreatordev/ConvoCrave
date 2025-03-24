import React, { useState, useMemo } from 'react';
import { useChat } from '@/context/ChatContext';

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUser: (userId: number) => void;
}

const UserListModal: React.FC<UserListModalProps> = ({ isOpen, onClose, onSelectUser }) => {
  const { users, currentUser } = useChat();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out current user and filter by search query
  const filteredUsers = useMemo(() => {
    return users.filter(user => 
      user.id !== currentUser?.id && 
      (user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       user.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, currentUser, searchQuery]);

  const handleUserSelect = (userId: number) => {
    onSelectUser(userId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Start Direct Message</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>
        
        <div className="mb-4">
          <input 
            type="text" 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border-gray-300 border p-2 focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>
        
        <div className="mt-4 max-h-60 overflow-y-auto custom-scrollbar">
          {filteredUsers.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredUsers.map(user => {
                const statusColor = user.status === 'online' ? 'bg-success' : 
                                   user.status === 'away' ? 'bg-warning' : 'bg-gray-500';
                
                return (
                  <li 
                    key={user.id}
                    className="py-2 flex items-center hover:bg-gray-50 cursor-pointer rounded px-2"
                    onClick={() => handleUserSelect(user.id)}
                  >
                    <div className="relative">
                      <img 
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                        alt={user.displayName || user.username} 
                        className="w-10 h-10 rounded-full"
                      />
                      <span className={`w-3 h-3 rounded-full ${statusColor} absolute bottom-0 right-0 border-2 border-white`}></span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{user.displayName || user.username}</p>
                      <p className="text-sm text-gray-500">{user.title || 'User'}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="py-4 text-center text-gray-500">
              {searchQuery ? 'No users found matching your search' : 'No other users available'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListModal;
