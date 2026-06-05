/**
 * SPEECH UTILITY - Text-to-Speech for JARVIS Responses
 * Uses Web Speech API with markdown filtering
 */

const VOICE_CONFIG = {
  rate: 0.95,
  pitch: 1.1,
  volume: 1.0,
};

/**
 * Strip markdown formatting from text before speaking
 */
export function stripMarkdown(text: string): string {
  return text
    // Remove bold/italic markers
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    // Trim
    .trim();
}

/**
 * Speak text using Web Speech API
 */
export function speak(text: string, options?: { interrupt?: boolean }): void {
  if (!text || typeof window === 'undefined') return;

  const { speechSynthesis } = window;
  if (!speechSynthesis) {
    console.warn('[Speech] Web Speech API not available');
    return;
  }

  // Interrupt current speech if requested
  if (options?.interrupt) {
    speechSynthesis.cancel();
  }

  // Clean markdown from text
  const cleanText = stripMarkdown(text);
  if (!cleanText) return;

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Configure voice
  utterance.rate = VOICE_CONFIG.rate;
  utterance.pitch = VOICE_CONFIG.pitch;
  utterance.volume = VOICE_CONFIG.volume;

  // Try to find a good English voice
  const voices = speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => 
    v.name.includes('Google') || 
    v.name.includes('Microsoft') ||
    v.name.includes('Samantha') ||
    v.lang.startsWith('en-')
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.onerror = (event) => {
    if (event.error !== 'interrupted') {
      console.error('[Speech] Error:', event.error);
    }
  };

  // Speak
  speechSynthesis.speak(utterance);
}

/**
 * Stop current speech
 */
export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

/**
 * Get available voices (loads async)
 */
export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis!.getVoices());
      };
    }
  });
}
