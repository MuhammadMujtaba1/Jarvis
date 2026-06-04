/**
 * AUTH MANAGER - OAuth2 Token Management
 * Handles Google OAuth2 implicit flow with IndexedDB storage
 */

const CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
const OAUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';

export const OAUTH_SCOPES = {
  PROFILE: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
  YOUTUBE: 'https://www.googleapis.com/auth/youtube.readonly',
  GMAIL: 'https://www.googleapis.com/auth/gmail.modify',
  DRIVE: 'https://www.googleapis.com/auth/drive.file',
} as const;

export type ScopeType = keyof typeof OAUTH_SCOPES;

export interface OAuthToken {
  accessToken: string;
  expiresAt: number;
  scope: string;
  createdAt: number;
}

export interface AuthState {
  PROFILE: OAuthToken | null;
  YOUTUBE: OAuthToken | null;
  GMAIL: OAuthToken | null;
  DRIVE: OAuthToken | null;
}

class AuthManager {
  private cache: Map<ScopeType, OAuthToken> = new Map();

  constructor() {
    this.loadTokens();
  }

  private async loadTokens(): Promise<void> {
    try {
      const db = await this.getDB();
      const data = await new Promise<any>((resolve, reject) => {
        const tx = db.transaction('oauthTokens', 'readonly');
        const req = tx.objectStore('oauthTokens').get('google_tokens');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      
      if (data?.tokens) {
        const now = Date.now();
        Object.entries(data.tokens).forEach(([key, value]: [string, any]) => {
          if (value && value.expiresAt > now) {
            this.cache.set(key as ScopeType, value);
          }
        });
      }
    } catch (e) {
      // Silently fail
    }
  }

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('jarvis-agency', 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('oauthTokens')) {
          db.createObjectStore('oauthTokens', { keyPath: 'id' });
        }
      };
    });
  }

  private async saveTokens(): Promise<void> {
    try {
      const db = await this.getDB();
      const tokens: AuthState = { PROFILE: null, YOUTUBE: null, GMAIL: null, DRIVE: null };
      this.cache.forEach((v, k) => { tokens[k] = v; });
      
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('oauthTokens', 'readwrite');
        tx.objectStore('oauthTokens').put({ id: 'google_tokens', tokens, updatedAt: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      // Silently fail
    }
  }

  isValid(token: OAuthToken): boolean {
    return token.expiresAt > Date.now();
  }

  isAuthenticated(scope: ScopeType): boolean {
    const token = this.cache.get(scope);
    return token ? this.isValid(token) : false;
  }

  async getValidToken(scope: ScopeType): Promise<string | null> {
    const token = this.cache.get(scope);
    if (!token) return null;
    if (token.expiresAt - 60000 > Date.now()) return token.accessToken;
    this.cache.delete(scope);
    await this.saveTokens();
    return null;
  }

  getAuthStates(): AuthState {
    const states: AuthState = { PROFILE: null, YOUTUBE: null, GMAIL: null, DRIVE: null };
    this.cache.forEach((v, k) => { if (this.isValid(v)) states[k] = v; });
    return states;
  }

  initiateOAuthFlow(scope: ScopeType): void {
    if (!CLIENT_ID) { console.error('VITE_GOOGLE_CLIENT_ID not configured'); return; }
    
    const url = new URL(OAUTH_ENDPOINT);
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('redirect_uri', window.location.origin + window.location.pathname);
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('scope', OAUTH_SCOPES[scope]);
    url.searchParams.set('state', scope);

    window.open(url.toString(), 'google_oauth', 'width=500,height=600');
  }

  async handleOAuthRedirect(): Promise<boolean> {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return false;

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    const scope = params.get('scope');
    const state = params.get('state') as ScopeType;

    if (!accessToken || !state) return false;

    const token: OAuthToken = {
      accessToken,
      expiresAt: Date.now() + (parseInt(expiresIn || '3600') * 1000),
      scope: scope || '',
      createdAt: Date.now(),
    };

    this.cache.set(state, token);
    await this.saveTokens();
    window.history.replaceState(null, '', window.location.pathname);
    return true;
  }

  async removeToken(scope: ScopeType): Promise<void> {
    this.cache.delete(scope);
    await this.saveTokens();
  }

  getExpirationCountdown(scope: ScopeType): string {
    const token = this.cache.get(scope);
    if (!token) return '';
    const secs = Math.max(0, Math.floor((token.expiresAt - Date.now()) / 1000));
    if (secs <= 0) return 'EXPIRED';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? h + 'h ' + m + 'm ' + s + 's' : m + 'm ' + s + 's';
  }
}

export const authManager = new AuthManager();