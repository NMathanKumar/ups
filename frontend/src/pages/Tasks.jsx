import { useState, useEffect, useCallback } from 'react'
import TaskCard from '../components/TaskCard'
import Icon from '../components/Icon'
import { fetchTasks, updateTaskStatus } from '../services/api'
import { mockTasks } from '../services/mockData'

const USER_ID = 'EMP001'

const SECTIONS = [
  { id: 'today',     label: 'Today',     icon: 'zap' },
  { id: 'upcoming',  label: 'Upcoming',  icon: 'calendar' },
  { id: 'completed', label: 'Completed', icon: 'check' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem('workpilot_tasks_active_section') || 'today'
  })
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString())

  const handleSectionChange = (secId) => {
    setActiveSection(secId)
    localStorage.setItem('workpilot_tasks_active_section', secId)
  }

  const loadTasks = useCallback(async () => {
    try {
      const savedOverrides = localStorage.getItem('workpilot_task_overrides');
      const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};

      const fetched = await fetchTasks(USER_ID)
      let combined = []

      if (fetched && fetched.length > 0) {
        const mapped = fetched.map(t => {
          const id = t.taskId || t.id
          const isChecked = overrides[id] !== undefined ? overrides[id] : Boolean(t.completed)
          return {
            id,
            title: t.title,
            category: t.category || 'HR',
            checked: isChecked,
            due: t.dueDate || t.due || 'Pending',
            section: isChecked ? 'completed' : (t.urgent ? 'today' : 'upcoming'),
            workflowId: t.workflowId,
            urgent: Boolean(t.urgent)
          }
        })
        combined = [...mapped]

        mockTasks.forEach(m => {
          if (!combined.some(item => item.title.toLowerCase() === m.title.toLowerCase())) {
            const isChecked = overrides[m.id] !== undefined ? overrides[m.id] : Boolean(m.checked)
            combined.push({
              ...m,
              checked: isChecked,
              section: isChecked ? 'completed' : m.section
            })
          }
        })
      } else {
        combined = mockTasks.map(m => {
          const isChecked = overrides[m.id] !== undefined ? overrides[m.id] : Boolean(m.checked)
          return {
            ...m,
            checked: isChecked,
            section: isChecked ? 'completed' : m.section
          }
        })
      }

      setTasks(combined)
      setLastSynced(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('[Tasks] Error loading tasks:', err)
      const savedOverrides = localStorage.getItem('workpilot_task_overrides');
      const overrides = savedOverrides ? JSON.parse(savedOverrides) : {};
      setTasks(mockTasks.map(m => ({
        ...m,
        checked: overrides[m.id] !== undefined ? overrides[m.id] : m.checked
      })))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTasks()
    const interval = setInterval(loadTasks, 4000)

    const handleUpdate = () => loadTasks()
    window.addEventListener('workpilot-data-updated', handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('workpilot-data-updated', handleUpdate)
    }
  }, [loadTasks])

  const handleToggle = async (id) => {
    const target = tasks.find(t => t.id === id)
    if (!target) return

    const newStatus = !target.checked

    // Persist local override immediately
    try {
      const saved = localStorage.getItem('workpilot_task_overrides')
      const overrides = saved ? JSON.parse(saved) : {}
      overrides[id] = newStatus
      localStorage.setItem('workpilot_task_overrides', JSON.stringify(overrides))
    } catch (e) {
      console.warn('Failed saving task override', e)
    }

    // Optimistic UI update
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, checked: newStatus, section: newStatus ? 'completed' : 'today' } : t)
    )

    await updateTaskStatus(id, USER_ID, newStatus, {
      title: target.title,
      category: target.category,
      dueDate: target.due
    })
    window.dispatchEvent(new CustomEvent('workpilot-data-updated'))
  }

  const filtered = tasks.filter(t => {
    if (activeSection === 'completed') return t.checked
    if (activeSection === 'today') return !t.checked && (t.section === 'today' || t.urgent)
    return !t.checked
  })

  const todayCount = tasks.filter(t => !t.checked && (t.section === 'today' || t.urgent)).length

  return (
    <div className="tasks-page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              My Tasks
            </h1>
            <span
              className="badge badge-success flex items-center gap-1.5"
              style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}
            >
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
                boxShadow: '0 0 8px #22c55e'
              }} />
              Real-time API Active
            </span>
          </div>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            {todayCount} urgent/today task{todayCount !== 1 ? 's' : ''} remaining
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Synced {lastSynced}
          </span>
          <button
            onClick={loadTasks}
            className="btn btn-secondary flex items-center gap-2"
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
          >
            <Icon name="refresh" size={14} />
            Sync Now
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-3 mb-6" role="tablist" aria-label="Task sections">
        {SECTIONS.map(sec => {
          const count = tasks.filter(t => {
            if (sec.id === 'completed') return t.checked
            if (sec.id === 'today') return !t.checked && (t.section === 'today' || t.urgent)
            return !t.checked
          }).length

          const isActive = activeSection === sec.id

          return (
            <button
              key={sec.id}
              id={`tasks-tab-${sec.id}`}
              className="btn flex items-center gap-2"
              onClick={() => handleSectionChange(sec.id)}
              role="tab"
              aria-selected={isActive}
              style={{
                padding: '10px 20px',
                fontSize: '0.875rem',
                fontWeight: 600,
                borderRadius: 12,
                transition: 'all 0.2s ease',
                background: isActive ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                border: isActive ? '1px solid #4338ca' : '1px solid #e2e8f0',
                boxShadow: isActive ? '0 4px 14px rgba(99, 102, 241, 0.35)' : '0 2px 4px rgba(0,0,0,0.02)',
              }}
            >
              <Icon name={sec.icon} size={16} />
              <span>{sec.label}</span>
              {count > 0 && (
                <span style={{
                  background: isActive ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#6366f1',
                  borderRadius: 999,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 9px',
                  marginLeft: 4,
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Task List Card */}
      <div className="card shadow-sm" style={{ borderRadius: 16, border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden' }}>
        <div className="card-body p-4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }} role="list" aria-label={`${activeSection} tasks`}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-tertiary)' }}>
              <Icon name="refresh" size={28} className="animate-spin mb-2" />
              <p style={{ fontSize: '0.9375rem', color: '#475569', fontWeight: 500 }}>Connecting to AWS DynamoDB &amp; API Gateway...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-tertiary)' }}>
              <div style={{ width: 54, height: 54, borderRadius: '50%', background: '#f0fdf4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon name="check" size={28} style={{ color: '#16a34a' }} />
              </div>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>All Caught Up!</p>
              <p style={{ fontSize: '0.875rem', color: '#64748b' }}>No pending tasks in this view.</p>
            </div>
          ) : (
            filtered.map(task => (
              <TaskCard key={task.id} task={task} onToggle={handleToggle} />
            ))
          )}
        </div>
      </div>

      {/* Summary Metric Row (3 Column Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 24 }}>
        {[
          { label: 'Total Tasks', value: tasks.length, color: '#4f46e5', bg: '#eef2ff', icon: 'tasks', border: '#c7d2fe', bar: 'linear-gradient(90deg, #6366f1, #818cf8)' },
          { label: 'Pending Action', value: tasks.filter(t => !t.checked).length, color: '#d97706', bg: '#fffbeb', icon: 'zap', border: '#fef3c7', bar: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
          { label: 'Completed', value: tasks.filter(t => t.checked).length, color: '#16a34a', bg: '#f0fdf4', icon: 'check', border: '#bbf7d0', bar: 'linear-gradient(90deg, #10b981, #34d399)' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#ffffff',
            border: `1px solid ${s.border}`,
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
            transition: 'all 0.2s ease',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: s.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>{s.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                AWS DynamoDB Synced
              </div>
              {/* Progress visual */}
              <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
                <div style={{ width: tasks.length ? `${(s.value / tasks.length) * 100}%` : '0%', height: '100%', background: s.bar, borderRadius: 999 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
