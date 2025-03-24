import React, { useState, useEffect } from 'react';
import { useChat } from '@/hooks/use-chat';
import { useLocation } from '@/hooks/use-location';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated, login } = useChat();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Generate avatar if not provided
      const finalAvatar = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

      // Send auth directly through websocket
      login(username, finalAvatar);

      // Navigate to chat
      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Join ChatSync
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-md sm:rounded-lg sm:px-10 border border-border">
          {error && (
            <div className="mb-4 p-2 bg-destructive/20 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground">
                Username
              </label>
              <div className="mt-1">
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-foreground">
                Avatar URL (optional)
              </label>
              <div className="mt-1">
                <Input
                  id="avatar"
                  name="avatar"
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Leave empty for random avatar"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Joining...' : 'Join Chat'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;