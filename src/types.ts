// ============================================================================
// AGENT STATUS TYPES - 4-Tier State Machine
// ============================================================================

export type AgentStatus = 
  | 'IDLE' 
  | 'WAKING_UP' 
  | 'PROCESSING' 
  | 'SUBMITTING' 
  | 'REVIEWING' 
  | 'COMPLETED' 
  | 'FAILED';

export type AgentTier = 1 | 2 | 3 | 4;

export interface AgentConfig {
  id: string;
  name: string;
  tier: AgentTier;
  role: string;
  description: string;
  memoryType: 'global' | 'contextual' | 'episodic' | 'semantic';
}

// ============================================================================
// AGENT SUBMISSION REGISTRY
// ============================================================================

export interface AgentSubmission {
  id: string;
  agentId: string;
  agentName: string;
  tier: AgentTier;
  timestamp: string;
  promptAssigned: string;
  outputData: string | object;
  status: 'approved' | 'rejected_by_qa' | 'pending';
  qaFeedback?: string;
  artifactsCreated?: string[];
}

// ============================================================================
// AGENT STATE STORE
// ============================================================================

export interface AgentState {
  agentId: string;
  status: AgentStatus;
  currentTask?: string;
  lastActivity: number;
  submissions: string[];
  errors: string[];
}

export interface AgentStore {
  agents: Map<string, AgentState>;
  setAgentStatus: (agentId: string, status: AgentStatus, task?: string) => void;
  getAgentStatus: (agentId: string) => AgentState | undefined;
  getAllAgents: () => AgentState[];
  wakeUpAllAgents: () => void;
}

// ============================================================================
// EXISTING TYPES (Preserved)
// ============================================================================

export interface Agent {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  role: string;
  status: 'idle' | 'processing' | 'waiting';
  memory: {
    type: 'global' | 'contextual' | 'episodic' | 'semantic';
    capacity: number;
    currentUsage: number;
  };
  capabilities: string[];
}

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'task_assignment' | 'result' | 'error' | 'status_update';
  payload: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  status: 'planning' | 'executing' | 'completed' | 'failed';
  taskDAG: Task[];
  userContext: {
    habits: Record<string, any>;
    preferences: Record<string, any>;
    history: string[];
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  dependencies: string[];
  priority: 'high' | 'medium' | 'low';
  tier: 1 | 2 | 3 | 4;
  assignedAgent: string;
  createdAt: number;
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface ExecutionTask {
  id: string;
  task: string;
  status: TaskStatus;
  agentAssigned: string;
  result?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

export interface DAGNode {
  id: string;
  task: string;
  deps: string[];
  status: TaskStatus;
  agentAssigned: string;
}

export interface ExecutionDAG {
  id: string;
  goal: string;
  nodes: DAGNode[];
  createdAt: number;
}

export interface ShortFormVideoMetrics {
  videosCreatedWeekly: number;
  videosCreatedDaily: number;
  totalWeeklyViews: number;
  targetViews: number;
  growthTrend: number[];
  engagementRate: number;
  avgWatchTimeSeconds: number;
  topPerformingVideo: string;
}

export interface AdCreative {
  id: string;
  name: string;
  format: string;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
}

export interface AdCampaignMetrics {
  totalSpent: number;
  roas: number;
  activeCreatives: AdCreative[];
}

export interface CustomerEmailMetrics {
  totalWeekly: number;
  resolvedAutomatically: number;
  requiresHuman: number;
  commonFeatureRequests: FeatureCluster[];
}

export interface FeatureCluster {
  feature: string;
  requestCount: number;
  priority: 'high' | 'medium' | 'low';
  userIds: string[];
}

export interface BuilderOutput {
  code: string;
  language: string;
  dependencies: string[];
  filePath?: string;
}

export interface ResearcherOutput {
  findings: string[];
  sources: string[];
  confidence: number;
}

export interface CriticReview {
  score: number;
  issues: string[];
  suggestions: string[];
  approved: boolean;
}

export interface ManagerDecision {
  action: string;
  reasoning: string;
  confidence: number;
}

export interface OrchestratorRequest {
  goal: string;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  context?: any;
}

export interface BusinessAgencyState {
  id: string;
  videoMetrics: ShortFormVideoMetrics;
  adMetrics: AdCampaignMetrics;
  emailMetrics: CustomerEmailMetrics;
  systemMetrics: SystemMetrics;
  executionDAGs: ExecutionDAG[];
  lastStateUpdate: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  ramUsage: number;
  ramTotal: number;
  storageUsed: number;
  storageFree: number;
  networkUpload: number;
  networkDownload: number;
  powerLevel: number;
}

export interface VoiceMessage {
  id: string;
  type: 'USER_INPUT' | 'AGENT_RESPONSE';
  speaker: string;
  content: string;
  timestamp: number;
}

export interface ConversationContext {
  sessionId: string;
  messages: VoiceMessage[];
  systemState?: BusinessAgencyState;
  isActive: boolean;
  lastActivityAt: number;
  language?: string;
}

export type MemoryType = 'contextual' | 'episodic' | 'semantic';

export interface StoredMemory {
  id: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  importance: number;
  createdAt: number;
  lastAccessedAt: number;
}

export interface JarvisConfig {
  groqApiKey: string;
  groqModel: string;
  voiceEnabled: boolean;
  voiceLanguage: string;
}
