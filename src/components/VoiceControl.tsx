import { useState } from 'react'
import { Goal } from '../types'
import './VoiceControl.css'

interface VoiceControlProps {
  systemReady: boolean
  onGoalCreate: (goal: Goal) => void
}

const VoiceControl: React.FC<VoiceControlProps> = ({ systemReady }) => {
  const [isListening, setIsListening] = useState(false)

  const handleVoiceClick = async () => {
    if (!systemReady) return
    
    setIsListening(!isListening)
    
    // TODO: Implement actual voice recognition
    if (!isListening) {
      console.log('🎤 Starting voice recognition...')
    } else {
      console.log('⏹️ Stopping voice recognition...')
    }
  }

  return (
    <div className="voice-control">
      <button
        className={`voice-button ${isListening ? 'listening' : ''}`}
        onClick={handleVoiceClick}
        disabled={!systemReady}
        title="Click to activate voice input"
      >
        🎤
      </button>
      <div className="voice-text">
        {isListening ? 'LISTENING...' : 'CLICK TO SPEAK'}
      </div>
    </div>
  )
}

export default VoiceControl
