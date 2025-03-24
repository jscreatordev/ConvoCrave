import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "wouter";
import { useChat } from "@/context/ChatContext";
import { apiRequest } from "@/lib/queryClient";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated, login } = useChat();
  const [location, navigate] = useLocation();

  // Redirect to chat if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (isRegistering && !displayName.trim()) {
      setError("Display name is required for registration");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const endpoint = isRegistering ? "/api/auth/register" : "/api/auth/login";
      const data = isRegistering ? { username, displayName } : { username };

      const response = await apiRequest("POST", endpoint, data);
      const userData = await response.json();

      // Login with socket
      login(userData.id);

      // Navigate to chat
      navigate("/");
    } catch (err) {
      console.error("Auth error:", err);
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          {isRegistering ? "Create your account" : "Sign in to ConvoCrave"}
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
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground"
              >
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

            {isRegistering && (
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-foreground"
                >
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
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {isLoading
                  ? "Processing..."
                  : isRegistering
                    ? "Register"
                    : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">
                  {isRegistering
                    ? "Already have an account?"
                    : "SIGNING IN BUGGED. CREATE A ACCOUNT"}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="w-full inline-flex justify-center py-2 px-4 border border-border rounded-md shadow-sm bg-secondary text-sm font-medium text-secondary-foreground hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isRegistering ? "Sign in instead" : "Create new account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
