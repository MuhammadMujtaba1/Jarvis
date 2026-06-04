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
