/**
 * JARVIS TYPE DEFINITIONS - Autonomous Agency Matrix
 * Core data structures for multi-tier agent orchestration, business metrics, and task processing
 */

// ============================================================================
// SYSTEM STATE & METRICS
// ============================================================================

export interface SystemMetrics {
  cpuUsage: number; // 0-100%
  ramUsage: number; // GB
  ramTotal: number; // GB
  swapUsage: number; // GB
  swapTotal: number; // GB
  storageUsed: string; // "116G"
  storageFree: string; // "20G"
  powerLevel: number; // 0-100%
  networkDownload: number; // kbps
  networkUpload: number; // kbps
  timestamp: number;
}

export interface WasteStatus {
  filesPending: number;
  totalSize: string;
  lastCleanup: number;
}

// ============================================================================
// BUSINESS METRICS & ANALYTICS
// ============================================================================

export interface ShortFormVideoMetrics {
  videosCreatedDaily: number;
  videosCreatedWeekly: number;
  totalWeeklyViews: number;
  targetViews: number;
  growthTrend: number[]; // Weekly view counts
  lastUpdated: number;
}

export interface AdCampaignMetrics {
  totalSpent: number;
  roas: number; // Return on Ad Spend
  activeCreatives: CreativePerformance[];
  lastUpdated: number;
}

export interface CreativePerformance {
  name: string;
  status: 'OPTIMAL_PERFORMER' | 'AVERAGE_PERFORMER' | 'WEAKEST_PERFORMER';
  roi: number;
  spend: number;
  impressions: number;
}

export interface CustomerEmailMetrics {
  totalWeekly: number;
  resolvedAutomatically: number;
  requiresHuman: number;
  commonFeatureRequests: FeatureCluster[];
  lastUpdated: number;
}

export interface FeatureCluster {
  feature: string;
  requestCount: number;
  userIds: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

// ============================================================================
// AGENT SYSTEM TYPES
// ============================================================================

export type AgentTier = 1 | 2 | 3 | 4;

export interface AgentConfig {
  id: string;
  name: string;
  tier: AgentTier;
  role: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface ExecutionTask {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  assignedAgent: string;
  dependencies: string[];
  createdAt: number;
  completedAt?: number;
  result?: string;
  error?: string;
}

export interface DAGNode {
  id: string;
  task: string;
  deps: string[];
  agentAssigned: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

export interface ExecutionDAG {
  id: string;
  goal: string;
  nodes: DAGNode[];
  createdAt: number;
  completedAt?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
}

// ============================================================================
// VOICE & CONVERSATION TYPES
// ============================================================================

export interface VoiceMessage {
  id: string;
  type: 'USER_INPUT' | 'AGENT_RESPONSE';
  speaker: string;
  content: string;
  timestamp: number;
  audioUrl?: string;
}

export interface ConversationContext {
  sessionId: string;
  messages: VoiceMessage[];
  systemState: BusinessAgencyState;
  isActive: boolean;
  startedAt: number;
  lastActivityAt: number;
}

// ============================================================================
// BUSINESS AGENCY STATE
// ============================================================================

export interface BusinessAgencyState {
  systemMetrics: SystemMetrics;
  wasteStatus: WasteStatus;
  videoMetrics: ShortFormVideoMetrics;
  adMetrics: AdCampaignMetrics;
  emailMetrics: CustomerEmailMetrics;
  activeTasks: ExecutionTask[];
  executionDAGs: ExecutionDAG[];
  lastStateUpdate: number;
}

export interface EngineeredBackendSpec {
  featureName: string;
  description: string;
  technicalRequirements: string[];
  apiEndpoints: ApiEndpoint[];
  databaseSchema: DatabaseSchema;
  implementationStatus: 'READY_FOR_REVIEW' | 'IN_DEVELOPMENT' | 'DEPLOYED';
}

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  requestBody?: string;
  responseBody?: string;
}

export interface DatabaseSchema {
  tableName: string;
  fields: SchemaField[];
  indexes: string[];
}

export interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

// ============================================================================
// ORCHESTRATOR & MANAGER TYPES
// ============================================================================

export interface OrchestratorRequest {
  goal: string;
  context: Partial<BusinessAgencyState>;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: number;
}

export interface ManagerDecision {
  managerId: string;
  managerRole: 'DESIGN' | 'ENGINEERING';
  assignedTasks: ExecutionTask[];
  reasoning: string;
  timestamp: number;
}

export interface CriticReview {
  taskId: string;
  approved: boolean;
  feedback: string;
  suggestedFixes?: string[];
  timestamp: number;
}

// ============================================================================
// WORKER OUTPUT TYPES
// ============================================================================

export interface BuilderOutput {
  code: string;
  language: string;
  component: string;
  description: string;
  testCases: string[];
}

export interface ResearcherOutput {
  summary: string;
  sources: string[];
  keyFindings: string[];
  recommendations: string[];
}

// ============================================================================
// PERSISTENCE & STORAGE
// ============================================================================

export interface StoredMemory {
  id: string;
  type: 'HABIT' | 'PREFERENCE' | 'PROJECT' | 'EXECUTION_LOG' | 'CONVERSATION';
  content: string;
  embedding: number[];
  createdAt: number;
  lastAccessedAt: number;
  relevance: number;
}

export interface IndexedDBSchema {
  memories: StoredMemory[];
  systemState: BusinessAgencyState;
  executionHistory: ExecutionTask[];
  conversations: ConversationContext[];
}
