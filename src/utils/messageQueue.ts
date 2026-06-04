/**
 * MESSAGE QUEUE - Inter-Agent Communication System
 * Enables asynchronous message passing between agents and workers
 */

interface Message {
  id: string;
  from: string;
  to: string;
  type: string;
  payload: Record<string, unknown>;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  timestamp: number;
  processed: boolean;
  processingTime?: number;
}

type MessageHandler = (message: Message) => Promise<void> | void;

export class MessageQueue {
  private queue: Map<string, Message[]> = new Map();
  private handlers: Map<string, MessageHandler[]> = new Map();
  private processedMessages: Map<string, number> = new Map();

  /**
   * Subscribe to messages for a specific recipient
   */
  subscribe(recipientId: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(recipientId)) {
      this.handlers.set(recipientId, []);
    }

    const handlerList = this.handlers.get(recipientId)!;
    handlerList.push(handler);

    // Return unsubscribe function
    return () => {
      const index = handlerList.indexOf(handler);
      if (index > -1) {
        handlerList.splice(index, 1);
      }
    };
  }

  /**
   * Send a message to an agent
   */
  async sendMessage(
    from: string,
    to: string,
    type: string,
    payload: Record<string, unknown>,
    priority: 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL'
  ): Promise<void> {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      from,
      to,
      type,
      payload,
      priority,
      timestamp: Date.now(),
      processed: false,
    };

    if (!this.queue.has(to)) {
      this.queue.set(to, []);
    }

    // Insert in priority order (HIGH first, then NORMAL, then LOW)
    const messages = this.queue.get(to)!;
    const priorityValue = { HIGH: 0, NORMAL: 1, LOW: 2 };
    const insertIndex = messages.findIndex((m) => priorityValue[m.priority] > priorityValue[priority]);

    if (insertIndex === -1) {
      messages.push(message);
    } else {
      messages.splice(insertIndex, 0, message);
    }

    // Process immediately if handlers are registered
    await this.processMessage(to, message);
  }

  /**
   * Process a message through registered handlers
   */
  private async processMessage(recipientId: string, message: Message): Promise<void> {
    const handlers = this.handlers.get(recipientId) || [];

    const startTime = Date.now();

    for (const handler of handlers) {
      try {
        await Promise.resolve(handler(message));
      } catch (error) {
        console.error(`❌ Message handler error for ${recipientId}:`, error);
      }
    }

    message.processed = true;
    message.processingTime = Date.now() - startTime;
    this.processedMessages.set(message.id, message.processingTime);
  }

  /**
   * Get pending messages for a recipient
   */
  getPendingMessages(recipientId: string): Message[] {
    return (this.queue.get(recipientId) || []).filter((m) => !m.processed);
  }

  /**
   * Get all messages for a recipient
   */
  getAllMessages(recipientId: string): Message[] {
    return this.queue.get(recipientId) || [];
  }

  /**
   * Clear processed messages
   */
  clearProcessed(recipientId: string): void {
    const messages = this.queue.get(recipientId);
    if (messages) {
      const filtered = messages.filter((m) => !m.processed);
      this.queue.set(recipientId, filtered);
    }
  }

  /**
   * Get queue statistics
   */
  getStats(recipientId: string) {
    const messages = this.getAllMessages(recipientId);
    const processed = messages.filter((m) => m.processed).length;
    const pending = messages.filter((m) => !m.processed).length;
    const avgProcessingTime =
      messages.length > 0
        ? messages.reduce((sum, m) => sum + (m.processingTime || 0), 0) / messages.length
        : 0;

    return {
      total: messages.length,
      processed,
      pending,
      avgProcessingTime: Math.round(avgProcessingTime),
      oldestMessage: messages[0]?.timestamp || null,
    };
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.queue.clear();
    this.processedMessages.clear();
  }
}

// Singleton instance
export const messageQueue = new MessageQueue();
