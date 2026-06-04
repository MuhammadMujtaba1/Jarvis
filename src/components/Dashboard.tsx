import { useState, useEffect } from 'react'
import VoiceControl from './VoiceControl'
import TaskMonitor from './TaskMonitor'
import SystemMonitor from './SystemMonitor'
import CircularDisplay from './CircularDisplay'
import { Agent, Goal } from '../types'
import '../styles/dashboard.css'

interface DashboardProps {
  systemReady: boolean
  agents: Agent[]
  activeGoal: Goal | null
  onGoalCreate: (goal: Goal) => void
}

const Dashboard: React.FC<DashboardProps> = ({
  systemReady,
  agents,
  activeGoal,
  onGoalCreate
}) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [timeDisplay, setTimeDisplay] = useState<string>('00:00:00')

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')
      setTimeDisplay(`${hh}:${mm}:${ss}`)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const getDateDisplay = () => {
    const now = new Date()
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    return {
      day: days[now.getDay()],
      month: months[now.getMonth()],
      date: String(now.getDate()).padStart(2, '0')
    }
  }

  const dateInfo = getDateDisplay()

  return (
    <div className="dashboard">
      {/* Background grid effect */}
      <div className="dashboard-grid"></div>

      {/* Left Panel - Time & System Info */}
      <div className="panel-left">
        <div className="time-display">
          <div className="time-value text-glow">{timeDisplay}</div>
          <div className="time-sub">{dateInfo.day}</div>
        </div>

        <div className="date-circle neon-border">
          <div className="date-month text-glow">{dateInfo.month}</div>
          <div className="date-num text-glow">{dateInfo.date}</div>
        </div>

        <div className="system-info panel">
          <div className="info-row">
            <span className="label">📡 Full Capacity:</span>
            <span className="value text-glow-light">116 G</span>
          </div>
          <div className="info-row">
            <span className="label">💾 Free Capacity:</span>
            <span className="value text-glow-light">2.0 G</span>
          </div>
        </div>

        <div className="agent-status panel">
          <div className="status-header text-glow">⚡ AGENT STATUS</div>
          <div className="agents-list">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="agent-item"
                onClick={() => setSelectedAgent(agent)}
              >
                <span className="agent-name">{agent.name}</span>
                <span className={`status-dot ${agent.status}`}></span>
              </div>
            ))}
          </div>
        </div>

        <div className="runtime-display panel">
          <div className="label">⏱️ Runtime:</div>
          <div className="value text-glow">04:30:40min</div>
        </div>
      </div>

      {/* Center Panel - Main Circular Display */}
      <div className="panel-center">
        <CircularDisplay activeGoal={activeGoal} />
        <VoiceControl systemReady={systemReady} onGoalCreate={onGoalCreate} />
      </div>

      {/* Right Panel - System Metrics */}
      <div className="panel-right">
        <SystemMonitor selectedAgent={selectedAgent} />
        <TaskMonitor activeGoal={activeGoal} />
      </div>

      {/* Bottom Status Bar */}
      <div className="status-bar panel-bottom">
        <div className="status-item">
          <span className="status-label">SYSTEM STATUS:</span>
          <span className={`status-value ${systemReady ? 'online' : 'offline'}`}>
            {systemReady ? '● ONLINE' : '● OFFLINE'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">AGENTS ACTIVE:</span>
          <span className="status-value">{agents.filter(a => a.status === 'processing').length}/{agents.length}</span>
        </div>
        <div className="status-item">
          <span className="status-label">MEMORY:</span>
          <span className="status-value">2.4 GB / 16 GB</span>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
