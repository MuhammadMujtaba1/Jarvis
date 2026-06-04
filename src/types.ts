// ============================================================================
// CORE TYPES
// ============================================================================

export interface Agent {
  id: string
  name: string
  tier: 1 | 2 | 3 | 4
  role: string
  status: 'idle' | 'processing' | 'waiting'
  memory: {
    type: 'global' | 'contextual' | 'episodic' | 'semantic'
    capacity: number
    currentUsage: number
  }
  capabilities: string[]
}

export interface AgentMessage {
  id: string
  from: string
  to: string
  type: 'task_assignment' | 'result' | 'error' | 'status_update'
  payload: any
  timestamp: number
  priority: 'low' | 'medium' | 'high'
}

export interface Goal {
  id: string
  title: string
  description: string
  createdAt: number
  status: 'planning' | 'executing' | 'completed' | 'failed'
  taskDAG: Task[]
  userContext: {
    habits: Record<string, any>
    preferences: Record<string, any>
    history: string[]
  }
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  dependencies: string[]
  priority: 'high' | 'medium' | 'low'
  tier: 1 | 2 | 3 | 4
  assignedAgent: string
  createdAt: number
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

export interface ExecutionTask {
  id: string
  title: string
  description: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  assignedAgent: string
  dependencies: string[]
  createdAt: number
  result?: string
  completedAt?: number
}

export interface DAGNode {
  id: string
  task: string
  deps: string[]
  agentAssigned: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

export interface ExecutionDAG {
  id: string
  goal: string
  nodes: DAGNode[]
  createdAt: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
}

// ============================================================================
// AGENT OUTPUT TYPES
// ============================================================================

export interface BuilderOutput {
  code: string
  language: string
  component: string
  description: string
  testCases: string[]
}

export interface ResearcherOutput {
  summary: string
  sources: string[]
  keyFindings: string[]
  recommendations: string[]
}

export interface CriticReview {
  taskId: string
  approved: boolean
  feedback: string
  timestamp: number
}

export interface ManagerDecision {
  taskId: string
  decision: 'APPROVE' | 'REJECT' | 'REVIEW'
  rationale: string
  timestamp: number
}

export interface OrchestratorRequest {
  goal: string
  priority?: 'HIGH' | 'NORMAL' | 'LOW'
  context?: Record<string, any>
}

// ============================================================================
// BUSINESS METRICS TYPES
// ============================================================================

export interface ShortFormVideoMetrics {
  videosCreatedDaily: number
  videosCreatedWeekly: number
  totalWeeklyViews: number
  targetViews: number
  growthTrend: number[]
}

export interface AdCreative {
  name: string
  roi: number
  spent: number
  impressions: number
}

export interface AdCampaignMetrics {
  totalSpent: number
  totalBudget: number
  roas: number
  activeCreatives: AdCreative[]
}

export interface FeatureCluster {
  feature: string
  requestCount: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  userIds: string[]
}

export interface CustomerEmailMetrics {
  totalWeekly: number
  resolvedAutomatically: number
  requiresHuman: number
  commonFeatureRequests: FeatureCluster[]
}

// ============================================================================
// SYSTEM STATE TYPES
// ============================================================================

export interface BusinessAgencyState {
  id: string
  isActive: boolean
  videoMetrics: ShortFormVideoMetrics
  adMetrics: AdCampaignMetrics
  emailMetrics: CustomerEmailMetrics
  executionDAGs: ExecutionDAG[]
  lastStateUpdate: number
  systemMetrics: {
    cpuUsage: number
    ramUsage: number
    ramTotal: number
    powerLevel: number
    storageUsed: number
    storageFree: number
    networkUpload: number
    networkDownload: number
  }
}

// ============================================================================
// MEMORY & CONVERSATION TYPES
// ============================================================================

export interface StoredMemory {
  id: string
  type: 'semantic' | 'episodic' | 'contextual'
  content: string
  embedding?: number[]
  relevance: number
  createdAt: number
  lastAccessedAt: number
  agentId?: string
}

export interface VoiceMessage {
  id: string
  sessionId: string
  text: string
  timestamp: number
  isUser: boolean
  confidence: number
}

export interface ConversationContext {
  sessionId: string
  startedAt: number
  lastActivityAt: number
  messages: VoiceMessage[]
  isActive: boolean
  language: string
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface JarvisConfig {
  groqApiKey: string
  groqModel: string
  voiceEnabled: boolean
  voiceLanguage: string
}
