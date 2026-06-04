import Groq from 'groq-sdk'
import { AgentMessage } from '../types'

class GroqClient {
  private client: Groq
  private model: string
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []

  constructor(apiKey: string, model: string = 'mixtral-8x7b-32768') {
    if (!apiKey) {
      throw new Error('Groq API key is required')
    }
    
    this.client = new Groq({ apiKey, dangerouslyAllowBrowser: true })
    this.model = model
  }

  /**
   * Send a message to Groq and get a response
   */
  async sendMessage(userMessage: string, systemPrompt?: string): Promise<string> {
    try {
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      })

      const messages = systemPrompt
        ? [
            { role: 'system' as const, content: systemPrompt },
            ...this.conversationHistory
          ]
        : this.conversationHistory

      const response = await this.client.chat.completions.create({
        messages: messages as any,
        model: this.model,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false
      })

      const assistantMessage = response.choices[0]?.message?.content || ''
      
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      })

      return assistantMessage
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Groq API error:', errorMsg)
      throw error
    }
  }

  /**
   * Stream a message response
   */
  async *streamMessage(userMessage: string, systemPrompt?: string): AsyncGenerator<string> {
    try {
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      })

      const messages = systemPrompt
        ? [
            { role: 'system' as const, content: systemPrompt },
            ...this.conversationHistory
          ]
        : this.conversationHistory

      const stream = await this.client.chat.completions.create({
        messages: messages as any,
        model: this.model,
        temperature: 0.7,
        max_tokens: 1024,
        stream: true
      })

      let fullResponse = ''

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          yield content
        }
      }

      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse
      })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Groq streaming error:', errorMsg)
      throw error
    }
  }

  /**
   * Parse a user goal into an execution plan
   */
  async parseGoal(goalDescription: string): Promise<any> {
    const systemPrompt = `You are JARVIS, an autonomous agent orchestrator. Analyze the user's goal and break it down into a structured execution plan (DAG - Directed Acyclic Graph).

Respond ONLY with valid JSON in this format:
{
  "title": "Goal title",
  "description": "Detailed goal description",
  "tasks": [
    {
      "id": "task_1",
      "title": "Task title",
      "description": "Task description",
      "tier": 1-4,
      "agent": "Agent name",
      "dependencies": ["task_ids"]
    }
  ]
}`

    const response = await this.sendMessage(goalDescription, systemPrompt)
    
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      throw new Error('Invalid JSON in response')
    } catch (error) {
      console.error('Failed to parse goal response:', error)
      throw error
    }
  }

  /**
   * Get code generation from a task description
   */
  async generateCode(taskDescription: string, context?: string): Promise<string> {
    const systemPrompt = `You are EVA, the Builder agent. Generate clean, production-ready React/TypeScript code based on the task description.

Return ONLY the code without markdown formatting or explanation.`

    const userMessage = context
      ? `${context}\n\nTask: ${taskDescription}`
      : taskDescription

    return await this.sendMessage(userMessage, systemPrompt)
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = []
  }

  /**
   * Get conversation history for persistence
   */
  getHistory(): Array<{ role: 'user' | 'assistant'; content: string }> {
    return [...this.conversationHistory]
  }

  /**
   * Load conversation history
   */
  loadHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>): void {
    this.conversationHistory = [...history]
  }
}

// Singleton instance
let groqInstance: GroqClient | null = null

export const initializeGroqClient = (apiKey: string, model?: string): GroqClient => {
  groqInstance = new GroqClient(apiKey, model)
  return groqInstance
}

export const getGroqClient = (): GroqClient => {
  if (!groqInstance) {
    throw new Error('Groq client not initialized. Call initializeGroqClient first.')
  }
  return groqInstance
}

export default GroqClient
