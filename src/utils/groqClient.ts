import axios, { AxiosInstance } from 'axios'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

class GroqClient {
  private apiKey: string
  private baseURL = 'https://api.groq.com/openai/v1'
  private client: AxiosInstance
  private conversationHistory: Message[] = []
  private maxHistoryLength = 10

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Send a message to Groq
   */
  async sendMessage(userMessage: string, systemPrompt?: string): Promise<string> {
    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      })

      // Build messages array
      const messages: Message[] = []

      if (systemPrompt) {
        messages.push({
          role: 'user',
          content: systemPrompt
        })
      }

      // Add recent conversation history
      messages.push(
        ...this.conversationHistory.slice(-this.maxHistoryLength)
      )

      const response = await this.client.post('/chat/completions', {
        model: 'mixtral-8x7b-32768',
        messages,
        temperature: 0.7,
        max_tokens: 512,
        top_p: 0.9
      })

      const assistantMessage =
        response.data.choices[0]?.message?.content || 'No response generated'

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      })

      return assistantMessage
    } catch (error) {
      console.error('Groq API error:', error)
      throw error
    }
  }

  /**
   * Load conversation history
   */
  loadHistory(history: Message[]): void {
    this.conversationHistory = history.slice(-this.maxHistoryLength)
  }

  /**
   * Get conversation history
   */
  getHistory(): Message[] {
    return [...this.conversationHistory]
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = []
  }
}

let groqClientInstance: GroqClient | null = null

export const initializeGroqClient = (apiKey: string): GroqClient => {
  groqClientInstance = new GroqClient(apiKey)
  return groqClientInstance
}

export const getGroqClient = (): GroqClient => {
  if (!groqClientInstance) {
    throw new Error('Groq client not initialized. Call initializeGroqClient first.')
  }
  return groqClientInstance
}
