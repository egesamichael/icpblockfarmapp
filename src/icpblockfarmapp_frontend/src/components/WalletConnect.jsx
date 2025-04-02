import React, { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import { icpblockfarmapp_backend } from '../../../declarations/icpblockfarmapp_backend';

function WalletConnect({ onWalletConnected }) {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [savedWallet, setSavedWallet] = useState(null);

  useEffect(() => {
    // Check if user already has a connected wallet
    const checkWallet = async () => {
      try {
        const wallet = await icpblockfarmapp_backend.getUserWallet();
        if (wallet && wallet.length > 0) {
          setSavedWallet(wallet[0]);
          onWalletConnected(wallet[0]);
        }
      } catch (err) {
        console.error("Error checking wallet:", err);
      }
    };
    
    checkWallet();
  }, [onWalletConnected]);

  const handleConnect = async (e) => {
    e.preventDefault();
    setIsConnecting(true);
    setError('');
    
    try {
      // Validate wallet address format
      try {
        // This will throw if invalid
        Principal.fromText(walletAddress);
      } catch (err) {
        throw new Error('Invalid wallet address format');
      }
      
      // Save wallet to backend
      const result = await icpblockfarmapp_backend.greet("connection_test");
      console.log("Backend connection successful:", result);
      if (result) {
      await icpblockfarmapp_backend.setUserWallet(walletAddress);
      setSavedWallet(walletAddress);
      onWalletConnected(walletAddress);
      } else {
        throw new Error('Backend connection failed. Please try again.');
      }
      
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
      console.error("Wallet connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (savedWallet) {
    return (
      <div className="wallet-info">
        <p>Connected Wallet: {savedWallet.slice(0, 10)}...{savedWallet.slice(-5)}</p>
        <button 
          className="disconnect-wallet-btn"
          onClick={async () => {
            await icpblockfarmapp_backend.clearUserWallet();
            setSavedWallet(null);
            onWalletConnected(null);
          }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="wallet-connect">
      <h3>Connect Your ICP Wallet</h3>
      <p className="wallet-description">
        Connect your ICP wallet to enable premium features and subscription payments.
      </p>
      
      {error && <div className="wallet-error">{error}</div>}
      
      <form onSubmit={handleConnect} className="wallet-form">
        <input
          type="text"
          placeholder="Enter your ICP wallet address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          className="wallet-input"
          required
        />
        <button 
          type="submit" 
          className="wallet-connect-btn"
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <span className="spinner"></span> Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </button>
      </form>
      
      <p className="wallet-note">
        <small>
          Note: In playground mode, you can use any valid principal ID format.
          For testing, you can use a principal like: "2vxsx-fae"
        </small>
      </p>
    </div>
  );
}

export default WalletConnect;