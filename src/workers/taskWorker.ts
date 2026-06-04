/**
 * WEB WORKER: Background Task Executor
 * Handles DAG execution, metrics analysis, and streaming responses
 * 
 * DEFROST PROTOCOL: 4000ms hard timeout on all agent state transitions
 * All async operations race against timeout to prevent UI blocking
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

// 4000ms hard timeout - prevents any agent state from blocking
const HARD_TIMEOUT_MS = 4000;

const withTimeout = <T>(promise: Promise<T>, operation: string): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        const warning: WorkerResponse = {
          type: 'AGENT_TIMEOUT_WARNING',
          warning: `[SYSTEM] ${operation} exceeded ${HARD_TIMEOUT_MS}ms - forcing IDLE state`,
        };
        self.postMessage(warning);
        reject(new Error(`TIMEOUT: ${operation}`));
      }, HARD_TIMEOUT_MS);
    })
  ]);
};

// Worker message handler with timeout protection
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'EXECUTE_DAG':
        await withTimeout(executeDAG(payload), 'DAG_EXECUTION');
        break;

      case 'ANALYZE_METRICS':
        await withTimeout(analyzeMetrics(payload), 'METRICS_ANALYSIS');
        break;

      case 'STREAM_GROQ':
        await withTimeout(streamGroqResponse(payload), 'GROQ_STREAM');
        break;

      case 'PROCESS_VIDEO_ANALYTICS':
        await withTimeout(processVideoAnalytics(payload), 'VIDEO_ANALYTICS');
        break;

      case 'PROCESS_AD_METRICS':
        await withTimeout(processAdMetrics(payload), 'AD_METRICS');
        break;

      default:
        sendError(`Unknown worker task type: ${type}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Check if it's a timeout - log warning instead of error
    if (errorMsg.includes('TIMEOUT')) {
      const warning: WorkerResponse = {
        type: 'AGENT_STATE_RESET',
        data: { status: 'IDLE', reason: 'Timeout fallback' },
      };
      self.postMessage(warning);
    } else {
      sendError(errorMsg);
    }
  }
};

/**
 * Execute a DAG in background with timeout protection
 */
async function executeDAG(payload: { dag: ExecutionDAG; startIndex?: number }): Promise<void> {
  const { dag, startIndex = 0 } = payload;
  const executableTasks = DAGProcessor.getExecutableTasks(dag);

  for (let i = startIndex; i < executableTasks.length; i++) {
    const task = executableTasks[i];
    const progress = Math.round(((i + 1) / executableTasks.length) * 100);

    // Simulate task execution with timeout
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Mark task as completed
    DAGProcessor.completeTask(dag, task.id);

    // Send progress update
    self.postMessage({
      type: 'DAG_PROGRESS',
      data: {
        dagId: dag.id,
        completedTask: task.task,
        progress,
        agentStatus: 'PROCESSING',
      },
    } as WorkerResponse);

    // Reset agent state after each task (prevent hard-lock)
    self.postMessage({
      type: 'AGENT_HEARTBEAT',
      data: { tier: 'T2', status: 'IDLE' },
    } as WorkerResponse);
  }

  // Send completion
  self.postMessage({
    type: 'DAG_COMPLETE',
    data: {
      dagId: dag.id,
      visualization: DAGProcessor.visualizeDAG(dag),
      finalAgentStatus: 'IDLE',
    },
  } as WorkerResponse);
}

/**
 * Analyze business metrics in background
 */
async function analyzeMetrics(payload: any): Promise<void> {
  const { metricsJson } = payload;

  const analysis = await groqClient.analyzeMetrics(metricsJson);

  self.postMessage({
    type: 'METRICS_ANALYSIS_COMPLETE',
    data: {
      analysis,
      agentStatus: 'IDLE',
    },
  } as WorkerResponse);
}

/**
 * Stream Groq response with progress updates
 */
async function streamGroqResponse(payload: any): Promise<void> {
  const { messages, taskId } = payload;

  await groqClient.stream(messages, 0.7, 2000, (chunk: string) => {
    self.postMessage({
      type: 'GROQ_STREAM_CHUNK',
      taskId,
      data: { chunk },
    } as WorkerResponse);
  });

  self.postMessage({
    type: 'GROQ_STREAM_COMPLETE',
    taskId,
    data: { agentStatus: 'IDLE' },
  } as WorkerResponse);
}

/**
 * Process video analytics in background
 */
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

  self.postMessage({
    type: 'VIDEO_ANALYTICS_COMPLETE',
    data: analysis,
  } as WorkerResponse);
}

/**
 * Process ad campaign metrics in background
 */
async function processAdMetrics(payload: any): Promise<void> {
  const { campaigns, totalBudget } = payload;

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
    agentStatus: 'IDLE',
  };

  self.postMessage({
    type: 'AD_METRICS_COMPLETE',
    data: analysis,
  } as WorkerResponse);
}

/**
 * Send error message to main thread
 */
function sendError(error: string): void {
  // On error, always reset agent state to IDLE to prevent blocking
  self.postMessage({
    type: 'WORKER_ERROR',
    error,
    data: { agentStatus: 'IDLE', recovery: 'Agent state reset to IDLE' },
  } as WorkerResponse);
}

export {};
