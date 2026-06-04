interface Message {
  id: string
  from: string
  to: string
  type: string
  payload: any
  timestamp: number
  priority: 'low' | 'medium' | 'high'
}

type MessageHandler = (message: Message) => Promise<void>

class MessageQueue {
  private queue: Message[] = []
  private handlers: Map<string, MessageHandler> = new Map()
  private processing = false

  /**
   * Register a handler for messages to a specific agent
   */
  registerHandler(agentId: string, handler: MessageHandler): void {
    this.handlers.set(agentId, handler)
  }

  /**
   * Enqueue a message
   */
  async enqueue(message: Message): Promise<void> {
    this.queue.push(message)
    this.queue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
    await this.processQueue()
  }

  /**
   * Process messages in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return
    this.processing = true

    while (this.queue.length > 0) {
      const message = this.queue.shift()
      if (!message) continue

      const handler = this.handlers.get(message.to)
      if (handler) {
        try {
          await handler(message)
        } catch (error) {
          console.error(`Error handling message to ${message.to}:`, error)
        }
      }
    }

    this.processing = false
  }

  /**
   * Get queue status
   */
  getStatus(): { queueLength: number; processing: boolean } {
    return {
      queueLength: this.queue.length,
      processing: this.processing
    }
  }
}

let messageQueueInstance: MessageQueue | null = null

export const getMessageQueue = (): MessageQueue => {
  if (!messageQueueInstance) {
    messageQueueInstance = new MessageQueue()
  }
  return messageQueueInstance
}
