import { AuthClient } from "@dfinity/auth-client";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
// Fix the image import path to use a relative path that Vite can resolve
import backgroundImage from './assets/071624.RSS_.Scalable-Technological-S.webp';

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
    <div 
      className="login-screen"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* Dark overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)', // Black with 50% opacity
          zIndex: 1,
        }}
      />
      
      {/* Content positioned above the overlay */}
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', color: 'white', alignContent: 'center', justifyContent: 'center' }}>
        <h1>Welcome to Farm Advisor</h1>
        <p>Please login with Internet Identity to continue</p>
       <div style={{paddingLeft: '70px'}}><button onClick={handleLogin} className="login-button" style={{ marginLeft: '30px' }}>
          Login with Internet Identity
        </button>
        </div>
      </div>
    </div>
  );
}

export default Auth;