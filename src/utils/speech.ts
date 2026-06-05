/**
 * SPEECH UTILITY - JARVIS Premium Male Voice Engine
 * Strict male voice filtering with deep pitch override
 */

const VOICE_CONFIG = {
  rate: 0.9,
  pitch: 0.85,  // Deepened to avoid robotic/female tones
  volume: 1.0,
};

// STRICT male voice patterns - must contain one of these
const MALE_VOICE_PATTERNS = [
  'Male',
  'UK Male',
  'UK English Male',
  'Google UK English Male',
  'Microsoft David',
  'Microsoft Mark',
  'Microsoft James',
  'Microsoft Richard',
  'Desktop',
  'Chrome OS',
];

// ROBOTIC/FEMALE patterns to EXCLUDE completely
const EXCLUDE_PATTERNS = [
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
  'Google',
  'x-rjs',      // Exclude robotic variants like en-gb-x-rjs-local
  'x-gkh',
  'x-oyc',
  'x-rms',
  'local',      // Exclude local robotic variants
  'rjs',
  'gkh',
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
 * Check if voice name matches exclude pattern
 */
function isExcludedVoice(name: string): boolean {
  const lower = name.toLowerCase();
  return EXCLUDE_PATTERNS.some(pattern => lower.includes(pattern.toLowerCase()));
}

/**
 * Check if voice name matches male pattern
 */
function isMaleVoice(name: string): boolean {
  const lower = name.toLowerCase();
  return MALE_VOICE_PATTERNS.some(pattern => lower.includes(pattern.toLowerCase()));
}

/**
 * Select best premium male voice with strict filtering
 */
function selectPremiumMaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  console.log('[Speech] Available voices:', voices.map(v => v.name));

  // STRICT FILTER: Remove all excluded voices first
  let candidates = voices.filter(voice => !isExcludedVoice(voice.name));
  
  console.log('[Speech] After exclusions:', candidates.length, 'voices remain');

  // Must have explicit "Male" indicator
  candidates = candidates.filter(voice => isMaleVoice(voice.name));
  
  console.log('[Speech] After male filter:', candidates.length, 'voices remain');

  // If no strict male voices, try en-GB/en-US with deep pitch fallback
  if (candidates.length === 0) {
    console.log('[Speech] No explicit male voices - using EN fallback with deepened pitch');
    
    candidates = voices.filter(voice => 
      voice.lang.startsWith('en') && 
      !isExcludedVoice(voice.name)
    );
    
    // Sort by UK/US preference
    candidates.sort((a, b) => {
      const aIsUK = a.lang.includes('gb') || a.lang.includes('uk');
      const bIsUK = b.lang.includes('gb') || b.lang.includes('uk');
      if (aIsUK && !bIsUK) return -1;
      if (!aIsUK && bIsUK) return 1;
      return 0;
    });
  }

  if (candidates.length === 0) {
    console.warn('[Speech] No suitable voices found, using first available');
    return voices[0];
  }

  // Select first (best) candidate
  const selected = candidates[0];
  console.log('[Speech] SELECTED:', selected.name, '(lang:', selected.lang, ')');
  
  return selected;
}

/**
 * Speak text using Web Speech API - JARVIS premium male voice
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

  // Get available voices
  let voices = speechSynthesis.getVoices();
  
  // Chrome needs this trigger
  if (voices.length === 0) {
    speechSynthesis.getVoices();
  }

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(cleanText);

  // JARVIS VOICE SETTINGS: Deep, smooth, authoritative
  utterance.rate = VOICE_CONFIG.rate;
  utterance.pitch = VOICE_CONFIG.pitch;  // 0.85 - deep to avoid robotic tones
  utterance.volume = VOICE_CONFIG.volume;

  // Select premium male voice
  const selectedVoice = selectPremiumMaleVoice(voices);
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    // Ensure pitch stays deep even with voice
    utterance.pitch = VOICE_CONFIG.pitch;
  } else {
    // No suitable voice - force deep pitch as fallback
    utterance.pitch = 0.8;
    console.log('[Speech] No voice selected - using deep pitch fallback');
  }

  utterance.onerror = (event) => {
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      console.error('[Speech] Error:', event.error);
    }
  };

  utterance.onend = () => {
    console.log('[Speech] Done');
  };

  console.log('[Speech] Speaking:', cleanText.substring(0, 60) + '...');
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
