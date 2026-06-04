import { useState, useEffect, useRef } from 'react'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { useVoiceOutput } from '../hooks/useVoiceOutput'
import { getGroqClient } from '../utils/groqClient'
import { getDatabase } from '../utils/indexedDB'
import { Goal, Task } from '../types'
import '../styles/voiceControl.css'

interface EnhancedVoiceControlProps {
  systemReady: boolean
  onGoalCreate: (goal: Goal) => void
  onMetricsUpdate?: (metrics: any) => void
}

const EnhancedVoiceControl: React.FC<EnhancedVoiceControlProps> = ({
  systemReady,
  onGoalCreate,
  onMetricsUpdate
}) => {
  const [isWakeWordActive, setIsWakeWordActive] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const { isListening, transcript, startListening, stopListening } = useVoiceInput(systemReady)
  const { speak, isSpeaking } = useVoiceOutput(true)
  const wakeWordDetectedRef = useRef(false)
  const lastTranscriptRef = useRef('')

  const WAKE_WORD_TRIGGERS = [
    'hey jarvis wake up',
    'jarvis wake up',
    'wake up jarvis',
    'jarvis'
  ]

  const db = getDatabase()

  // Continuous listening for wake word
  useEffect(() => {
    if (systemReady && !isWakeWordActive) {
      startListening()
    }
  }, [systemReady, isWakeWordActive])

  // Detect wake word in transcript
  useEffect(() => {
    if (transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript

      const lowerTranscript = transcript.toLowerCase()
      const wakeWordDetected = WAKE_WORD_TRIGGERS.some((trigger) =>
        lowerTranscript.includes(trigger)
      )

      if (wakeWordDetected && !isWakeWordActive) {
        console.log('🎤 Wake word detected!')
        setIsWakeWordActive(true)
        wakeWordDetectedRef.current = true
        stopListening()

        // Speak activation confirmation
        speak('Good evening, sir. Pulling up system status now.')

        // Fetch and summarize business metrics
        setTimeout(() => {
          summarizeBusinessMetrics()
        }, 1500)
      }
    }
  }, [transcript])

  /**
   * Summarize current business metrics from database
   */
  const summarizeBusinessMetrics = async () => {
    try {
      setIsProcessing(true)

      // Fetch metrics from database
      const goals = await db.getGoals()
      const tasks = await db.getTasks()

      // Mock business metrics
      const metrics = {
        weeklyDownloads: 2459,
        weeklyRevenue: 4289,
        videoViews: 96000,
        adSpend: 475,
        roas: 1.5,
        emailsProcessed: 13,
        totalEmails: 16,
        activeGoals: goals.length,
        completedTasks: tasks.filter((t) => t.status === 'completed').length
      }

      // Build natural language summary
      const summary = `Over the last seven days, we had ${metrics.weeklyDownloads} new downloads and generated $${metrics.weeklyRevenue} in revenue. Our video content reached ${metrics.videoViews} total views. Current ad spend is $${metrics.adSpend} with a ROAS of ${metrics.roas}. We've processed ${metrics.emailsProcessed} out of ${metrics.totalEmails} customer emails automatically. Backend feature requests are being tracked. What would you like me to prioritize first, sir?`

      setResponseText(summary)
      speak(summary)

      if (onMetricsUpdate) {
        onMetricsUpdate(metrics)
      }
    } catch (error) {
      console.error('Error summarizing metrics:', error)
      const fallback = 'System status retrieved. Please check the dashboard for details.'
      setResponseText(fallback)
      speak(fallback)
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Process voice command after wake word
   */
  const processVoiceCommand = async (command: string) => {
    try {
      setIsProcessing(true)

      const groq = getGroqClient()
      const systemPrompt = `You are JARVIS, an autonomous business operations AI. The user has given you a command. Respond briefly and actionably. If they ask you to handle a task, acknowledge it and explain what you'll do. Keep responses under 100 words.`

      const response = await groq.sendMessage(command, systemPrompt)
      setResponseText(response)
      speak(response)
    } catch (error) {
      console.error('Error processing command:', error)
      const fallback = 'I encountered an error processing that request. Please try again.'
      setResponseText(fallback)
      speak(fallback)
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * Handle voice command submission
   */
  const handleCommandSubmit = async () => {
    if (!transcript || isProcessing) return

    stopListening()
    await processVoiceCommand(transcript)

    // Resume wake word listening after response
    setTimeout(() => {
      setIsWakeWordActive(false)
      lastTranscriptRef.current = ''
    }, 3000)
  }

  return (
    <div className="enhanced-voice-control">
      <div className="voice-status">
        <div className={`status-indicator ${isWakeWordActive ? 'active' : isListening ? 'listening' : 'idle'}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {isWakeWordActive ? 'LISTENING FOR COMMANDS' : isListening ? 'WAITING FOR WAKE WORD' : 'STANDBY'}
          </span>
        </div>
      </div>

      {isWakeWordActive && (
        <div className="command-input-area">
          <div className="transcript-display">
            {transcript ? <p className="transcript">{transcript}</p> : <p className="placeholder">Say your command...</p>}
          </div>

          {responseText && (
            <div className="response-display">
              <p className="response-label">JARVIS RESPONSE:</p>
              <p className="response-text">{responseText}</p>
            </div>
          )}

          <div className="command-controls">
            <button
              className="btn-submit"
              onClick={handleCommandSubmit}
              disabled={!transcript || isProcessing}
            >
              {isProcessing ? 'PROCESSING...' : 'SUBMIT COMMAND'}
            </button>
            <button
              className="btn-cancel"
              onClick={() => {
                stopListening()
                setIsWakeWordActive(false)
                setResponseText('')
              }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      {isSpeaking && <div className="speaking-indicator">🔊 SPEAKING...</div>}
    </div>
  )
}

export default EnhancedVoiceControl
