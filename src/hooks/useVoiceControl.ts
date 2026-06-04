/**
 * VOICE CONTROL HOOK - Web Speech API Integration
 * Handles voice input recognition, processing, and synthesis responses
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { orchestrator } from '../agents/Orchestrator';
import { dbStore } from '../utils/indexedDB';
import { VoiceMessage, ConversationContext } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface VoiceControlState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  lastMessage: VoiceMessage | null;
  error: string | null;
}

const WAKE_WORD = 'hey jarvis';
const ACTIVATION_PHRASE = "wake up daddy's home";

export function useVoiceControl() {
  const [state, setState] = useState<VoiceControlState>({
    isListening: false,
    isSpeaking: false,
    transcript: '',
    lastMessage: null,
    error: null,
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const conversationRef = useRef<ConversationContext | null>(null);
  const continuousListeningRef = useRef(false);

  /**
   * Initialize Web Speech API
   */
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState((prev) => ({
        ...prev,
        error: 'Speech Recognition not supported in this browser',
      }));
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setState((prev) => ({ ...prev, isListening: true, error: null }));
    };

    recognitionRef.current.onresult = async (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Check for wake word
      if (!continuousListeningRef.current) {
        const lowerTranscript = (finalTranscript || interimTranscript).toLowerCase();
        if (lowerTranscript.includes(WAKE_WORD) && lowerTranscript.includes(ACTIVATION_PHRASE)) {
          continuousListeningRef.current = true;
          await handleWakeUp();
          return;
        }
      }

      setState((prev) => ({
        ...prev,
        transcript: finalTranscript || interimTranscript,
      }));

      // Process final transcript
      if (finalTranscript) {
        await processUserInput(finalTranscript.trim());
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      setState((prev) => ({
        ...prev,
        error: `Speech recognition error: ${event.error}`,
      }));
    };

    recognitionRef.current.onend = () => {
      setState((prev) => ({ ...prev, isListening: false }));

      // Restart if continuous listening is enabled
      if (continuousListeningRef.current) {
        recognitionRef.current.start();
      }
    };

    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  /**
   * Handle wake word activation
   */
  const handleWakeUp = useCallback(async () => {
    console.log('🎤 JARVIS ACTIVATED: Hey! Ready to help.');

    // Get system state
    const systemState = await dbStore.getSystemState();
    if (!systemState) return;

    // Create or update conversation context
    const sessionId = uuidv4();
    conversationRef.current = {
      sessionId,
      messages: [],
      systemState,
      isActive: true,
      startedAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    // Generate greeting with metrics
    const summary = await orchestrator.getSystemSummary();
    const greeting = `Good evening, sir. I'm fully operational. ${summary}`;

    await speakResponse(greeting);
    await storeMessage('JARVIS', greeting);
  }, []);

  /**
   * Process user voice input
   */
  const processUserInput = useCallback(
    async (input: string) => {
      if (!input.trim() || !continuousListeningRef.current) return;

      console.log('👤 User:', input);

      // Store user message
      await storeMessage('USER', input);

      // Get AI response
      try {
        const response = await orchestrator.conversationResponse(input);
        console.log('🤖 JARVIS:', response);

        // Store agent response
        await storeMessage('JARVIS', response);

        // Synthesize speech
        await speakResponse(response);
      } catch (error) {
        const errorMsg = `I encountered an error processing your request: ${error}`;
        await speakResponse(errorMsg);
      }
    },
    []
  );

  /**
   * Speak response using Web Speech API
   */
  const speakResponse = useCallback(async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setState((prev) => ({ ...prev, isSpeaking: true }));

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setState((prev) => ({ ...prev, isSpeaking: false }));
        resolve();
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setState((prev) => ({
          ...prev,
          isSpeaking: false,
          error: 'Speech synthesis failed',
        }));
        resolve();
      };

      synthRef.current.speak(utterance);
    });
  }, []);

  /**
   * Store voice message in IndexedDB
   */
  const storeMessage = useCallback(async (speaker: string, content: string): Promise<void> => {
    const message: VoiceMessage = {
      id: uuidv4(),
      type: speaker === 'USER' ? 'USER_INPUT' : 'AGENT_RESPONSE',
      speaker,
      content,
      timestamp: Date.now(),
    };

    if (conversationRef.current) {
      conversationRef.current.messages.push(message);
      conversationRef.current.lastActivityAt = Date.now();
      await dbStore.storeConversation(conversationRef.current);
    }

    setState((prev) => ({
      ...prev,
      lastMessage: message,
    }));
  }, []);

  /**
   * Start listening for voice input
   */
  const startListening = useCallback(() => {
    if (recognitionRef.current && !state.isListening) {
      recognitionRef.current.start();
    }
  }, [state.isListening]);

  /**
   * Stop listening
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      continuousListeningRef.current = false;
    }
  }, []);

  /**
   * Toggle continuous listening
   */
  const toggleContinuousListening = useCallback(() => {
    if (continuousListeningRef.current) {
      stopListening();
      continuousListeningRef.current = false;
    } else {
      startListening();
      continuousListeningRef.current = true;
    }
  }, [startListening, stopListening]);

  /**
   * Manually send command
   */
  const sendCommand = useCallback(async (command: string) => {
    await processUserInput(command);
  }, [processUserInput]);

  return {
    ...state,
    startListening,
    stopListening,
    toggleContinuousListening,
    sendCommand,
  };
}
