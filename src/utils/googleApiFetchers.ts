/**
 * GOOGLE API FETCHERS - Live Data Feed Fetchers
 * Provides typed interfaces for fetching real-time data from Google APIs
 */

import { authManager } from './authManager';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface YouTubeChannelStats {
  channelId: string;
  channelTitle: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  uploadedAt: string;
  fetchedAt: number;
}

export interface YouTubeAnalyticsData {
  views: number;
  watchTimeMinutes: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  likes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  subscribersLost: number;
  fetchedAt: number;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  isRead: boolean;
  labelIds: string[];
}

export interface GmailInboxData {
  totalMessages: number;
  unreadCount: number;
  messages: GmailMessage[];
  fetchedAt: number;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

// ============================================================================
// FETCH HELPER
// ============================================================================

async function fetchWithAuth<T>(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = {
      code: errorData.error?.code || 'UNKNOWN_ERROR',
      message: errorData.error?.message || response.statusText,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}

// ============================================================================
// YOUTUBE FETCHERS
// ============================================================================

/**
 * Fetch live YouTube channel statistics
 * Uses the YouTube Data API v3 Channels endpoint
 */
export async function fetchLiveYouTubeMetrics(
  token: string
): Promise<YouTubeChannelStats> {
  try {
    // Fetch channel information with statistics
    const channelResponse = await fetchWithAuth<any>(
      `${YOUTUBE_API_BASE}/channels?part=snippet,statistics&mine=true`,
      token
    );

    if (!channelResponse.items || channelResponse.items.length === 0) {
      throw new Error('No YouTube channel found for this account');
    }

    const channel = channelResponse.items[0];
    const snippet = channel.snippet;
    const statistics = channel.statistics;

    return {
      channelId: channel.id,
      channelTitle: snippet.title,
      subscriberCount: parseInt(statistics.subscriberCount, 10) || 0,
      viewCount: parseInt(statistics.viewCount, 10) || 0,
      videoCount: parseInt(statistics.videoCount, 10) || 0,
      uploadedAt: snippet.publishedAt,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    console.error('[GoogleApiFetchers] Failed to fetch YouTube metrics:', error);
    throw error;
  }
}

/**
 * Fetch YouTube analytics data
 * Note: YouTube Analytics API requires additional OAuth scope
 */
export async function fetchYouTubeAnalytics(
  token: string,
  _startDate?: string,
  _endDate?: string
): Promise<YouTubeAnalyticsData> {
  try {
    // Get video list for analytics
    const videosResponse = await fetchWithAuth<any>(
      `${YOUTUBE_API_BASE}/search?part=snippet&type=video&maxResults=50&mine=true`,
      token
    );

    if (!videosResponse.items || videosResponse.items.length === 0) {
      return {
        views: 0,
        watchTimeMinutes: 0,
        estimatedMinutesWatched: 0,
        averageViewDuration: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        subscribersGained: 0,
        subscribersLost: 0,
        fetchedAt: Date.now(),
      };
    }

    // Get video IDs for batch statistics
    const videoIds = videosResponse.items.map((item: any) => item.id.videoId).join(',');
    
    const statsResponse = await fetchWithAuth<any>(
      `${YOUTUBE_API_BASE}/videos?part=statistics,contentDetails&id=${videoIds}`,
      token
    );

    // Aggregate statistics
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let avgDurationSeconds = 0;
    let subscriberGained = 0;
    let subscriberLost = 0;

    statsResponse.items?.forEach((video: any) => {
      const stats = video.statistics;
      const content = video.contentDetails;

      totalViews += parseInt(stats.viewCount, 10) || 0;
      totalLikes += parseInt(stats.likeCount, 10) || 0;
      totalComments += parseInt(stats.commentCount, 10) || 0;
      totalShares += parseInt(stats.shareCount || '0', 10) || 0;
      subscriberGained += parseInt(stats.subscriberGained || '0', 10) || 0;
      subscriberLost += parseInt(stats.subscriberLost || '0', 10) || 0;

      // Parse ISO 8601 duration
      const duration = content?.duration || 'PT0S';
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (match) {
        const hours = parseInt(match[1] || '0', 10);
        const minutes = parseInt(match[2] || '0', 10);
        const seconds = parseInt(match[3] || '0', 10);
        avgDurationSeconds += hours * 3600 + minutes * 60 + seconds;
      }
    });

    const videoCount = statsResponse.items?.length || 0;

    return {
      views: totalViews,
      watchTimeMinutes: Math.round((avgDurationSeconds * totalViews) / 60),
      estimatedMinutesWatched: Math.round(totalViews * (avgDurationSeconds / videoCount / 60)),
      averageViewDuration: videoCount > 0 ? Math.round(avgDurationSeconds / videoCount) : 0,
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares,
      subscribersGained: subscriberGained,
      subscribersLost: subscriberLost,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    console.error('[GoogleApiFetchers] Failed to fetch YouTube analytics:', error);
    throw error;
  }
}

/**
 * Fetch recent YouTube videos
 */
export async function fetchRecentYouTubeVideos(
  token: string,
  maxResults: number = 10
): Promise<any[]> {
  try {
    const response = await fetchWithAuth<any>(
      `${YOUTUBE_API_BASE}/search?part=snippet&type=video&order=date&maxResults=${maxResults}&mine=true`,
      token
    );

    return response.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.channelTitle,
    })) || [];
  } catch (error) {
    console.error('[GoogleApiFetchers] Failed to fetch recent videos:', error);
    throw error;
  }
}

// ============================================================================
// GMAIL FETCHERS
// ============================================================================

/**
 * Fetch live Gmail inbox data
 */
export async function fetchLiveGmailInbox(
  token: string,
  maxResults: number = 20
): Promise<GmailInboxData> {
  try {
    // Fetch list of messages (unread by default)
    const listResponse = await fetchWithAuth<any>(
      `${GMAIL_API_BASE}/users/me/messages?maxResults=${maxResults}&q=is:unread`,
      token
    );

    if (!listResponse.messages || listResponse.messages.length === 0) {
      return {
        totalMessages: 0,
        unreadCount: 0,
        messages: [],
        fetchedAt: Date.now(),
      };
    }

    // Fetch detailed message data
    const messagePromises = listResponse.messages.slice(0, maxResults).map(async (msg: any) => {
      try {
        const detailResponse = await fetchWithAuth<any>(
          `${GMAIL_API_BASE}/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
          token
        );

        const headers = detailResponse.payload?.headers || [];
        const getHeader = (name: string): string => {
          const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
          return header?.value || '';
        };

        return {
          id: detailResponse.id,
          threadId: detailResponse.threadId,
          subject: getHeader('Subject'),
          from: getHeader('From'),
          snippet: detailResponse.snippet,
          date: getHeader('Date'),
          isRead: !detailResponse.labelIds?.includes('UNREAD'),
          labelIds: detailResponse.labelIds || [],
        } as GmailMessage;
      } catch {
        return null;
      }
    });

    const messages = (await Promise.all(messagePromises)).filter((m): m is GmailMessage => m !== null);

    // Get total unread count
    const unreadResponse = await fetchWithAuth<any>(
      `${GMAIL_API_BASE}/users/me/messages?maxResults=1&q=is:unread`,
      token
    );

    return {
      totalMessages: listResponse.resultSizeEstimate || messages.length,
      unreadCount: parseInt(unreadResponse.resultSizeEstimate || '0', 10) || messages.length,
      messages,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    console.error('[GoogleApiFetchers] Failed to fetch Gmail inbox:', error);
    throw error;
  }
}

/**
 * Fetch specific Gmail message details
 */
export async function fetchGmailMessageDetail(
  token: string,
  messageId: string
): Promise<any> {
  try {
    const response = await fetchWithAuth<any>(
      `${GMAIL_API_BASE}/users/me/messages/${messageId}`,
      token
    );

    return {
      id: response.id,
      threadId: response.threadId,
      subject: response.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '',
      from: response.payload?.headers?.find((h: any) => h.name === 'From')?.value || '',
      to: response.payload?.headers?.find((h: any) => h.name === 'To')?.value || '',
      date: response.payload?.headers?.find((h: any) => h.name === 'Date')?.value || '',
      body: extractMessageBody(response.payload),
      labelIds: response.labelIds || [],
      internalDate: response.internalDate,
    };
  } catch (error) {
    console.error('[GoogleApiFetchers] Failed to fetch message detail:', error);
    throw error;
  }
}

/**
 * Extract message body from MIME structure
 */
function extractMessageBody(payload: any): string {
  if (!payload) return '';
  
  if (payload.body?.data) {
    return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }
  
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
      if (part.mimeType === 'text/html' && part.body?.data) {
        return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    }
  }
  
  return '';
}

// ============================================================================
// PROFILE FETCHERS
// ============================================================================

/**
 * Fetch Google user profile
 */
export async function fetchGoogleProfile(token: string): Promise<any> {
  try {
    const response = await fetchWithAuth<any>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      token
    );

    return {
      id: response.id,
      email: response.email,
      name: response.name,
      picture: response.picture,
      givenName: response.given_name,
      familyName: response.family_name,
      locale: response.locale,
      verifiedEmail: response.verified_email,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    console.error('[GoogleApiFetchers] Failed to fetch Google profile:', error);
    throw error;
  }
}

// ============================================================================
// DRIVE FETCHERS
// ============================================================================

/**
 * Fetch Google Drive files
 */
export async function fetchDriveFiles(
  token: string,
  maxResults: number = 50
): Promise<any[]> {
  try {
    const response = await fetchWithAuth<any>(
      `https://www.googleapis.com/drive/v3/files?pageSize=${maxResults}&fields=files(id,name,mimeType,createdTime,modifiedTime,size,parents,webViewLink)`,
      token
    );

    return response.files || [];
  } catch (error) {
    console.error('[GoogleApiFetchers] Failed to fetch Drive files:', error);
    throw error;
  }
}

/**
 * Fetch Drive storage quota info
 */
export async function fetchDriveQuota(token: string): Promise<any> {
  try {
    const response = await fetchWithAuth<any>(
      'https://www.googleapis.com/drive/v3/about?fields=storageQuota,user',
      token
    );

    return {
      limit: parseInt(response.storageQuota?.limit || '0', 10),
      usage: parseInt(response.storageQuota?.usage || '0', 10),
      usageInDrive: parseInt(response.storageQuota?.usageInDrive || '0', 10),
      usageInTrash: parseInt(response.storageQuota?.usageInTrash || '0', 10),
      user: response.user,
      fetchedAt: Date.now(),
    };
  } catch (error) {
    console.error('[GoogleApiFetchers] Failed to fetch Drive quota:', error);
    throw error;
  }
}

// ============================================================================
// COMBINED DATA FETCHER
// ============================================================================

export interface LiveMetricsData {
  youtube: YouTubeChannelStats | null;
  gmail: GmailInboxData | null;
  profile: any | null;
  timestamp: number;
  errors: string[];
}

/**
 * Fetch all live metrics from connected APIs
 */
export async function fetchAllLiveMetrics(): Promise<LiveMetricsData> {
  const result: LiveMetricsData = {
    youtube: null,
    gmail: null,
    profile: null,
    timestamp: Date.now(),
    errors: [],
  };

  // Fetch YouTube metrics
  const youtubeToken = await authManager.getValidToken('YOUTUBE');
  if (youtubeToken) {
    try {
      result.youtube = await fetchLiveYouTubeMetrics(youtubeToken);
    } catch (error) {
      result.errors.push(`YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fetch Gmail inbox
  const gmailToken = await authManager.getValidToken('GMAIL');
  if (gmailToken) {
    try {
      result.gmail = await fetchLiveGmailInbox(gmailToken);
    } catch (error) {
      result.errors.push(`Gmail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Fetch profile
  const profileToken = await authManager.getValidToken('PROFILE');
  if (profileToken) {
    try {
      result.profile = await fetchGoogleProfile(profileToken);
    } catch (error) {
      result.errors.push(`Profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return result;
}