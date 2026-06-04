import { Agent, AgentMessage } from '../types'
import { getGroqClient } from '../utils/groqClient'
import { getMessageQueue } from '../utils/messageQueue'
import { v4 as uuidv4 } from 'uuid'

/**
 * Tier 3: BUILDER / CODE GENERATOR AGENT (EVA CODER CORE)
 * Role: Write clean, modular React/TypeScript code
 */
class Builder implements Agent {
  id = 'builder'
  name = 'Builder'
  tier: 1 | 2 | 3 | 4 = 3
  role = 'Code Generator - React/TypeScript implementation'
  status: 'idle' | 'processing' | 'waiting' = 'idle'
  memory = {
    type: 'episodic' as const,
    capacity: 300,
    currentUsage: 0
  }
  capabilities = ['code_generation', 'component_creation', 'refactoring']
  private groqClient = getGroqClient()
  private messageQueue = getMessageQueue()

  /**
   * Generate code for a task
   */
  async generateCode(taskDescription: string, requirements: string[]): Promise<string> {
    console.log('💻 Builder generating code for:', taskDescription)

    this.status = 'processing'

    try {
      const systemPrompt = `You are EVA, the Builder agent. Generate clean, production-ready TypeScript code.

Generate ONLY the code without markdown formatting or explanation.

Requirements:
${requirements.map((r) => `- ${r}`).join('\n')}`

      const code = await this.groqClient.sendMessage(taskDescription, systemPrompt)

      console.log('✅ Code generated successfully')
      this.status = 'idle'

      return code
    } catch (error) {
      console.error('❌ Code generation failed:', error)
      this.status = 'idle'
      throw error
    }
  }

  /**
   * Process task assignment
   */
  async processTasks(payload: any): Promise<void> {
    console.log('📝 Builder processing tasks:', payload.feature)

    try {
      // Generate code for each task
      for (const task of payload.tasks) {
        const code = await this.generateCode(task.title, payload.requirements)

        // Send to Critic for validation
        const message: AgentMessage = {
          id: uuidv4(),
          from: this.name,
          to: 'critic',
          type: 'task_assignment',
          payload: {
            taskId: task.id,
            code,
            description: task.title
          },
          timestamp: Date.now(),
          priority: 'high'
        }

        await this.messageQueue.enqueue(message)
      }

      console.log('✅ All code generated and sent to Critic')
    } catch (error) {
      console.error('❌ Task processing failed:', error)
    }
  }
}

export default Builder
