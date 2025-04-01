import { AuthClient } from "@dfinity/auth-client";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

function Auth() {
  const navigate = useNavigate();
  const [authClient, setAuthClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const client = await AuthClient.create();
        setAuthClient(client);
        
        // Check if already authenticated
        const isAuthenticated = await client.isAuthenticated();
        if (isAuthenticated) {
          navigate('/');
        }
      } catch (error) {
        console.error("Error initializing auth client:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, [navigate]);

  const handleLogin = async () => {
    if (!authClient) return;
    
    await authClient.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: () => {
        navigate('/');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading authentication...</p>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <h1>Welcome to Farm Advisor</h1>
      <p>Please login with Internet Identity to continue</p>
      <button onClick={handleLogin} className="login-button">
        Login with Internet Identity
      </button>
    </div>
  );
}

export default Auth;