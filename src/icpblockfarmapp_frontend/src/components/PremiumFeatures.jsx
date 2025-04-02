import React, { useState } from 'react';
import { icpblockfarmapp_backend } from '../../../declarations/icpblockfarmapp_backend';
import WalletConnect from './WalletConnect';


function PremiumFeatures({ onSubscribe, userSubscription }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionError, setTransactionError] = useState('');
  const [connectedWallet, setConnectedWallet] = useState(null);
  
  const subscriptionPlans = [
    { 
      id: 'basic', 
      name: 'Basic', 
      price: '1 ICP', 
      period: 'month', 
      features: [
        'Detailed Disease Alerts',
        'Market Price Notifications',
        'Basic Weather Forecast'
      ] 
    }
    
  ];

  const handleSubscribe = async (planId) => {
    if (!connectedWallet) {
      setTransactionError('Please connect your wallet first to subscribe.');
      return;
    }
    
    setIsProcessing(true);
    setTransactionError('');
    
    try {
      const result = await icpblockfarmapp_backend.processSubscription(planId);
      
      if (result.success) {
        onSubscribe(planId);
      } else {
        setTransactionError(result.message || 'Transaction failed. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setTransactionError('Error processing payment. Please check your ICP balance and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWalletConnected = (walletAddress) => {
    setConnectedWallet(walletAddress);
    setTransactionError(''); // Clear any previous errors when wallet is connected
  };

  return (
    <div className="premium-features">
      <h2>Premium Features</h2>
      <p className="premium-description">
        Upgrade your farming experience with premium features powered by ICP tokens.
        Manage your subscription directly on the blockchain for full transparency.
      </p>
      
      {/* Wallet Connection Section */}
      <div className="wallet-section">
        <WalletConnect onWalletConnected={handleWalletConnected} />
      </div>
      
      {transactionError && (
        <div className="transaction-error">
          {transactionError}
        </div>
      )}
      
      <div className="subscription-plans">
        {subscriptionPlans.map(plan => (
          <div key={plan.id} className={`plan-card ${userSubscription === plan.id ? 'active-plan' : ''}`}>
            <h3>{plan.name}</h3>
            <div className="plan-price">{plan.price}</div>
            <div className="plan-period">per {plan.period}</div>
            
            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <span className="feature-icon">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            
            {userSubscription === plan.id ? (
              <button className="current-plan-btn" disabled>
                Current Plan
              </button>
            ) : (
              <button 
                className="subscribe-btn" 
                onClick={() => handleSubscribe(plan.id)}
                disabled={isProcessing || !connectedWallet}
                title={!connectedWallet ? "Connect wallet first" : ""}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner"></span> Processing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="blockchain-info">
        <p>
          <strong>Blockchain Powered:</strong> All subscriptions are processed on the 
          Internet Computer blockchain for maximum security and transparency.
        </p>
      </div>
    </div>
  );
}

export default PremiumFeatures;