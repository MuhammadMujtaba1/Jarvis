/**
 * ENHANCED DASHBOARD - Main JARVIS Interface
 * Refactored layout: Vertical links to right of central HUD, clean architecture
 * OPTIMIZED FOR CHROMEBOOK: Smaller panels, responsive grid
 */

import { useState, useEffect, useCallback } from 'react'
import { useAutonomousSystem } from '../hooks/useAutonomousSystem'
import { useAgentStore } from '../hooks/useAgentStore'
import MetricsDisplay from './MetricsDisplay'
import AgentMonitor from './AgentMonitor'
import ContentCreationTracker from './ContentCreationTracker'
import TextTerminal from './TextTerminal'
import { submitAgentWork } from '../utils/AgentSubmissionRegistry'
import '../styles/enhancedDashboard.css'

// Navigation link data with status
const NAV_LINKS = [
  { name: 'Gmail', icon: '📧', status: true },
  { name: 'Wikipedia', icon: '📖', status: true },
  { name: 'Kotaku', icon: '🎮', status: false },
  { name: 'Twitter', icon: '🐦', status: false },
  { name: 'Facebook', icon: '👤', status: false },
  { name: 'YouTube', icon: '🎥', status: true },
]

interface EnhancedDashboardProps {
  systemReady: boolean
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({ systemReady }) => {
  const system = useAutonomousSystem()
  const { wakeUpAllAgents, completeAgent, setAgentStatus, addSubmission, getAgent } = useAgentStore()
  const [timeDisplay, setTimeDisplay] = useState('00:00:00')
  const [systemLoad, setSystemLoad] = useState(45)
  const [jarvisResponse, setJarvisResponse] = useState<string | null>(null)

  // Clock update - stable, no dependencies
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      const hh = String(now.getHours()).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')
      setTimeDisplay(hh + ':' + mm + ':' + ss)
    }
    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  // System load - stable, no dependencies  
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemLoad(prev => {
        const change = (Math.random() - 0.5) * 10
        return Math.max(10, Math.min(100, prev + change))
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Handle command submission to orchestrator
  const handleCommandSubmit = useCallback(async (command: string) => {
    if (!command.trim() || system.isProcessing) return
    system.setProcessing(true)
    setJarvisResponse(null) // Clear previous response
    
    // Wake up all agents for new command
    await wakeUpAllAgents(command)
    
    try {
      console.log('[Dashboard] Command:', command)
      console.log('[Dashboard] Sir, initiating agent hierarchy...')
      
      // Set Orchestrator to processing
      setAgentStatus('orchestrator', 'PROCESSING', command)
      
      // Get response from Orchestrator
      const response = await system.orchestrator?.conversationResponse(command)
      console.log('[Dashboard] JARVIS response:', response)
      
      // Handle object payloads correctly
      const responseText = response?.data?.text || response?.text || response;
      const finalResponse = typeof responseText === 'string' ? responseText : JSON.stringify(responseText);
      setJarvisResponse(finalResponse);
      
      // Submit Orchestrator's work to registry
      const submission = submitAgentWork(
        'orchestrator',
        'ORCHESTRATOR',
        1,
        command,
        finalResponse,
        []
      );
      addSubmission('orchestrator', submission.id);
      
      // Complete Orchestrator
      completeAgent('orchestrator')
      
    } catch (error) {
      console.error('[Dashboard] Command error:', error)
      setJarvisResponse('⚠️ Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
      
      // Mark Orchestrator as failed
      setAgentStatus('orchestrator', 'FAILED', String(error))
    } finally {
      system.setProcessing(false)
    }
  }, [system, wakeUpAllAgents, completeAgent, setAgentStatus, addSubmission])

  // Agent status should always start as IDLE on initial render
  const agentStatus = system.agentStatus || 'IDLE';

  const dateInfo = (() => {
    const now = new Date()
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    return {
      day: days[now.getDay()],
      month: months[now.getMonth()],
      date: String(now.getDate()).padStart(2, '0')
    }
  })()

  return (
    <div className="enhanced-dashboard">
      {/* Background grid effect */}
      <div className="dashboard-grid"></div>
      <div className="scanlines"></div>

      {/* LEFT PANEL - System Metrics (Storage, Capacity, Power) */}
      <div className="panel-left-enhanced">
        <div className="time-display-enhanced neon-border">
          <div className="time-value text-glow">{timeDisplay}</div>
          <div className="time-sub">{dateInfo.day}</div>
        </div>

        <div className="date-circle-enhanced neon-border">
          <div className="date-month text-glow">{dateInfo.month}</div>
          <div className="date-num text-glow">{dateInfo.date}</div>
        </div>

        <div className="storage-panel panel-enhanced">
          <div className="panel-title text-glow">💾 STORAGE</div>
          <div className="metric-row">
            <span>Full:</span>
            <span className="value">116 G</span>
          </div>
          <div className="metric-row">
            <span>Free:</span>
            <span className="value">20 G</span>
          </div>
          <div className="storage-bar">
            <div className="bar-fill" style={{ width: '82.7%' }}></div>
          </div>
        </div>

        <div className="power-panel panel-enhanced">
          <div className="panel-title text-glow">⚡ POWER</div>
          <div className="power-gauge">
            <div className="gauge-circle">
              <div className="gauge-value">{systemLoad.toFixed(0)}%</div>
            </div>
          </div>
          <div className="power-status">ACTIVE</div>
        </div>

        <div className="control-grid panel-enhanced">
          <div className="panel-title text-glow">⚙️ CONTROL</div>
          <button className="control-btn">EJECT</button>
          <button className="control-btn">REBOOT</button>
          <button className="control-btn">PURGE</button>
        </div>
      </div>

      {/* CENTER PANEL - Core HUD Ring */}
      <div className="panel-center-enhanced">
        <div className="ring-visualizer">
          <div className="ring-svg-container">
            <svg viewBox="0 0 400 400" className="ring-svg">
              <circle cx="200" cy="200" r="180" className="ring ring-1" />
              <circle cx="200" cy="200" r="140" className="ring ring-2" />
              <circle cx="200" cy="200" r="100" className="ring ring-3" />
              <circle cx="200" cy="200" r="60" className="ring ring-4" />
              <circle cx="200" cy="200" r="40" className="ring-center" />
              <text x="200" y="210" className="ring-text">JARVIS</text>
            </svg>
          </div>

          {/* Vertical Navigation Links - Positioned to the right of HUD */}
          <div className="vertical-nav-links">
            {NAV_LINKS.map((link, index) => (
              <div key={index} className="nav-link-item">
                <span className={`status-dot ${link.status ? 'active' : 'inactive'}`}></span>
                <span className="nav-link-icon">{link.icon}</span>
                <span className="nav-link-name">{link.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Text Terminal - Command Input */}
        <TextTerminal 
          onCommandSubmit={handleCommandSubmit}
          response={jarvisResponse}
          isProcessing={system.isProcessing}
          disabled={!systemReady || !system.isReady}
        />

        {/* Content Creation Tracker */}
        <ContentCreationTracker metrics={system.metrics} />
      </div>

      {/* RIGHT PANEL - Agent Status & System Resources */}
      <div className="panel-right-enhanced">
        <MetricsDisplay metrics={system.metrics} />

        <div className="network-panel panel-enhanced">
          <div className="panel-title text-glow">🌐 NETWORK</div>
          <div className="network-item">
            <span>LAN:</span>
            <span className="value">2.241.167.250</span>
          </div>
          <div className="network-item">
            <span>Down:</span>
            <span className="value">5.2 Mbps</span>
          </div>
          <div className="network-item">
            <span>Up:</span>
            <span className="value">2.1 Mbps</span>
          </div>
        </div>

        <AgentMonitor orchestrator={system.orchestrator} />

        <div className="ad-panel panel-enhanced">
          <div className="panel-title text-glow">💰 ADS</div>
          {system.metrics?.adPerformance && (
            <>
              <div className="metric-row">
                <span>Spend:</span>
                <span className="value">${system.metrics.adPerformance.spentToday}</span>
              </div>
              <div className="metric-row">
                <span>ROAS:</span>
                <span className="value">{system.metrics.adPerformance.roasRatio}x</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      <div className="status-bar-enhanced">
        <div className="status-item">
          <span className="label">SYS:</span>
          <span className={'value ' + (system.isReady ? 'online' : 'offline')}>
            {system.isReady ? '● ONLINE' : '● OFFLINE'}
          </span>
        </div>
        <div className="status-item">
          <span className="label">AGENT:</span>
          <span className={'value ' + (agentStatus === 'IDLE' ? 'online' : 'offline')}>
            {agentStatus}
          </span>
        </div>
        <div className="status-item">
          <span className="label">API:</span>
          <span className="value">GROQ</span>
        </div>
      </div>
    </div>
  )
}

export default EnhancedDashboard