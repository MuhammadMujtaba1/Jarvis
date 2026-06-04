/**
 * GROQ API CLIENT - Ultra-Low Latency LLM Inference
 * Handles all communication with Groq's inference matrix
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
  private model = 'mixtral-8x7b-32768';

  constructor() {
    // DIAGNOSTIC FIX: Safe import.meta access
    this.apiKey = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️ GROQ_API_KEY not configured in environment');
    }
  }

  async chat(
    messages: GroqMessage[],
    temperature: number = 0.7,
    maxTokens: number = 2000
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data: GroqResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('❌ Groq API Error:', error);
      throw error;
    }
  }

  async stream(
    messages: GroqMessage[],
    temperature: number = 0.7,
    maxTokens: number = 2000,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

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
      console.error('❌ Groq Stream Error:', error);
      throw error;
    }
  }

  /**
   * Generate JSON response from Groq for structured data
   */
  async generateJSON<T>(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.3
  ): Promise<T> {
    const response = await this.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      2000
    );

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : response;
      return JSON.parse(jsonString);
    } catch {
      throw new Error('Failed to parse JSON response from Groq');
    }
  }

  /**
   * Analyze business metrics and provide recommendations
   */
  async analyzeMetrics(metricsJson: string): Promise<string> {
    return this.chat([
      {
        role: 'system',
        content: `You are an expert business analyst. Analyze the provided metrics and provide actionable recommendations.
Keep responses concise and data-driven. Format with bullet points for clarity.`,
      },
      {
        role: 'user',
        content: `Analyze these business metrics and provide strategic recommendations:\n\n${metricsJson}`,
      },
    ]);
  }

  /**
   * Resolve customer support emails automatically
   */
  async resolveCustomerEmail(emailContent: string): Promise<string> {
    return this.chat([
      {
        role: 'system',
        content: `You are a professional customer support agent. Respond to customer emails professionally and helpfully.
Keep responses concise. If the issue is technical, provide clear step-by-step guidance.
If you cannot resolve it, recommend escalation to engineering.`,
      },
      {
        role: 'user',
        content: emailContent,
      },
    ]);
  }

  /**
   * Generate backend specification from feature cluster
   */
  async generateBackendSpec(featureDescription: string): Promise<string> {
    return this.chat(
      [
        {
          role: 'system',
          content: `You are a senior backend architect. Generate a comprehensive technical specification for the requested feature.
Include: API endpoints, database schema, data models, and implementation considerations.
Format the output as structured JSON.`,
        },
        {
          role: 'user',
          content: `Generate a backend specification for: ${featureDescription}`,
        },
      ],
      0.3,
      3000
    );
  }

  /**
   * Generate script for short-form video content
   */
  async generateVideoScript(topic: string, style: string): Promise<string> {
    return this.chat([
      {
        role: 'system',
        content: `You are a creative video scriptwriter specializing in short-form content.
Write engaging, punchy scripts under 60 seconds. Include visual cues in [brackets].
Keep language simple and conversational.`,
      },
      {
        role: 'user',
        content: `Write a ${style} short-form video script about: ${topic}`,
      },
    ]);
  }

  /**
   * Parse natural language goal into structured execution plan
   */
  async parseGoal(goal: string): Promise<string> {
    return this.chat(
      [
        {
          role: 'system',
          content: `You are a task decomposition expert. Break down goals into specific, actionable tasks.
Return a JSON structure with task array, each having: title, description, priority, estimated_duration_hours.`,
        },
        {
          role: 'user',
          content: goal,
        },
      ],
      0.4,
      2000
    );
  }
}

// Singleton instance
export const groqClient = new GroqClient();
