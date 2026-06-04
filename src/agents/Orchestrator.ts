import { Goal, Task, Agent, AgentMessage } from '../types'
import { getGroqClient, initializeGroqClient } from '../utils/groqClient'
import { getDatabase, initializeDatabase } from '../utils/indexedDB'
import { getMessageQueue } from '../utils/messageQueue'
import DAGProcessor from '../utils/dagProcessor'
import { BusinessMetrics, OrchestratorState, generateMockMetrics } from './orchestratorMetrics'
import { v4 as uuidv4 } from 'uuid'

/**
 * Tier 1: ORCHESTRATOR / CHIEF EXECUTIVE AGENT
 * Role: Director - Goal parsing, DAG creation, agent coordination
 */
class Orchestrator {
  private state: OrchestratorState
  private dagProcessor: DAGProcessor
  private agentRegistry: Map<string, Agent> = new Map()
  private groqClient: any
  private db: any
  private messageQueue: any

  constructor() {
    this.state = {
      isActive: false,
      currentMetrics: generateMockMetrics(),
      taskQueue: [],
      lastUpdate: Date.now(),
      mode: 'idle'
    }
    this.dagProcessor = new DAGProcessor()
  }

  /**
   * Initialize the Orchestrator
   */
  async initialize(groqApiKey: string): Promise<void> {
    console.log('🎯 Initializing Orchestrator...')

    try {
      // Initialize Groq client
      this.groqClient = initializeGroqClient(groqApiKey)

      // Initialize database
      this.db = await initializeDatabase('JarvisDB')

      // Initialize message queue
      this.messageQueue = getMessageQueue()

      // Register agent handlers
      this.registerAgentHandlers()

      // Load conversation history
      await this.loadConversationHistory()

      this.state.isActive = true
      console.log('✅ Orchestrator initialized successfully')
    } catch (error) {
      console.error('❌ Orchestrator initialization failed:', error)
      throw error
    }
  }

  /**
   * Register handlers for agent messages
   */
  private registerAgentHandlers(): void {
    const agents = ['designer', 'engineer', 'builder', 'researcher', 'critic']

    agents.forEach((agent) => {
      this.messageQueue.registerHandler(agent, async (message: AgentMessage) => {
        await this.handleAgentResponse(agent, message)
      })
    })
  }

  /**
   * Parse a user goal into executable tasks
   */
  async parseGoal(goalDescription: string): Promise<Goal> {
    console.log(`📋 Parsing goal: ${goalDescription}`)
    this.state.mode = 'processing'

    try {
      const systemPrompt = `You are JARVIS Orchestrator. Parse this user goal into a structured DAG (Directed Acyclic Graph) of tasks.

Respond ONLY with valid JSON:
{
  "title": "Goal title",
  "description": "Detailed description",
  "tasks": [
    {
      "id": "task_1",
      "title": "Task title",
      "description": "Task description",
      "tier": 1-4,
      "agent": "Agent name (orchestrator, designer, engineer, builder, researcher, critic)",
      "dependencies": ["task_ids"]
    }
  ]
}`

      const response = await this.groqClient.sendMessage(goalDescription, systemPrompt)

      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid JSON in response')

      const parsedGoal = JSON.parse(jsonMatch[0])

      // Create Goal object
      const goal: Goal = {
        id: uuidv4(),
        title: parsedGoal.title,
        description: parsedGoal.description,
        createdAt: Date.now(),
        status: 'planning',
        taskDAG: parsedGoal.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: 'pending' as const,
          dependencies: t.dependencies,
          priority: 'medium' as const,
          tier: t.tier,
          assignedAgent: t.agent,
          createdAt: Date.now()
        })),
        userContext: {
          habits: {},
          preferences: {},
          history: [goalDescription]
        }
      }

      // Save goal to database
      await this.db.saveGoal(goal)

      // Build and execute DAG
      this.dagProcessor.buildDAG(goal.taskDAG)
      goal.status = 'executing'

      this.state.taskQueue = goal.taskDAG
      this.state.mode = 'idle'

      return goal
    } catch (error) {
      console.error('❌ Goal parsing failed:', error)
      this.state.mode = 'idle'
      throw error
    }
  }

  /**
   * Automatically detect feature requests from customer emails
   */
  async analyzeCustomerEmails(): Promise<void> {
    console.log('📧 Analyzing customer emails for feature requests...')

    const metrics = this.state.currentMetrics
    const featureRequests = metrics.customerEmails.featureRequests

    if (featureRequests.length === 0) {
      console.log('✅ No new feature requests detected')
      return
    }

    for (const request of featureRequests) {
      console.log(`🔍 Processing feature request: "${request}"`)

      // Use Groq to generate technical requirements
      const systemPrompt = `You are a technical requirements engineer. Convert this feature request into a structured technical spec.

Respond ONLY with valid JSON:
{
  "feature": "Feature name",
  "description": "Detailed description",
  "technicalRequirements": ["Requirement 1", "Requirement 2"],
  "estimatedDays": number,
  "priority": "high" | "medium" | "low"
}`

      try {
        const spec = await this.groqClient.sendMessage(request, systemPrompt)
        const jsonMatch = spec.match(/\{[\s\S]*\}/)

        if (jsonMatch) {
          const requirements = JSON.parse(jsonMatch[0])
          console.log(`✅ Generated requirements for: ${requirements.feature}`)

          // Route to Engineering Manager
          const message: AgentMessage = {
            id: uuidv4(),
            from: 'orchestrator',
            to: 'engineer',
            type: 'task_assignment',
            payload: {
              feature: requirements.feature,
              requirements: requirements.technicalRequirements,
              priority: requirements.priority
            },
            timestamp: Date.now(),
            priority: 'high'
          }

          await this.messageQueue.enqueue(message)
        }
      } catch (error) {
        console.error('Error processing feature request:', error)
      }
    }
  }

  /**
   * Track content creation metrics
   */
  async trackContentMetrics(): Promise<void> {
    const metrics = this.state.currentMetrics
    const content = metrics.contentCreations

    console.log(`📊 Content Metrics:`)
    console.log(`  - Videos Created: ${content.shortFormVideos}`)
    console.log(`  - Total Views: ${content.totalViews}`)
    console.log(`  - Weekly Target: ${content.weeklyTarget}`)
    console.log(`  - Progress: ${((content.totalViews / content.weeklyTarget) * 100).toFixed(1)}%`)
  }

  /**
   * Track ad performance
   */
  async trackAdPerformance(): Promise<void> {
    const metrics = this.state.currentMetrics
    const ads = metrics.adPerformance

    console.log(`💰 Ad Performance Metrics:`)
    console.log(`  - Spend: $${ads.spentToday}`)
    console.log(`  - ROAS: ${ads.roasRatio}x`)
    console.log(`  - Top Performer: ${ads.topPerformer}`)
    console.log(`  - Weakest: ${ads.worstPerformer}`)
  }

  /**
   * Handle agent responses
   */
  private async handleAgentResponse(agentName: string, message: AgentMessage): Promise<void> {
    console.log(`📨 Message from ${agentName}:`, message.type)

    // Process based on message type
    switch (message.type) {
      case 'result':
        console.log(`✅ Task completed by ${agentName}:`, message.payload)
        break
      case 'error':
        console.error(`❌ Error from ${agentName}:`, message.payload.error)
        break
      case 'status_update':
        console.log(`⏳ Status update from ${agentName}:`, message.payload.status)
        break
    }
  }

  /**
   * Load conversation history from database
   */
  private async loadConversationHistory(): Promise<void> {
    try {
      const history = await this.db.getConversationHistory()
      if (history && this.groqClient) {
        this.groqClient.loadHistory(history)
        console.log('📜 Conversation history loaded')
      }
    } catch (error) {
      console.warn('Could not load conversation history:', error)
    }
  }

  /**
   * Save conversation history
   */
  async saveConversationHistory(): Promise<void> {
    try {
      if (this.groqClient) {
        const history = this.groqClient.getHistory()
        await this.db.saveConversationHistory(history)
      }
    } catch (error) {
      console.warn('Could not save conversation history:', error)
    }
  }

  /**
   * Get current state
   */
  getState(): OrchestratorState {
    return { ...this.state }
  }

  /**
   * Get current metrics
   */
  getMetrics(): BusinessMetrics {
    return { ...this.state.currentMetrics }
  }

  /**
   * Update metrics
   */
  updateMetrics(metrics: Partial<BusinessMetrics>): void {
    this.state.currentMetrics = { ...this.state.currentMetrics, ...metrics }
    this.state.lastUpdate = Date.now()
  }
}

// Singleton instance
let orchestratorInstance: Orchestrator | null = null

export const initializeOrchestrator = async (groqApiKey: string): Promise<Orchestrator> => {
  orchestratorInstance = new Orchestrator()
  await orchestratorInstance.initialize(groqApiKey)
  return orchestratorInstance
}

export const getOrchestrator = (): Orchestrator => {
  if (!orchestratorInstance) {
    throw new Error('Orchestrator not initialized. Call initializeOrchestrator first.')
  }
  return orchestratorInstance
}

export default Orchestrator
