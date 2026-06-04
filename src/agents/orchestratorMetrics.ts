import { Task } from '../types'

export interface BusinessMetrics {
  weeklyDownloads: number
  weeklyRevenue: number
  videoViews: number
  adSpend: number
  roas: number
  emailsProcessed: number
  totalEmails: number
  contentCreations: {
    shortFormVideos: number
    totalViews: number
    weeklyTarget: number
  }
  adPerformance: {
    spentToday: number
    roasRatio: number
    topPerformer: string
    worstPerformer: string
  }
  customerEmails: {
    total: number
    resolved: number
    pending: number
    featureRequests: string[]
  }
}

export interface OrchestratorState {
  isActive: boolean
  currentMetrics: BusinessMetrics
  taskQueue: Task[]
  lastUpdate: number
  mode: 'idle' | 'processing' | 'alert'
}

// Mock business metrics
export const generateMockMetrics = (): BusinessMetrics => {
  return {
    weeklyDownloads: 2459,
    weeklyRevenue: 4289,
    videoViews: 96000,
    adSpend: 475,
    roas: 1.5,
    emailsProcessed: 13,
    totalEmails: 16,
    contentCreations: {
      shortFormVideos: 3,
      totalViews: 96000,
      weeklyTarget: 100000
    },
    adPerformance: {
      spentToday: 475,
      roasRatio: 1.5,
      topPerformer: 'Street Interview Creative',
      worstPerformer: 'Slideshow Creative'
    },
    customerEmails: {
      total: 16,
      resolved: 13,
      pending: 3,
      featureRequests: [
        'Backend data synchronization layer',
        'Cross-device data persistence',
        'Real-time collaboration features'
      ]
    }
  }
}
