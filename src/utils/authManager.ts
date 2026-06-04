/**
 * AUTH MANAGER - Secure Client-Side OAuth2 Token Management
 * Handles Google OAuth2 implicit flow with secure IndexedDB token storage
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
const OAUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

// Scope mappings for different Google APIs
export const OAUTH_SCOPES = {
  PROFILE: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
  YOUTUBE: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload',
  GMAIL: 'https://www.googleapis.com/auth/gmail.modify',
  DRIVE: 'https://www.googleapis.com/auth/drive.file',
} as const;

export type ScopeType = keyof typeof OAUTH_SCOPES;

// ============================================================================
// TOKEN STORAGE TYPES
// ============================================================================

export interface OAuthToken {
  accessToken: string;
  expiresAt: number;
  scope: string;
  tokenType: string;
  createdAt: number;
}

export interface AuthState {
  PROFILE: OAuthToken | null;
  YOUTUBE: OAuthToken | null;
  GMAIL: OAuthToken | null;
  DRIVE: OAuthToken | null;
}

// ============================================================================
// AUTH MANAGER CLASS
// ============================================================================

export class AuthManager {
  private static instance: AuthManager | null = null;
  private tokenCache: Map<ScopeType, OAuthToken> = new Map();

  constructor() {
    this.loadTokensFromDB();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Load tokens from IndexedDB into memory cache
   */
  private async loadTokensFromDB(): Promise<void> {
    try {
      const storedTokens = await this.getStoredTokens();
      if (storedTokens) {
        Object.entries(storedTokens).forEach(([key, value]) => {
          if (value && this.isTokenValid(value)) {
            this.tokenCache.set(key as ScopeType, value);
          }
        });
      }
    } catch (error) {
      console.error('[AuthManager] Failed to load tokens from DB:', error);
    }
  }

  /**
   * Get stored tokens from IndexedDB
   */
  private async getStoredTokens(): Promise<AuthState | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('oauthTokens', 'readonly');
        const request = tx.objectStore('oauthTokens').get('google_tokens');
        request.onsuccess = () => resolve(request.result?.tokens || null);
        request.onerror = () => reject(request.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Get database instance
   */
  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('jarvis-agency', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        
        // Create oauthTokens store if it doesn't exist
        if (!db.objectStoreNames.contains('oauthTokens')) {
          db.close();
          const upgradeReq = indexedDB.open('jarvis-agency', db.version + 1);
          upgradeReq.onupgradeneeded = () => {
            const upgradedDb = upgradeReq.result;
            if (!upgradedDb.objectStoreNames.contains('oauthTokens')) {
              upgradedDb.createObjectStore('oauthTokens', { keyPath: 'id' });
            }
          };
          upgradeReq.onsuccess = () => {
            resolve(upgradeReq.result);
          };
        } else {
          resolve(db);
        }
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('oauthTokens')) {
          db.createObjectStore('oauthTokens', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Save tokens to IndexedDB securely
   */
  private async saveTokensToDB(tokens: AuthState): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('oauthTokens', 'readwrite');
        tx.objectStore('oauthTokens').put({ id: 'google_tokens', tokens, updatedAt: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('[AuthManager] Failed to save tokens to DB:', error);
    }
  }

  /**
   * Check if a token is valid (not expired)
   */
  public isTokenValid(token: OAuthToken): boolean {
    return token.expiresAt > Date.now();
  }

  /**
   * Check if a specific scope type is authenticated
   */
  public isAuthenticated(scopeType: ScopeType): boolean {
    const token = this.tokenCache.get(scopeType);
    return token ? this.isTokenValid(token) : false;
  }

  /**
   * Get a valid token for a specific scope
   */
  public async getValidToken(scopeType: ScopeType): Promise<string | null> {
    const token = this.tokenCache.get(scopeType);
    
    if (!token) {
      return null;
    }

    // Check if token is still valid (with 60-second buffer for clock skew)
    if (token.expiresAt - 60000 > Date.now()) {
      return token.accessToken;
    }

    // Token expired, remove from cache and return null
    this.tokenCache.delete(scopeType);
    await this.removeToken(scopeType);
    return null;
  }

  /**
   * Get all current auth states
   */
  public getAuthStates(): AuthState {
    const states: AuthState = {
      PROFILE: null,
      YOUTUBE: null,
      GMAIL: null,
      DRIVE: null,
    };

    this.tokenCache.forEach((token, key) => {
      if (this.isTokenValid(token)) {
        states[key] = token;
      }
    });

    return states;
  }

  /**
   * Initiate OAuth2 implicit flow
   */
  public initiateOAuthFlow(scopeType: ScopeType): void {
    if (!CLIENT_ID) {
      console.error('[AuthManager] VITE_GOOGLE_CLIENT_ID not configured');
      return;
    }

    const scope = OAUTH_SCOPES[scopeType];
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    
    // Construct OAuth2 URL with implicit flow (response_type=token)
    const authUrl = new URL(OAUTH_ENDPOINT);
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('state', scopeType);

    // Open OAuth consent page in a popup or redirect
    const width = 500;
    const height = 600;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    window.open(
      authUrl.toString(),
      'google_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );
  }

  /**
   * Handle OAuth redirect and parse tokens from URL hash
   */
  public async handleOAuthRedirect(): Promise<boolean> {
    // Check for token in URL hash
    const hash = window.location.hash;
    
    if (!hash || hash.length < 2) {
      // Check for token in URL search params (authorization code flow)
      return this.handleAuthCodeRedirect();
    }

    // Parse fragment parameters
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    const scope = params.get('scope');
    const state = params.get('state') as ScopeType;

    if (!accessToken || !state) {
      console.warn('[AuthManager] No access token or state found in redirect');
      return false;
    }

    // Calculate expiration time
    const expiresAt = Date.now() + (parseInt(expiresIn || '3600', 10) * 1000);

    // Create token object
    const token: OAuthToken = {
      accessToken,
      expiresAt,
      scope: scope || OAUTH_SCOPES[state] || '',
      tokenType: 'Bearer',
      createdAt: Date.now(),
    };

    // Store token in cache
    this.tokenCache.set(state, token);

    // Persist to IndexedDB
    const tokens = this.getAuthStates();
    tokens[state] = token;
    await this.saveTokensToDB(tokens);

    // Clear the hash from URL for security
    window.history.replaceState(null, '', window.location.pathname);

    console.log(`[AuthManager] OAuth token acquired for ${state}`);
    return true;
  }

  /**
   * Handle authorization code flow (PKCE would be recommended for production)
   */
  private async handleAuthCodeRedirect(): Promise<boolean> {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const state = searchParams.get('state') as ScopeType;

    if (!code || !state) {
      return false;
    }

    // Note: In a real application, you would exchange this code for tokens
    // on a backend server. For pure client-side apps, the implicit flow
    // (response_type=token) is recommended. This is a fallback for cases
    // where the code was obtained through a redirect.
    
    console.warn('[AuthManager] Authorization code received - requires server-side exchange');
    window.history.replaceState(null, '', window.location.pathname);
    return false;
  }

  /**
   * Remove a specific token
   */
  public async removeToken(scopeType: ScopeType): Promise<void> {
    this.tokenCache.delete(scopeType);
    
    // Update IndexedDB
    const tokens = this.getAuthStates();
    tokens[scopeType] = null;
    await this.saveTokensToDB(tokens);
    
    console.log(`[AuthManager] Token removed for ${scopeType}`);
  }

  /**
   * Clear all tokens
   */
  public async clearAllTokens(): Promise<void> {
    this.tokenCache.clear();
    
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('oauthTokens', 'readwrite');
        tx.objectStore('oauthTokens').delete('google_tokens');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error('[AuthManager] Failed to clear tokens:', error);
    }
    
    console.log('[AuthManager] All tokens cleared');
  }

  /**
   * Get token expiration time remaining (in seconds)
   */
  public getTokenTimeRemaining(scopeType: ScopeType): number {
    const token = this.tokenCache.get(scopeType);
    if (!token) return 0;
    
    const remaining = token.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  }

  /**
   * Get formatted expiration countdown
   */
  public getExpirationCountdown(scopeType: ScopeType): string {
    const seconds = this.getTokenTimeRemaining(scopeType);
    
    if (seconds <= 0) return 'EXPIRED';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }
}

// Export singleton instance
export const authManager = AuthManager.getInstance();