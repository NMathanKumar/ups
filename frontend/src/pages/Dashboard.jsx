import { useState, useEffect, useCallback } from 'react'
import StatCard from '../components/StatCard'
import TaskCard from '../components/TaskCard'
import EnterpriseSystemCard from '../components/EnterpriseSystemCard'
import Icon from '../components/Icon'
import { fetchTasks, updateTaskStatus, fetchReminders, createReminder, updateReminderStatus } from '../services/api'
import { mockSystems } from '../services/mockData'

const USER_ID = 'EMP001'

export default function Dashboard({ onNavigate }) {
  const [priorities, setPriorities] = useState([])
  const [reminders, setReminders] = useState([])
  const [newReminderInput, setNewReminderInput] = useState('')
  const [taskStats, setTaskStats] = useState({ total: 0, pending: 0, completed: 0 })
  const [heroQuery, setHeroQuery] = useState('')

  const loadDashboardData = useCallback(async () => {
    const [tasks, rems] = await Promise.all([
      fetchTasks(USER_ID),
      fetchReminders(USER_ID),
    ])

    if (tasks && tasks.length > 0) {
      const pending = tasks.filter(t => !t.completed).length
      const completed = tasks.filter(t => t.completed).length
      setTaskStats({ total: tasks.length, pending, completed })

      const top = tasks.slice(0, 4).map(t => ({
        id: t.taskId,
        title: t.title,
        category: t.category || 'HR',
        checked: t.completed ?? false,
        dueDate: t.dueDate || 'Today',
      }))
      setPriorities(top)
    } else {
      setTaskStats({ total: 4, pending: 3, completed: 1 })
    }

    if (rems) {
      setReminders(rems)
    }
  }, [])

  useEffect(() => {
    loadDashboardData()

    const handleUpdate = () => {
      loadDashboardData()
    }
    window.addEventListener('workpilot-data-updated', handleUpdate)
    return () => window.removeEventListener('workpilot-data-updated', handleUpdate)
  }, [loadDashboardData])

  const handleToggleTask = async (id) => {
    const target = priorities.find(t => t.id === id)
    if (!target) return

    const newStatus = !target.checked
    setPriorities(prev =>
      prev.map(t => t.id === id ? { ...t, checked: newStatus } : t)
    )

    await updateTaskStatus(id, USER_ID, newStatus)
    loadDashboardData()
  }

  const handleToggleReminder = async (reminderId, currentStatus) => {
    const newStatus = !currentStatus
    setReminders(prev =>
      prev.map(r => r.reminder_id === reminderId ? { ...r, completed: newStatus } : r)
    )
    await updateReminderStatus(reminderId, USER_ID, newStatus)
    loadDashboardData()
  }

  const handleAddReminder = async (e) => {
    e.preventDefault()
    if (!newReminderInput.trim()) return

    const text = newReminderInput.trim()
    setNewReminderInput('')

    const tempRem = {
      reminder_id: `rem-temp-${Date.now()}`,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setReminders(prev => [tempRem, ...prev])

    await createReminder({ userId: USER_ID, text })
    loadDashboardData()
  }

  const handleHeroSubmit = (e) => {
    e.preventDefault()
    if (heroQuery.trim()) {
      onNavigate('assistant')
    }
  }

  const getHour = () => new Date().getHours()
  const greeting = getHour() < 12 ? 'Good morning' : getHour() < 17 ? 'Good afternoon' : 'Good evening'

  const activeReminders = reminders.filter(r => !r.completed)

  const statsList = [
    { id: '1', title: 'Pending Tasks', value: taskStats.pending, label: 'Action required', change: 'Updated', changeType: 'neutral', icon: 'zap', color: 'var(--brand-500)', bg: 'var(--brand-50)' },
    { id: '2', title: 'Completed Tasks', value: taskStats.completed, label: 'Fulfilled', change: 'Live', changeType: 'positive', icon: 'check', color: 'var(--success-500)', bg: 'var(--success-50)' },
    { id: '3', title: 'Active Reminders', value: activeReminders.length, label: 'Scheduled', change: 'DynamoDB', changeType: 'neutral', icon: 'calendar', color: 'var(--warning-500)', bg: 'var(--warning-50)' },
    { id: '4', title: 'Enterprise Status', value: 'Operational', label: 'RAG & DynamoDB', change: '100% Online', changeType: 'positive', icon: 'shield', color: 'var(--success-600)', bg: 'var(--success-50)' },
  ]

  return (
    <div>
      {/* Hero Search Bar */}
      <div className="hero-search" role="search">
        <h1 className="hero-greeting">{greeting}, Priya 👋</h1>
        <p className="hero-subtitle">Your intelligent enterprise assistant powered by Bedrock RAG & DynamoDB</p>

        <form className="hero-input-row" onSubmit={handleHeroSubmit}>
          <input
            id="dashboard-search"
            className="hero-input"
            type="text"
            placeholder="Ask anything about your workplace, leave balances, or onboarding..."
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
              onClick={() => onNavigate('assistant')}
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
        {statsList.map(stat => (
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
            {priorities.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 20 }}>No pending tasks recorded.</p>
            ) : (
              priorities.map(task => (
                <TaskCard key={task.id} task={task} onToggle={handleToggleTask} />
              ))
            )}
          </div>
        </div>

        {/* Proactive Reminders */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Proactive Reminders</span>
            <span className="badge badge-brand">DynamoDB</span>
          </div>
          <div className="card-body">
            {/* Quick Add Form */}
            <form onSubmit={handleAddReminder} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Add a new reminder..."
                value={newReminderInput}
                onChange={e => setNewReminderInput(e.target.value)}
                style={{ fontSize: '0.8125rem', padding: '6px 10px' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={!newReminderInput.trim()}>
                Add
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} role="list" aria-label="Reminders">
              {reminders.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: 20 }}>No active reminders.</p>
              ) : (
                reminders.map(rem => (
                  <div key={rem.reminder_id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: rem.completed ? 'var(--gray-50)' : 'var(--warning-50)',
                    border: `1px solid ${rem.completed ? 'var(--gray-200)' : 'var(--warning-200)'}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={rem.completed}
                        onChange={() => handleToggleReminder(rem.reminder_id, rem.completed)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{
                        fontSize: '0.8125rem',
                        color: rem.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        textDecoration: rem.completed ? 'line-through' : 'none',
                        fontWeight: 500,
                      }}>
                        {rem.text}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                      {rem.completed ? 'Done' : 'Upcoming'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Systems Row */}
      <div className="card mt-4">
        <div className="card-header">
          <span className="card-title">Enterprise Systems Status</span>
          <span className="badge badge-success">All Online</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mockSystems.map(sys => (
            <EnterpriseSystemCard key={sys.id} system={sys} />
          ))}
        </div>
      </div>
    </div>
  )
}
