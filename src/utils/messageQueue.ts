import { AgentMessage } from '../types'

class MessageQueue {
  private queue: AgentMessage[] = []
  private processing = false
  private handlers: Map<string, (message: AgentMessage) => Promise<void>> = new Map()

  /**
   * Register a message handler for a specific agent
   */
  registerHandler(
    agentName: string,
    handler: (message: AgentMessage) => Promise<void>
  ): void {
    this.handlers.set(agentName, handler)
  }

  /**
   * Send a message to the queue
   */
  async enqueue(message: AgentMessage): Promise<void> {
    this.queue.push(message)
    console.log(`📨 Message queued: ${message.from} -> ${message.to}`)

    if (!this.processing) {
      await this.processQueue()
    }
  }

  /**
   * Process messages in the queue
   */
  private async processQueue(): Promise<void> {
    this.processing = true

    while (this.queue.length > 0) {
      // Sort by priority
      this.queue.sort((a, b) => {
        const priorityMap = { high: 3, medium: 2, low: 1 }
        return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0)
      })

      const message = this.queue.shift()
      if (!message) break

      try {
        const recipients = Array.isArray(message.to) ? message.to : [message.to]

        for (const recipient of recipients) {
          const handler = this.handlers.get(recipient)
          if (handler) {
            await handler(message)
          } else {
            console.warn(`⚠️ No handler for agent: ${recipient}`)
          }
        }
      } catch (error) {
        console.error(`❌ Error processing message from ${message.from}:`, error)
      }
    }

    this.processing = false
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = []
  }
}

// Singleton instance
let queueInstance: MessageQueue | null = null

export const getMessageQueue = (): MessageQueue => {
  if (!queueInstance) {
    queueInstance = new MessageQueue()
  }
  return queueInstance
}

export default MessageQueue
