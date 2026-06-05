/**
 * SPEECH UTILITY - JARVIS Text-to-Speech Engine
 * Premium male voice with intelligent, calculated tone
 */

const VOICE_CONFIG = {
  rate: 0.92,
  pitch: 0.9,
  volume: 1.0,
};

// Priority list for male voices (UK/US English preferred)
const MALE_VOICE_PRIORITY = [
  'UK Male',
  'UK English Male', 
  'Google UK English Male',
  'Google UK English',
  'David',
  'Mark',
  'James',
  'Richard',
  'Microsoft David',
  'en-GB',
  'en-GB-WLS',
  'Male',
];

const EXCLUDED_VOICES = [
  'Female',
  'Zira',
  'Susan',
  'Samantha',
  'Victoria',
  'Karen',
  'Moira',
  'Tessa',
  'Fiona',
  'Haruka',
  'Yelda',
];

/**
 * Strip markdown formatting from text before speaking
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Find the best male voice for JARVIS
 */
function selectBestMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  // Filter out female voices first
  const maleVoices = voices.filter(voice => {
    const name = voice.name.toLowerCase();
    return !EXCLUDED_VOICES.some(excluded => name.includes(excluded.toLowerCase()));
  });

  if (!maleVoices.length) {
    console.warn('[Speech] No male voices found, using default');
    return voices[0];
  }

  // Score each voice based on priority match
  const scoredVoices = maleVoices.map(voice => {
    let score = 0;
    const name = voice.name.toLowerCase();
    const lang = voice.lang.toLowerCase();

    // UK English bonus (primary for JARVIS)
    if (lang.includes('en-gb') || lang.includes('en-uk')) {
      score += 100;
    }

    // Priority keywords
    MALE_VOICE_PRIORITY.forEach((keyword, index) => {
      if (name.includes(keyword.toLowerCase())) {
        score += (50 - index);
      }
    });

    // English language bonus
    if (lang.startsWith('en')) {
      score += 25;
    }

    // Prefer local voices (more reliable)
    if (!voice.localService) {
      score -= 10;
    }

    return { voice, score };
  });

  scoredVoices.sort((a, b) => b.score - a.score);
  
  const selected = scoredVoices[0]?.voice;
  console.log('[Speech] Selected voice:', selected?.name, '(lang:', selected?.lang, ')');
  
  return selected;
}

/**
 * Speak text using Web Speech API - JARVIS style
 */
export function speak(text: string, options?: { interrupt?: boolean }): void {
  if (!text || typeof window === 'undefined') return;

  const { speechSynthesis } = window;
  if (!speechSynthesis) {
    console.warn('[Speech] Web Speech API not available');
    return;
  }

  if (options?.interrupt) {
    speechSynthesis.cancel();
  }

  const cleanText = stripMarkdown(text);
  if (!cleanText) return;

  let voices = speechSynthesis.getVoices();
  if (voices.length === 0) {
    speechSynthesis.getVoices();
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);

  // JARVIS voice settings: calm, intelligent, calculated
  utterance.rate = VOICE_CONFIG.rate;
  utterance.pitch = VOICE_CONFIG.pitch;
  utterance.volume = VOICE_CONFIG.volume;

  const selectedVoice = selectBestMaleVoice(voices);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  utterance.onerror = (event) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.error('[Speech] Error:', event.error);
    }
  };

  utterance.onend = () => {
    console.log('[Speech] Finished');
  };

  console.log('[Speech] Speaking:', cleanText.substring(0, 50) + '...');
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
 * Get available voices
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
