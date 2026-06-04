import { BusinessMetrics } from '../agents/orchestratorMetrics'
import './ContentCreationTracker.css'

interface ContentCreationTrackerProps {
  metrics: BusinessMetrics | null
}

const ContentCreationTracker: React.FC<ContentCreationTrackerProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="content-tracker panel-enhanced">
        <div className="panel-title text-glow">📹 CONTENT</div>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', textAlign: 'center', padding: '20px' }}>
          Loading content metrics...
        </div>
      </div>
    )
  }

  const content = metrics.contentCreations
  const progress = (content.totalViews / content.weeklyTarget) * 100

  return (
    <div className="content-tracker panel-enhanced">
      <div className="panel-title text-glow">📹 CONTENT CREATION</div>

      <div className="content-metric">
        <div className="metric-header">
          <span>Short-Form Videos</span>
          <span className="value">{content.shortFormVideos}/3</span>
        </div>
      </div>

      <div className="content-metric">
        <div className="metric-header">
          <span>Weekly Views</span>
          <span className="value">{content.totalViews.toLocaleString()}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
        <div className="progress-text">
          {progress.toFixed(1)}% of {content.weeklyTarget.toLocaleString()} target
        </div>
      </div>
    </div>
  )
}

export default ContentCreationTracker
