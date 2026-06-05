/**
 * GROQ API CLIENT - Ultra-Low Latency LLM Inference
 * Sanitized for llama-3.3-70b-versatile
 */

interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: GroqMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GroqClient {
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1';
  private model: string;

  constructor() {
    // SAFELY READ ENV WITH HARDCODED FALLBACK
    this.apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
    this.model = (import.meta as any).env?.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';
    
    if (!this.apiKey) {
      console.warn('[GroqClient] WARNING: GROQ_API_KEY not configured');
    }
    
    console.log('[GroqClient] Initialized with model:', this.model);
  }

  async chat(
    messages: GroqMessage[],
    temperature: number = 0.7,
    maxTokens: number = 1024
  ): Promise<string> {
    try {
      // Sanitized payload for llama-3.3-70b-versatile
      const payload = {
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : String(msg.content)
        })),
        temperature,
        max_tokens: maxTokens
      };

      console.log('[GroqClient] Request payload model:', payload.model);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GroqClient] HTTP Error:', response.status, errorText);
        
        if (response.status === 400) {
          return '⚠️ JARVIS Error: Payload validation failed. Check model target compliance.';
        }
        if (response.status === 401) {
          return '⚠️ JARVIS Error: Invalid API key.';
        }
        if (response.status === 429) {
          return '⚠️ JARVIS Error: Rate limit exceeded.';
        }
        
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data: GroqResponse = await response.json();
      return data.choices[0]?.message?.content || '';
      
    } catch (error) {
      console.error('[GroqClient] Error:', error);
      return '⚠️ JARVIS Error: ' + (error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async stream(
    messages: GroqMessage[],
    temperature: number = 0.7,
    maxTokens: number = 1024,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const payload = {
        model: this.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: typeof msg.content === 'string' ? msg.content : String(msg.content)
        })),
        temperature,
        max_tokens: maxTokens,
        stream: true,
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GroqClient] Stream HTTP Error:', response.status);
        return '⚠️ JARVIS Error: Stream failed - ' + response.status;
      }

      const reader = response.body?.getReader();
      if (!reader) return '⚠️ JARVIS Error: No response body';

      let result = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                result += content;
                onChunk?.(content);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error('[GroqClient] Stream Error:', error);
      return '⚠️ JARVIS Error: ' + (error instanceof Error ? error.message : 'Stream failed');
    }
  }

  async analyzeMetrics(metricsJson: string): Promise<string> {
    return this.chat([
      { role: 'system', content: 'You are an expert business analyst.' },
      { role: 'user', content: 'Analyze these metrics:\n\n' + metricsJson },
    ]);
  }

  async generateVideoScript(topic: string, style: string): Promise<string> {
    return this.chat([
      { role: 'system', content: 'You are a creative video scriptwriter.' },
      { role: 'user', content: 'Write a ' + style + ' script about: ' + topic },
    ]);
  }

  async parseGoal(goal: string): Promise<string> {
    return this.chat([
      { role: 'system', content: 'You are a task decomposition expert.' },
      { role: 'user', content: goal },
    ], 0.4, 1024);
  }
}

// Singleton instance
export const groqClient = new GroqClient();
