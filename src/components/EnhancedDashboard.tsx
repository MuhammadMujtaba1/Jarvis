import { useState, useEffect } from 'react'
import { useAutonomousSystem } from '../hooks/useAutonomousSystem'
import EnhancedVoiceControl from './EnhancedVoiceControl'
import MetricsDisplay from './MetricsDisplay'
import AgentMonitor from './AgentMonitor'
import ContentCreationTracker from './ContentCreationTracker'
import { Goal } from '../types'
import '../styles/enhancedDashboard.css'

interface EnhancedDashboardProps {
  systemReady: boolean
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ systemReady }) => {
  const system = useAutonomousSystem()
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null)
  const [timeDisplay, setTimeDisplay] = useState<string>('00:00:00')
  const [systemLoad, setSystemLoad] = useState(45)

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

  useEffect(() => {
    // Simulate system load fluctuation
    const interval = setInterval(() => {
      setSystemLoad((prev) => {
        const change = (Math.random() - 0.5) * 10
        return Math.max(10, Math.min(100, prev + change))
      })
    }, 2000)

    return () => clearInterval(interval)
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
    <div className="enhanced-dashboard">
      {/* Background grid effect */}
      <div className="dashboard-grid"></div>

      {/* Scan line effect */}
      <div className="scanlines"></div>

      {/* LEFT PANEL - System Information & Controls */}
      <div className="panel-left-enhanced">
        {/* Time Display */}
        <div className="time-display-enhanced neon-border">
          <div className="time-value text-glow">{timeDisplay}</div>
          <div className="time-sub">{dateInfo.day}</div>
        </div>

        {/* Date Circle */}
        <div className="date-circle-enhanced neon-border">
          <div className="date-month text-glow">{dateInfo.month}</div>
          <div className="date-num text-glow">{dateInfo.date}</div>
        </div>

        {/* Storage Metrics */}
        <div className="storage-panel panel-enhanced">
          <div className="panel-title text-glow">💾 STORAGE</div>
          <div className="metric-row">
            <span>Full Capacity:</span>
            <span className="value">116 G</span>
          </div>
          <div className="metric-row">
            <span>Free Capacity:</span>
            <span className="value">20 G</span>
          </div>
          <div className="storage-bar">
            <div className="bar-fill" style={{ width: '82.7%' }}></div>
          </div>
        </div>

        {/* System Power */}
        <div className="power-panel panel-enhanced">
          <div className="panel-title text-glow">⚡ PERFORMANCE</div>
          <div className="power-gauge">
            <div className="gauge-circle">
              <div className="gauge-value">{systemLoad.toFixed(0)}%</div>
            </div>
          </div>
          <div className="power-status">High Performance</div>
        </div>

        {/* System Controls */}
        <div className="control-grid panel-enhanced">
          <div className="panel-title text-glow">⚙️ CONTROL</div>
          <button className="control-btn">EJECT SPACE</button>
          <button className="control-btn">REBOOT MATRIX</button>
          <button className="control-btn">PURGE BUFFER</button>
        </div>
      </div>

      {/* CENTER PANEL - Central Hub */}
      <div className="panel-center-enhanced">
        {/* Concentric Ring Visualizer */}
        <div className="ring-visualizer">
          <svg viewBox="0 0 400 400" className="ring-svg">
            {/* Outer rings */}
            <circle cx="200" cy="200" r="180" className="ring ring-1" />
            <circle cx="200" cy="200" r="140" className="ring ring-2" />
            <circle cx="200" cy="200" r="100" className="ring ring-3" />
            <circle cx="200" cy="200" r="60" className="ring ring-4" />

            {/* Center circle */}
            <circle cx="200" cy="200" r="40" className="ring-center" />
            <text x="200" y="210" className="ring-text">JARVIS</text>
          </svg>

          {/* Quick app links */}
          <div className="app-links">
            <div className="app-link">📧 Gmail</div>
            <div className="app-link">📖 Wikipedia</div>
            <div className="app-link">🎮 Kotaku</div>
            <div className="app-link">🐦 Twitter</div>
            <div className="app-link">👤 Facebook</div>
            <div className="app-link">🎥 YouTube</div>
          </div>
        </div>

        {/* Content Creation Tracker */}
        <ContentCreationTracker metrics={system.metrics} />

        {/* Voice Control */}
        <EnhancedVoiceControl
          systemReady={systemReady && system.isReady}
          onGoalCreate={setActiveGoal}
          onMetricsUpdate={(metrics) => system.updateMetrics(metrics)}
        />
      </div>

      {/* RIGHT PANEL - Analytics & Monitoring */}
      <div className="panel-right-enhanced">
        {/* System Metrics */}
        <MetricsDisplay metrics={system.metrics} />

        {/* Network Traffic */}
        <div className="network-panel panel-enhanced">
          <div className="panel-title text-glow">🌐 NETWORK</div>
          <div className="network-item">
            <span>LAN:</span>
            <span className="value">2.241.167.250</span>
          </div>
          <div className="network-item">
            <span>Download:</span>
            <span className="value">↓ 5.2 Mbps</span>
          </div>
          <div className="network-item">
            <span>Upload:</span>
            <span className="value">↑ 2.1 Mbps</span>
          </div>
        </div>

        {/* Agent Status Monitor */}
        <AgentMonitor orchestrator={system.orchestrator} />

        {/* Ad Performance */}
        <div className="ad-panel panel-enhanced">
          <div className="panel-title text-glow">💰 AD PERFORMANCE</div>
          {system.metrics && (
            <>
              <div className="metric-row">
                <span>Spend:</span>
                <span className="value">${system.metrics.adPerformance.spentToday}</span>
              </div>
              <div className="metric-row">
                <span>ROAS:</span>
                <span className="value">{system.metrics.adPerformance.roasRatio}x</span>
              </div>
              <div className="performer-row optimal">
                <span className="label">TOP:</span>
                <span className="name">{system.metrics.adPerformance.topPerformer}</span>
              </div>
              <div className="performer-row weak">
                <span className="label">WEAK:</span>
                <span className="name">{system.metrics.adPerformance.worstPerformer}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <div className="status-bar-enhanced">
        <div className="status-item">
          <span className="label">SYSTEM:</span>
          <span className={`value ${system.isReady ? 'online' : 'offline'}`}>
            {system.isReady ? '● ONLINE' : '● OFFLINE'}
          </span>
        </div>
        <div className="status-item">
          <span className="label">EMAILS PROCESSED:</span>
          <span className="value">
            {system.metrics?.customerEmails.resolved}/{system.metrics?.customerEmails.total}
          </span>
        </div>
        <div className="status-item">
          <span className="label">VIDEO VIEWS:</span>
          <span className="value">{system.metrics?.contentCreations.totalViews.toLocaleString()}</span>
        </div>
        <div className="status-item">
          <span className="label">WEEKLY REVENUE:</span>
          <span className="value">${system.metrics?.weeklyRevenue}</span>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard
