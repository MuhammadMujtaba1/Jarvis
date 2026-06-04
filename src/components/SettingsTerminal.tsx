/**
 * SETTINGS TERMINAL - Integration Configuration Interface
 * High-contrast cyberpunk integration layout matching dashboard HUD style
 * 
 * DIAGNOSTIC FIX: Added cleanup for intervals, removed potential infinite loops
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { authManager, ScopeType } from '../utils/authManager';
import { 
  fetchLiveYouTubeMetrics, 
  fetchLiveGmailInbox, 
  fetchGoogleProfile 
} from '../utils/googleApiFetchers';
import './SettingsTerminal.css';

interface IntegrationNode {
  id: ScopeType;
  name: string;
  icon: string;
  description: string;
  status: 'connected' | 'disconnected';
  token?: any;
}

interface SettingsTerminalProps {
  onMetricsUpdate?: (data: any) => void;
}

const SettingsTerminal: React.FC<SettingsTerminalProps> = ({ onMetricsUpdate }) => {
  const [integrations, setIntegrations] = useState<IntegrationNode[]>([
    {
      id: 'PROFILE',
      name: 'Google Profile',
      icon: '👤',
      description: 'Core Identity & User Info',
      status: 'disconnected',
    },
    {
      id: 'YOUTUBE',
      name: 'YouTube Creator',
      icon: '📺',
      description: 'Analytics & Content Hub',
      status: 'disconnected',
    },
    {
      id: 'GMAIL',
      name: 'Gmail Automation',
      icon: '📧',
      description: 'Email Management Hub',
      status: 'disconnected',
    },
    {
      id: 'DRIVE',
      name: 'Google Drive',
      icon: '💾',
      description: 'Cloud Storage Backup',
      status: 'disconnected',
    },
  ]);

  const [loadingStates, setLoadingStates] = useState<Record<ScopeType, boolean>>({
    PROFILE: false,
    YOUTUBE: false,
    GMAIL: false,
    DRIVE: false,
  });

  const [errorMessages, setErrorMessages] = useState<Record<ScopeType, string>>({
    PROFILE: '',
    YOUTUBE: '',
    GMAIL: '',
    DRIVE: '',
  });

  const updateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Handle OAuth redirect on component mount
  useEffect(() => {
    const handleRedirect = async () => {
      const success = await authManager.handleOAuthRedirect();
      if (success) {
        updateIntegrationStates();
      }
    };
    handleRedirect();

    // Set up interval to update states and check token expirations
    // DIAGNOSTIC FIX: Added cleanup
    updateIntervalRef.current = setInterval(updateIntegrationStates, 5000);
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, []);

  // Update integration states from auth manager
  const updateIntegrationStates = useCallback(() => {
    try {
      const authStates = authManager.getAuthStates();
      
      setIntegrations(prev => prev.map(integration => ({
        ...integration,
        status: authStates[integration.id] ? 'connected' : 'disconnected',
        token: authStates[integration.id],
      })));
    } catch (e) {
      // Silently handle errors in interval
    }
  }, []);

  // Connect (initiate OAuth flow)
  const handleConnect = (scopeType: ScopeType) => {
    authManager.initiateOAuthFlow(scopeType);
  };

  // Disconnect (clear token)
  const handleDisconnect = async (scopeType: ScopeType) => {
    setLoadingStates(prev => ({ ...prev, [scopeType]: true }));
    
    try {
      await authManager.removeToken(scopeType);
      updateIntegrationStates();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessages(prev => ({ 
        ...prev, 
        [scopeType]: 'Disconnect failed: ' + errorMsg
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [scopeType]: false }));
    }
  };

  // Test connection (fetch live data)
  const handleTestConnection = async (scopeType: ScopeType) => {
    setLoadingStates(prev => ({ ...prev, [scopeType]: true }));
    setErrorMessages(prev => ({ ...prev, [scopeType]: '' }));

    try {
      const token = await authManager.getValidToken(scopeType);
      
      if (!token) {
        throw new Error('No valid token available');
      }

      let testResult: any;
      
      switch (scopeType) {
        case 'YOUTUBE':
          testResult = await fetchLiveYouTubeMetrics(token);
          break;
        case 'GMAIL':
          testResult = await fetchLiveGmailInbox(token);
          break;
        case 'PROFILE':
          testResult = await fetchGoogleProfile(token);
          break;
        case 'DRIVE':
          testResult = { connected: true };
          break;
      }

      console.log('[SettingsTerminal] ' + scopeType + ' connection test successful:', testResult);
      
      // Notify parent component of metrics update
      if (onMetricsUpdate && testResult) {
        onMetricsUpdate({
          scope: scopeType,
          data: testResult,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('[SettingsTerminal] ' + scopeType + ' connection test failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Connection test failed';
      setErrorMessages(prev => ({ 
        ...prev, 
        [scopeType]: errorMsg
      }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [scopeType]: false }));
    }
  };

  // Format expiration countdown
  const getExpirationDisplay = (scopeType: ScopeType): string => {
    if (integrations.find(i => i.id === scopeType)?.status !== 'connected') {
      return '';
    }
    return authManager.getExpirationCountdown(scopeType);
  };

  // Render integration node
  const renderIntegrationNode = (node: IntegrationNode) => {
    const isLoading = loadingStates[node.id];
    const error = errorMessages[node.id];
    const isConnected = node.status === 'connected';
    const expiration = getExpirationDisplay(node.id);

    return (
      <div 
        key={node.id} 
        className={'integration-node ' + (isConnected ? 'connected' : 'disconnected')}
      >
        <div className="node-header">
          <span className="node-icon">{node.icon}</span>
          <span className="node-name">{node.name}</span>
        </div>

        <div className="node-status">
          {isConnected ? (
            <span className="status-online">
              <span className="status-dot pulsing"></span>
              [ONLINE: CONNECTED]
            </span>
          ) : (
            <span className="status-offline">
              <span className="status-dot blink"></span>
              [OFFLINE: ACCESS RESTRICTED]
            </span>
          )}
        </div>

        <div className="node-description">
          {node.description}
        </div>

        {isConnected && expiration && (
          <div className="node-expiration">
            TOKEN EXPIRES: {expiration}
          </div>
        )}

        {error && (
          <div className="node-error">
            ERROR: {error}
          </div>
        )}

        <div className="node-actions">
          {isConnected ? (
            <>
              <button 
                className="btn btn-test"
                onClick={() => handleTestConnection(node.id)}
                disabled={isLoading}
              >
                {isLoading ? 'TESTING...' : 'TEST CONNECTION'}
              </button>
              <button 
                className="btn btn-disconnect"
                onClick={() => handleDisconnect(node.id)}
                disabled={isLoading}
              >
                DISCONNECT
              </button>
            </>
          ) : (
            <button 
              className="btn btn-connect"
              onClick={() => handleConnect(node.id)}
              disabled={isLoading}
            >
              <span className="btn-glow"></span>
              CONNECT API
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="settings-terminal">
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">⚙️</span>
          <span>INTEGRATIONS &amp; CONNECTIONS</span>
        </div>
        <div className="terminal-subtitle">
          SECURE API ACCESS MANAGEMENT
        </div>
      </div>

      <div className="integration-grid">
        {integrations.map(renderIntegrationNode)}
      </div>

      <div className="terminal-footer">
        <div className="security-notice">
          <span className="shield-icon">🛡️</span>
          All tokens securely stored in IndexedDB (Never LocalStorage)
        </div>
        <div className="oauth-info">
          Using OAuth2 Implicit Flow | Tokens expire automatically
        </div>
      </div>
    </div>
  );
};

export default SettingsTerminal;