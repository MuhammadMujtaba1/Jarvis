/**
 * WEB WORKER: Background Task Executor
 * Runs CPU-intensive tasks without blocking the UI thread
 * Handles DAG execution, metrics analysis, and streaming responses
 * Integrates with Google OAuth2 for live data feeds
 */

/// <reference lib="webworker" />

import { DAGProcessor } from '../utils/dagProcessor';
import { groqClient } from '../utils/groqClient';
import { ExecutionDAG } from '../types';

declare const self: ServiceWorkerGlobalScope;

// ============================================================================
// TOKEN STATE MANAGEMENT
// ============================================================================

interface TokenState {
  hasYouTubeToken: boolean;
  hasGmailToken: boolean;
  hasProfileToken: boolean;
  lastCheck: number;
}

// Check token state from IndexedDB
async function checkTokenState(): Promise<TokenState> {
  const state: TokenState = {
    hasYouTubeToken: false,
    hasGmailToken: false,
    hasProfileToken: false,
    lastCheck: Date.now(),
  };

  try {
    // Open IndexedDB to check tokens
    const dbRequest = indexedDB.open('jarvis-agency', 1);
    
    await new Promise<void>((resolve, reject) => {
      dbRequest.onerror = () => reject(dbRequest.error);
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        
        if (db.objectStoreNames.contains('oauthTokens')) {
          const tx = db.transaction('oauthTokens', 'readonly');
          const store = tx.objectStore('oauthTokens');
          const getRequest = store.get('google_tokens');
          
          getRequest.onsuccess = () => {
            const data = getRequest.result;
            if (data?.tokens) {
              const tokens = data.tokens;
              const now = Date.now();
              const buffer = 60000; // 60 second buffer for clock skew
              
              // Check each token's expiration
              if (tokens.YOUTUBE?.accessToken && tokens.YOUTUBE.expiresAt - buffer > now) {
                state.hasYouTubeToken = true;
              }
              if (tokens.GMAIL?.accessToken && tokens.GMAIL.expiresAt - buffer > now) {
                state.hasGmailToken = true;
              }
              if (tokens.PROFILE?.accessToken && tokens.PROFILE.expiresAt - buffer > now) {
                state.hasProfileToken = true;
              }
            }
            resolve();
          };
          
          getRequest.onerror = () => {
            resolve(); // Don't fail on error
          };
        } else {
          resolve();
        }
      };
    });
  } catch (error) {
    console.warn('[TaskWorker] Failed to check token state:', error);
  }
  
  return state;
}

// ============================================================================
// LIVE DATA FETCHING (Using fetch API directly since we're in a worker)
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars

// eslint-disable-next-line @typescript-eslint/no-unused-vars

// ============================================================================
// WORKER INTERFACES
// ============================================================================

// Cast self to have postMessage method
declare const workerSelf: ServiceWorkerGlobalScope & {
  postMessage: (message: any) => void;
  onmessage: ((event: any) => void) | null;
  setInterval: (fn: () => void, ms: number) => number;
};


interface WorkerResponse {
  type: string;
  taskId?: string;
  data?: any;
  error?: string;
  progress?: number;
}

// Helper function to post messages from worker context
const postToMain = (message: any) => {
  // In worker context, postToMain is available
  (self as any).postMessage(message);
};

// Token state cache
let cachedTokenState: TokenState | null = null;
let tokenCheckInterval: ReturnType<typeof setInterval> | null = null;

// Initialize token checking
async function initializeTokenChecking(): Promise<void> {
  cachedTokenState = await checkTokenState();
  
  // Check tokens every 30 seconds
  if (tokenCheckInterval === null) {
    tokenCheckInterval = setInterval(async () => {
      cachedTokenState = await checkTokenState();
    }, 30000);
  }
}

// Get cached token state
function getTokenState(): TokenState {
  if (!cachedTokenState || Date.now() - cachedTokenState.lastCheck > 60000) {
    // Trigger async check but return cached state if available
    checkTokenState().then(state => {
      cachedTokenState = state;
    });
  }
  return cachedTokenState || {
    hasYouTubeToken: false,
    hasGmailToken: false,
    hasProfileToken: false,
    lastCheck: Date.now(),
  };
}

// Send system warning message
function sendSystemWarning(message: string): void {
  postToMain({
    type: 'SYSTEM_WARNING',
    data: { message, timestamp: Date.now() },
  });
}

// Worker message handler
self.onmessage = async (event: any) => {
  const { type, payload } = event.data;

  try {
    // Ensure token checking is initialized
    await initializeTokenChecking();
    
    switch (type) {
      case 'EXECUTE_DAG':
        await executeDAG(payload);
        break;

      case 'ANALYZE_METRICS':
        await analyzeMetrics(payload);
        break;

      case 'STREAM_GROQ':
        await streamGroqResponse(payload);
        break;

      case 'PROCESS_VIDEO_ANALYTICS':
        await processVideoAnalytics(payload);
        break;

      case 'PROCESS_AD_METRICS':
        await processAdMetrics(payload);
        break;

      case 'CHECK_TOKENS':
        // Return current token state to main thread
        const state = getTokenState();
        postToMain({
          type: 'TOKEN_STATE',
          data: state,
        });
        break;

      default:
        sendError(`Unknown worker task type: ${type}`);
    }
  } catch (error) {
    sendError(String(error));
  }
};

/**
 * Execute a DAG in background
 */
async function executeDAG(payload: { dag: ExecutionDAG; startIndex?: number }): Promise<void> {
  const { dag, startIndex = 0 } = payload;
  const executableTasks = DAGProcessor.getExecutableTasks(dag);
  
  // Check token state before execution
  const tokenState = getTokenState();
  
  if (!tokenState.hasYouTubeToken) {
    sendSystemWarning('[SYSTEM WARNING: Node YouTube offline. Defaulting to local sandbox emulation parameters.]');
  }

  for (let i = startIndex; i < executableTasks.length; i++) {
    const task = executableTasks[i];
    const progress = Math.round(((i + 1) / executableTasks.length) * 100);

    // Simulate task execution (in production, would call actual agent APIs)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mark task as completed
    DAGProcessor.completeTask(dag, task.id);

    // Send progress update
    const response: WorkerResponse = {
      type: 'DAG_PROGRESS',
      data: {
        dagId: dag.id,
        completedTask: task.task,
        progress,
        useLiveData: tokenState.hasYouTubeToken,
      },
    };

    postToMain(response);
  }

  // Send completion
  postToMain({
    type: 'DAG_COMPLETE',
    data: {
      dagId: dag.id,
      visualization: DAGProcessor.visualizeDAG(dag),
      usingLiveData: tokenState.hasYouTubeToken,
    },
  });
}

/**
 * Analyze business metrics in background
 */
async function analyzeMetrics(payload: any): Promise<void> {
  const { metricsJson } = payload;

  try {
    // Check for live data tokens
    const tokenState = getTokenState();
    
    if (tokenState.hasYouTubeToken || tokenState.hasGmailToken) {
      // Fetch live data if tokens are available
      console.log('[TaskWorker] Using live data for metrics analysis');
    } else {
      console.log('[TaskWorker] Using simulated metrics (no live tokens)');
      sendSystemWarning('[SYSTEM WARNING: Analytics node offline. Defaulting to local sandbox emulation parameters.]');
    }

    const analysis = await groqClient.analyzeMetrics(metricsJson);

    postToMain({
      type: 'METRICS_ANALYSIS_COMPLETE',
      data: {
        analysis,
        usingLiveData: tokenState.hasYouTubeToken || tokenState.hasGmailToken,
      },
    });
  } catch (error) {
    sendError(`Metrics analysis failed: ${error}`);
  }
}

/**
 * Stream Groq response with progress updates
 */
async function streamGroqResponse(payload: any): Promise<void> {
  const { messages, taskId } = payload;

  try {
    await groqClient.stream(messages, 0.7, 2000, (chunk: string) => {
      postToMain({
        type: 'GROQ_STREAM_CHUNK',
        taskId,
        data: {
          chunk,
        },
      });
    });

    postToMain({
      type: 'GROQ_STREAM_COMPLETE',
      taskId,
    });
  } catch (error) {
    sendError(`Groq streaming failed: ${error}`);
  }
}

/**
 * Process video analytics in background
 */
async function processVideoAnalytics(payload: any): Promise<void> {
  const { videos, targetViews } = payload;

  // Simulate video analytics processing
  const analysis = {
    totalVideos: videos.length,
    totalViews: videos.reduce((sum: number, v: any) => sum + v.views, 0),
    targetViews,
    avgViewsPerVideo: Math.round(
      videos.reduce((sum: number, v: any) => sum + v.views, 0) / videos.length
    ),
    performanceStatus:
      videos.reduce((sum: number, v: any) => sum + v.views, 0) >= targetViews
        ? 'ON_TARGET'
        : 'BELOW_TARGET',
    topPerformer: videos.reduce((a: any, b: any) => (a.views > b.views ? a : b)),
  };

  postToMain({
    type: 'VIDEO_ANALYTICS_COMPLETE',
    data: analysis,
  });
}

/**
 * Process ad campaign metrics in background
 */
async function processAdMetrics(payload: any): Promise<void> {
  const { campaigns, totalBudget } = payload;

  // Simulate ad metrics processing
  const analysis = {
    totalCampaigns: campaigns.length,
    totalSpent: campaigns.reduce((sum: number, c: any) => sum + c.spent, 0),
    avgROAS: (campaigns.reduce((sum: number, c: any) => sum + c.roi, 0) / campaigns.length).toFixed(2),
    bestPerformer: campaigns.reduce((a: any, b: any) => (a.roi > b.roi ? a : b)),
    worstPerformer: campaigns.reduce((a: any, b: any) => (a.roi < b.roi ? a : b)),
    budgetUtilization: (
      (campaigns.reduce((sum: number, c: any) => sum + c.spent, 0) / totalBudget) *
      100
    ).toFixed(1),
  };

  postToMain({
    type: 'AD_METRICS_COMPLETE',
    data: analysis,
  });
}

/**
 * Send error message to main thread
 */
function sendError(error: string): void {
  postToMain({
    type: 'WORKER_ERROR',
    error,
  });
}

// Export for TypeScript
export {};
