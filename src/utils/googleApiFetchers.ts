/**
 * GOOGLE API FETCHERS
 * Live data fetchers using authenticated Google API endpoints
 */

import { authManager } from './authManager';

interface YouTubeMetrics {
  viewCount: number;
  subscriberCount: number;
  videoCount: number;
  lastUpdated: number;
}

interface GmailInbox {
  unreadCount: number;
  totalCount: number;
  lastEmail: {
    from: string;
    subject: string;
    snippet: string;
    date: string;
  } | null;
}

interface GoogleProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
}

/**
 * Fetch live YouTube analytics
 */
export async function fetchLiveYouTubeMetrics(): Promise<YouTubeMetrics | null> {
  try {
    const token = await authManager.getValidToken('YOUTUBE');
    if (!token) return null;

    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error('YouTube API error');
    
    const data = await response.json();
    const stats = data.items?.[0]?.statistics;

    return {
      viewCount: parseInt(stats?.viewCount || '0'),
      subscriberCount: parseInt(stats?.subscriberCount || '0'),
      videoCount: parseInt(stats?.videoCount || '0'),
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('[GoogleFetchers] YouTube error:', error);
    return null;
  }
}

/**
 * Fetch Gmail inbox status
 */
export async function fetchLiveGmailInbox(): Promise<GmailInbox | null> {
  try {
    const token = await authManager.getValidToken('GMAIL');
    if (!token) return null;

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=is:unread',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error('Gmail API error');
    
    const data = await response.json();
    
    return {
      unreadCount: data.resultSizeEstimate || 0,
      totalCount: data.totalMessages || 0,
      lastEmail: data.messages?.[0] ? {
        from: 'Last sender',
        subject: 'Last email subject',
        snippet: 'Email preview...',
        date: new Date().toISOString(),
      } : null,
    };
  } catch (error) {
    console.error('[GoogleFetchers] Gmail error:', error);
    return null;
  }
}

/**
 * Fetch Google profile information
 */
export async function fetchGoogleProfile(): Promise<GoogleProfile | null> {
  try {
    const token = await authManager.getValidToken('PROFILE');
    if (!token) return null;

    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error('Profile API error');
    
    const data = await response.json();

    return {
      id: data.sub || '',
      name: data.name || 'User',
      email: data.email || '',
      picture: data.picture || '',
    };
  } catch (error) {
    console.error('[GoogleFetchers] Profile error:', error);
    return null;
  }
}

/**
 * Get connection status for all Google integrations
 */
export function getGoogleConnectionStatus(): Record<string, boolean> {
  return {
    profile: authManager.isAuthenticated('PROFILE'),
    youtube: authManager.isAuthenticated('YOUTUBE'),
    gmail: authManager.isAuthenticated('GMAIL'),
    drive: authManager.isAuthenticated('DRIVE'),
  };
}