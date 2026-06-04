// Core type definitions for JARVIS system

/**
 * Represents a single task in the execution DAG
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dependencies: string[]; // Task IDs this task depends on
  priority: 'low' | 'medium' | 'high';
  tier: 1 | 2 | 3 | 4; // Agent tier responsible
  assignedAgent: string; // Agent name
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: Record<string, any>;
  error?: string;
}

/**
 * Goal provided by user, converted to DAG by Orchestrator
 */
export interface Goal {
  id: string;
  title: string;
  description: string;
  voiceInput?: string; // Original voice input if applicable
  createdAt: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
  taskDAG: Task[];
  userContext: {
    habits: Record<string, any>;
    preferences: Record<string, any>;
    history: string[];
  };
}

/**
 * Message passed between agents
 */
export interface AgentMessage {
  id: string;
  from: string; // Agent name
  to: string | string[]; // Recipient agent(s)
  type: 'task_assignment' | 'status_update' | 'result' | 'error' | 'query';
  payload: Record<string, any>;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Memory record stored in IndexedDB
 */
export interface MemoryRecord {
  id: string;
  type: 'user_habit' | 'project_definition' | 'execution_log' | 'task_result';
  key: string;
  value: any;
  metadata: {
    createdAt: number;
    updatedAt: number;
    associatedGoalId?: string;
    relevanceScore?: number;
  };
}

/**
 * Agent state in the system
 */
export interface Agent {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  role: string;
  status: 'idle' | 'processing' | 'waiting';
  currentTaskId?: string;
  memory: {
    type: 'global' | 'contextual' | 'episodic' | 'semantic';
    capacity: number;
    currentUsage: number;
  };
  capabilities: string[];
}

/**
 * System configuration
 */
export interface JarvisConfig {
  groqApiKey: string;
  groqModel: string;
  voiceEnabled: boolean;
  voiceLanguage: string;
  maxConcurrentTasks: number;
  dbName: string;
  enableOfflineMode: boolean;
}

/**
 * Voice input/output configuration
 */
export interface VoiceConfig {
  enabled: boolean;
  language: string;
  voiceGender: 'male' | 'female' | 'neutral';
  speechRate: number; // 0.5 - 2.0
  pitch: number; // 0.5 - 2.0
}

/**
 * Execution result from a completed task
 */
export interface ExecutionResult {
  taskId: string;
  goalId: string;
  agentName: string;
  success: boolean;
  output?: any;
  error?: string;
  duration: number; // milliseconds
  timestamp: number;
}
