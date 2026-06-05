/**
 * TEXT TERMINAL - Manual Command Input Interface
 * High-contrast cyberpunk terminal with auto-text-to-speech
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import './TextTerminal.css';
import { speak, stopSpeaking, isSpeaking } from '../utils/speech';

interface TextTerminalProps {
  onCommandSubmit: (command: string) => void;
  response?: string | null;
  isProcessing: boolean;
  disabled?: boolean;
  autoSpeak?: boolean;
}

const TextTerminal: React.FC<TextTerminalProps> = ({
  onCommandSubmit,
  response,
  isProcessing,
  disabled = false,
  autoSpeak = true
}) => {
  const [input, setInput] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevResponseRef = useRef<string | null>(null);

  // Auto-speak new responses
  useEffect(() => {
    if (response && response !== prevResponseRef.current && autoSpeak && !isProcessing) {
      prevResponseRef.current = response;
      
      stopSpeaking();
      
      setTimeout(() => {
        speak(response, { interrupt: true });
        setSpeaking(true);
      }, 100);
    }
  }, [response, autoSpeak, isProcessing]);

  // Stop speaking when processing starts
  useEffect(() => {
    if (isProcessing && speaking) {
      stopSpeaking();
      setSpeaking(false);
    }
  }, [isProcessing]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput || isProcessing || disabled) return;

    stopSpeaking();
    setSpeaking(false);

    onCommandSubmit(trimmedInput);

    setInput('');

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [input, isProcessing, disabled, onCommandSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleStopSpeech = useCallback(() => {
    stopSpeaking();
    setSpeaking(false);
  }, []);

  return (
    <div className="text-terminal">
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">⌨️</span>
          <span>COMMAND TERMINAL</span>
        </div>
        <div className="terminal-status">
          {isProcessing ? (
            <span className="status-processing">⚡ PROCESSING...</span>
          ) : speaking ? (
            <button 
              className="speech-stop-btn"
              onClick={handleStopSpeech}
              title="Stop speech"
            >
              🔊 STOP
            </button>
          ) : (
            <span className="status-ready">✓ READY</span>
          )}
        </div>
      </div>

      <form className="terminal-input-area" onSubmit={handleSubmit}>
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="terminal-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command for JARVIS..."
            disabled={disabled || isProcessing}
            rows={3}
            maxLength={1000}
          />
          <div className="input-controls">
            <span className="char-count">{input.length}/1000</span>
          </div>
        </div>
        <div className="terminal-actions">
          <button
            type="submit"
            className="btn btn-submit"
            disabled={!input.trim() || isProcessing || disabled}
          >
            <span className="btn-icon">▶</span>
            SEND COMMAND
          </button>
        </div>
      </form>

      <div className="terminal-footer">
        <div className="hint-text">
          Press Enter to send
        </div>
      </div>

      {/* Response Display Area */}
      {response && (
        <div className="terminal-response">
          <div className="response-header">
            <span>JARVIS RESPONSE:</span>
            {speaking && (
              <button 
                className="speech-mute-btn"
                onClick={handleStopSpeech}
                title="Mute"
              >
                🔊
              </button>
            )}
          </div>
          <div className="response-content">
            {typeof response === 'string' ? response : JSON.stringify(response, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextTerminal;
