import { Goal } from '../types'
import './CircularDisplay.css'

interface CircularDisplayProps {
  activeGoal: Goal | null
}

const CircularDisplay: React.FC<CircularDisplayProps> = ({ activeGoal }) => {
  return (
    <div className="circular-display">
      <div className="circular-core">
        <div className="circular-ring ring-1"></div>
        <div className="circular-ring ring-2"></div>
        <div className="circular-ring ring-3"></div>
      </div>
      <div className="core-label">
        <div className="core-title">JARVIS</div>
        <div className="core-status">
          {activeGoal ? 'EXECUTING' : 'IDLE'}
        </div>
      </div>
    </div>
  )
}

export default CircularDisplay
