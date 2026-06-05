/**
 * WEB WORKER: Background Task Executor
 * Handles DAG execution, metrics analysis, and streaming responses
 * 
 * DEFROST PROTOCOL: 4000ms hard timeout on all agent state transitions
 * EXPONENTIAL BACKOFF: Auto-pause after 3 consecutive failures (5s -> 10s -> 20s -> max 30s)
 */

/// <reference lib="webworker" />

import { DAGProcessor } from '../utils/dagProcessor';
import { groqClient } from '../utils/groqClient';
import { ExecutionDAG } from '../types';

interface WorkerMessage {
  type: string;
  payload: any;
}

interface WorkerResponse {
  type: string;
  taskId?: string;
  data?: any;
  error?: string;
  progress?: number;
  warning?: string;
}

// 4000ms hard timeout
const HARD_TIMEOUT_MS = 4000;

// Backoff state
let consecutiveFailures = 0;
let isBackingOff = false;
let currentBackoffMs = 5000;

const sendMessage = (data: WorkerResponse) => self.postMessage(data);

const withTimeout = <T>(promise: Promise<T>, operation: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        sendMessage({
          type: 'AGENT_TIMEOUT_WARNING',
          warning: `[SYSTEM] ${operation} exceeded ${HARD_TIMEOUT_MS}ms - forcing IDLE state`,
        });
        reject(new Error(`TIMEOUT: ${operation}`));
      }, HARD_TIMEOUT_MS);
    })
  ]);
};

const resetBackoff = () => {
  consecutiveFailures = 0;
  isBackingOff = false;
  currentBackoffMs = 5000;
  sendMessage({ type: 'BACKOFF_RESET' });
};

const incrementBackoff = () => {
  consecutiveFailures++;
  if (consecutiveFailures >= 3) {
    isBackingOff = true;
    currentBackoffMs = Math.min(currentBackoffMs * 2, 30000);
    sendMessage({
      type: 'BACKOFF_ACTIVE',
      data: { delayMs: currentBackoffMs, consecutiveFailures }
    });
  }
};

// Worker message handler with timeout protection
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  // Skip if backing off
  if (isBackingOff && type !== 'RESET_BACKOFF' && type !== 'GET_STATUS') {
    sendMessage({
      type: 'TASK_SKIPPED',
      data: { reason: 'Backoff active', nextRetryMs: currentBackoffMs }
    });
    return;
  }

  try {
    switch (type) {
      case 'EXECUTE_DAG':
        await withTimeout(executeDAG(payload), 'DAG_EXECUTION');
        resetBackoff();
        break;

      case 'ANALYZE_METRICS':
        await withTimeout(analyzeMetrics(payload), 'METRICS_ANALYSIS');
        resetBackoff();
        break;

      case 'STREAM_GROQ':
        await withTimeout(streamGroqResponse(payload), 'GROQ_STREAM');
        resetBackoff();
        break;

      case 'PROCESS_VIDEO_ANALYTICS':
        await withTimeout(processVideoAnalytics(payload), 'VIDEO_ANALYTICS');
        resetBackoff();
        break;

      case 'PROCESS_AD_METRICS':
        await withTimeout(processAdMetrics(payload), 'AD_METRICS');
        resetBackoff();
        break;

      case 'RESET_BACKOFF':
        resetBackoff();
        break;

      case 'GET_STATUS':
        sendMessage({
          type: 'STATUS',
          data: { isBackingOff, consecutiveFailures, currentBackoffMs }
        });
        break;

      default:
        sendMessage({ type: 'ERROR', error: `Unknown task type: ${type}` });
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    if (errorMsg.includes('TIMEOUT')) {
      incrementBackoff();
      sendMessage({
        type: 'AGENT_STATE_RESET',
        data: { status: 'IDLE', reason: 'Timeout fallback' }
      });
    } else {
      incrementBackoff();
      sendMessage({
        type: 'WORKER_ERROR',
        error: errorMsg,
        data: { agentStatus: 'IDLE', recovery: 'Agent state reset to IDLE' }
      });
    }
  }
};

async function executeDAG(payload: { dag: ExecutionDAG; startIndex?: number }): Promise<void> {
  const { dag, startIndex = 0 } = payload;
  const executableTasks = DAGProcessor.getExecutableTasks(dag);

  for (let i = startIndex; i < executableTasks.length; i++) {
    const task = executableTasks[i];
    const progress = Math.round(((i + 1) / executableTasks.length) * 100);

    await new Promise((resolve) => setTimeout(resolve, 500));
    DAGProcessor.completeTask(dag, task.id);

    sendMessage({
      type: 'DAG_PROGRESS',
      data: {
        dagId: dag.id,
        completedTask: task.task,
        progress,
        agentStatus: 'PROCESSING',
      },
    });

    sendMessage({
      type: 'AGENT_HEARTBEAT',
      data: { tier: 'T2', status: 'IDLE' },
    });
  }

  sendMessage({
    type: 'DAG_COMPLETE',
    data: {
      dagId: dag.id,
      visualization: DAGProcessor.visualizeDAG(dag),
      finalAgentStatus: 'IDLE',
    },
  });
}

async function analyzeMetrics(payload: any): Promise<void> {
  const { metricsJson } = payload;
  const analysis = await groqClient.analyzeMetrics(metricsJson);

  sendMessage({
    type: 'METRICS_ANALYSIS_COMPLETE',
    data: { analysis, agentStatus: 'IDLE' },
  });
}

async function streamGroqResponse(payload: any): Promise<void> {
  const { messages, taskId } = payload;

  await groqClient.stream(messages, 0.7, 1024, (chunk: string) => {
    sendMessage({
      type: 'GROQ_STREAM_CHUNK',
      taskId,
      data: { chunk },
    });
  });

  sendMessage({
    type: 'GROQ_STREAM_COMPLETE',
    taskId,
    data: { agentStatus: 'IDLE' },
  });
}

async function processVideoAnalytics(payload: any): Promise<void> {
  const { videos, targetViews } = payload;

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
    agentStatus: 'IDLE',
  };

  sendMessage({
    type: 'VIDEO_ANALYTICS_COMPLETE',
    data: analysis,
  });
}

async function processAdMetrics(payload: any): Promise<void> {
  const { campaigns, totalBudget } = payload;

  const analysis = {
    totalCampaigns: campaigns.length,
    totalSpent: campaigns.reduce((sum: number, c: any) => sum + c.spent, 0),
    avgROAS: (campaigns.reduce((sum: number, c: any) => sum + c.roi, 0) / campaigns.length).toFixed(2),
    bestPerformer: campaigns.reduce((a: any, b: any) => (a.roi > b.roi ? a : b)),
    worstPerformer: campaigns.reduce((a: any, b: any) => (a.roi < b.roi ? a : b)),
    budgetUtilization: (
      (campaigns.reduce((sum: number, c: any) => sum + c.spent, 0) / totalBudget) * 100
    ).toFixed(1),
    agentStatus: 'IDLE',
  };

  sendMessage({
    type: 'AD_METRICS_COMPLETE',
    data: analysis,
  });
}

export {};
