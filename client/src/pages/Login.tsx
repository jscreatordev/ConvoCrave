import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useChat } from '@/lib/hooks/useChat';
import { apiRequest } from '@/lib/api';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
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

    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiRequest('POST', '/api/auth/register', { 
        username, 
        displayName 
      });
      const userData = await response.json();

      login(userData.id);
      navigate('/');
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground">
              Username
            </label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
              Display Name
            </label>
            <div className="mt-1">
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;