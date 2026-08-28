import { useState } from 'react'
import StatCard from '../components/StatCard'
import TaskCard from '../components/TaskCard'
import EnterpriseSystemCard from '../components/EnterpriseSystemCard'
import Icon from '../components/Icon'
import { mockStats, mockPriorities, mockSystems } from '../services/mockData'

export default function Dashboard({ onNavigate }) {
  const [priorities, setPriorities] = useState(mockPriorities)
  const [heroQuery, setHeroQuery] = useState('')

  const handleToggle = (id) => {
    setPriorities(prev =>
      prev.map(t => t.id === id ? { ...t, checked: !t.checked } : t)
    )
  }

  const handleHeroSubmit = (e) => {
    e.preventDefault()
    if (heroQuery.trim()) {
      onNavigate('assistant')
    }
  }

  const handleQuickAction = (action) => {
    onNavigate('assistant')
  }

  const getHour = () => new Date().getHours()
  const greeting = getHour() < 12 ? 'Good morning' : getHour() < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      {/* Hero Search Bar */}
      <div className="hero-search" role="search">
        <h1 className="hero-greeting">{greeting}, Alex 👋</h1>
        <p className="hero-subtitle">Your intelligent workplace assistant</p>

        <form className="hero-input-row" onSubmit={handleHeroSubmit}>
          <input
            id="dashboard-search"
            className="hero-input"
            type="text"
            placeholder="Ask anything about your workplace..."
            value={heroQuery}
            onChange={e => setHeroQuery(e.target.value)}
            aria-label="Ask WorkPilot AI a question"
          />
          <button type="submit" className="hero-send-btn" id="dashboard-search-submit">
            <Icon name="send" size={16} />
            Ask AI
          </button>
        </form>

        <div className="hero-quick-actions" role="list" aria-label="Quick actions">
          {[
            { label: 'Leave', icon: 'calendar' },
            { label: 'Learning', icon: 'book' },
            { label: 'IT Help', icon: 'monitor' },
            { label: 'Policies', icon: 'file' },
          ].map(a => (
            <button
              key={a.label}
              className="hero-quick-btn"
              onClick={() => handleQuickAction(a.label)}
              id={`quick-action-${a.label.toLowerCase().replace(' ', '-')}`}
              role="listitem"
            >
              <Icon name={a.icon} size={13} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-4 mb-6">
        {mockStats.map(stat => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid-2 gap-4" style={{ alignItems: 'start' }}>

        {/* Today's Priorities */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Today's Priorities</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('tasks')}
              id="dashboard-view-all-tasks"
            >
              View all
              <Icon name="arrowRight" size={14} />
            </button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="list" aria-label="Today's priorities">
            {priorities.map(task => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} />
            ))}
          </div>
        </div>

        {/* Enterprise Systems */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Enterprise Systems</span>
            <span className="badge badge-success">All Online</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="list" aria-label="Enterprise systems">
            {mockSystems.map(sys => (
              <EnterpriseSystemCard key={sys.id} system={sys} />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card mt-4">
        <div className="card-header">
          <span className="card-title">Quick Access</span>
        </div>
        <div className="card-body">
          <div className="grid-4">
            {[
              { label: 'WFH Policy',       icon: 'file',     color: 'var(--brand-500)',   bg: 'var(--brand-50)',   page: 'policies' },
              { label: 'Security Training', icon: 'shield',   color: 'var(--danger-500)',  bg: 'var(--danger-50)',  page: 'learning' },
              { label: 'Log IT Ticket',     icon: 'monitor',  color: 'var(--info-500)',    bg: 'var(--info-50)',    page: 'itsupport' },
              { label: 'AI Assistant',      icon: 'bot',      color: 'var(--brand-600)',   bg: 'var(--brand-50)',   page: 'assistant' },
            ].map(item => (
              <button
                key={item.label}
                className="quick-action"
                style={{ justifyContent: 'flex-start', padding: '12px 14px', borderRadius: 'var(--radius-md)', width: '100%' }}
                onClick={() => onNavigate(item.page)}
                id={`quick-access-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: item.color }}>
                    <Icon name={item.icon} size={16} />
                  </span>
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
