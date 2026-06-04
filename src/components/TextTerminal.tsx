/**
 * TEXT TERMINAL - Manual Command Input Interface
 * High-contrast cyberpunk terminal for direct user text commands
 */

import React, { useState, useCallback, useRef } from 'react';
import './TextTerminal.css';

interface TextTerminalProps {
  onCommandSubmit: (command: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

const TextTerminal: React.FC<TextTerminalProps> = ({ 
  onCommandSubmit, 
  isProcessing,
  disabled = false 
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    
    const trimmedInput = input.trim();
    if (!trimmedInput || isProcessing || disabled) return;

    // Send to orchestrator
    onCommandSubmit(trimmedInput);
    
    // Clear input
    setInput('');
    
    // Focus back on input
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [input, isProcessing, disabled, onCommandSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

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
    </div>
  );
};

export default TextTerminal;