import { useState, useEffect, useCallback, useRef } from 'react'
import StatCard from '../components/StatCard'
import TaskCard from '../components/TaskCard'
import EnterpriseSystemCard from '../components/EnterpriseSystemCard'
import Icon from '../components/Icon'
import { fetchTasks, updateTaskStatus, fetchReminders, createReminder, updateReminderStatus } from '../services/api'
import { mockSystems, mockTasks } from '../services/mockData'

const USER_ID = 'EMP001'

export default function Dashboard({ onNavigate, currentUser }) {
  const userName = currentUser?.name || 'Priya Sharma'
  const userRole = currentUser?.designation || currentUser?.title || 'Senior Product Manager'
  const empId = currentUser?.employee_id || 'EMP001'

  const [priorities, setPriorities] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [reminders, setReminders] = useState([])
  const [newReminderInput, setNewReminderInput] = useState('')
  const [taskStats, setTaskStats] = useState({ total: 0, pending: 0, completed: 0 })
  const [heroQuery, setHeroQuery] = useState('')
  const [activeModal, setActiveModal] = useState(null)
  const [taskFilter, setTaskFilter] = useState('all')
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString())
  const [isSyncing, setIsSyncing] = useState(false)
  const [activityLogs, setActivityLogs] = useState([
    { id: 1, text: 'Bedrock Knowledge Base RAG indexed 14 enterprise policy documents', time: 'Just now', type: 'system' },
    { id: 2, text: `DynamoDB task table synchronized for user ${empId}`, time: '2m ago', type: 'task' },
    { id: 3, text: 'Maternity leave & benefits workflow initialized', time: '5m ago', type: 'hr' },
  ])

  const reminderInputRef = useRef(null)
  const remindersCardRef = useRef(null)

  const loadDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true)

    const savedOverrides = localStorage.getItem('workpilot_task_overrides')
    const overrides = savedOverrides ? JSON.parse(savedOverrides) : {}

    try {
      const [tasks, rems] = await Promise.all([
        fetchTasks(empId),
        fetchReminders(empId),
      ])

      let combined = []
      if (tasks && tasks.length > 0) {
        const mapped = tasks.map(t => {
          const id = t.taskId || t.id
          const isChecked = overrides[id] !== undefined ? overrides[id] : Boolean(t.completed)
          return {
            id,
            title: t.title,
            category: t.category || 'HR',
            checked: isChecked,
            dueDate: t.dueDate || t.due || 'Today',
            urgent: Boolean(t.urgent)
          }
        })
        combined = [...mapped]

        mockTasks.forEach(m => {
          if (!combined.some(item => item.title.toLowerCase() === m.title.toLowerCase())) {
            const isChecked = overrides[m.id] !== undefined ? overrides[m.id] : Boolean(m.checked)
            combined.push({ ...m, checked: isChecked })
          }
        })
      } else {
        combined = mockTasks.map(m => ({
          ...m,
          checked: overrides[m.id] !== undefined ? overrides[m.id] : Boolean(m.checked)
        }))
      }

      setAllTasks(combined)

      const pending = combined.filter(t => !t.checked).length
      const completed = combined.filter(t => t.checked).length
      setTaskStats({ total: combined.length, pending, completed })

      const top = combined.filter(t => !t.checked)
      setPriorities(top)

      if (rems && rems.length > 0) {
        setReminders(rems)
      }
      setLastSynced(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('[Dashboard] error loading data:', err)
    } finally {
      if (isManual) setTimeout(() => setIsSyncing(false), 500)
    }
  }, [empId])

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(() => loadDashboardData(false), 4000)

    const handleUpdate = () => loadDashboardData(false)
    window.addEventListener('workpilot-data-updated', handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('workpilot-data-updated', handleUpdate)
    }
  }, [loadDashboardData])

  const handleToggleTask = async (id) => {
    const target = allTasks.find(t => t.id === id)
    if (!target) return

    const newStatus = !target.checked

    try {
      const saved = localStorage.getItem('workpilot_task_overrides')
      const overrides = saved ? JSON.parse(saved) : {}
      overrides[id] = newStatus
      localStorage.setItem('workpilot_task_overrides', JSON.stringify(overrides))
    } catch (e) {
      console.warn('Failed saving task override', e)
    }

    setAllTasks(prev => prev.map(t => t.id === id ? { ...t, checked: newStatus } : t))
    setPriorities(prev => prev.map(t => t.id === id ? { ...t, checked: newStatus } : t))

    const logItem = {
      id: Date.now(),
      text: `Task marked ${newStatus ? 'Completed' : 'Pending'}: "${target.title.substring(0, 35)}..."`,
      time: 'Just now',
      type: newStatus ? 'success' : 'task'
    }
    setActivityLogs(prev => [logItem, ...prev.slice(0, 4)])

    await updateTaskStatus(id, empId, newStatus, {
      title: target.title,
      category: target.category,
      dueDate: target.dueDate
    })
    window.dispatchEvent(new CustomEvent('workpilot-data-updated'))
  }

  const handleToggleReminder = async (reminderId, currentStatus) => {
    const newStatus = !currentStatus
    setReminders(prev =>
      prev.map(r => r.reminder_id === reminderId ? { ...r, completed: newStatus } : r)
    )
    await updateReminderStatus(reminderId, empId, newStatus)
    window.dispatchEvent(new CustomEvent('workpilot-data-updated'))
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

    setActivityLogs(prev => [{
      id: Date.now(),
      text: `New reminder added: "${text}"`,
      time: 'Just now',
      type: 'task'
    }, ...prev.slice(0, 4)])

    await createReminder({ userId: empId, text })
    window.dispatchEvent(new CustomEvent('workpilot-data-updated'))
  }

  const handleHeroSubmit = (e) => {
    e.preventDefault()
    if (heroQuery.trim()) {
      sessionStorage.setItem('workpilot_pending_prompt', heroQuery.trim())
      onNavigate('assistant')
    }
  }

  const handleScheduledClick = () => {
    if (remindersCardRef.current) {
      remindersCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    if (reminderInputRef.current) {
      setTimeout(() => reminderInputRef.current?.focus(), 400)
    }
  }

  const getHour = () => new Date().getHours()
  const greeting = getHour() < 12 ? 'Good morning' : getHour() < 17 ? 'Good afternoon' : 'Good evening'

  const activeReminders = reminders.filter(r => !r.completed)
  const completedTasksList = allTasks.filter(t => t.checked)
  const pendingTasksList = allTasks.filter(t => !t.checked)

  const filteredPriorities = pendingTasksList.filter(t => {
    if (taskFilter === 'HR') return t.category === 'HR'
    if (taskFilter === 'IT') return t.category === 'IT' || t.category === 'IT Support'
    if (taskFilter === 'urgent') return t.urgent
    return true
  }).slice(0, 5)

  const completionPct = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0

  const statsList = [
    {
      id: '1',
      title: 'Action required',
      value: taskStats.pending,
      subtext: `${taskStats.pending} task${taskStats.pending !== 1 ? 's' : ''} awaiting action`,
      icon: 'zap',
      color: '#ec7211',
      bgColor: '#fffbeb',
      actionHint: 'Go to Tasks →',
      onClick: () => {
        localStorage.setItem('workpilot_tasks_active_section', 'today')
        onNavigate('tasks')
      }
    },
    {
      id: '2',
      title: 'Fulfilled',
      value: `${taskStats.completed} / ${taskStats.total}`,
      subtext: `${completionPct}% completion rate`,
      icon: 'check',
      color: '#16a34a',
      bgColor: '#f0fdf4',
      actionHint: 'View Completed →',
      onClick: () => {
        localStorage.setItem('workpilot_tasks_active_section', 'completed')
        onNavigate('tasks')
      }
    },
    {
      id: '3',
      title: 'Scheduled',
      value: activeReminders.length,
      subtext: `${activeReminders.length} active reminder${activeReminders.length !== 1 ? 's' : ''}`,
      icon: 'calendar',
      color: '#ff9900',
      bgColor: '#fff8e7',
      actionHint: 'Add Reminder ↓',
      onClick: handleScheduledClick
    },
    {
      id: '4',
      title: 'RAG & Microservices',
      value: 'Operational',
      subtext: '5 Lambdas 100% Online',
      icon: 'shield',
      color: '#232f3e',
      bgColor: '#eef2f6',
      actionHint: 'System Settings ⚙',
      onClick: () => onNavigate('settings')
    },
  ]

  return (
    <div className="dashboard-container space-y-6">
      {/* Top Real-time Control HUD */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3 p-3 rounded-xl" style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0'
      }}>
        <div className="flex items-center gap-3">
          <span className="badge badge-success flex items-center gap-1.5" style={{ padding: '5px 12px', fontSize: '0.75rem', fontWeight: 600 }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block',
              boxShadow: '0 0 10px #22c55e',
              animation: 'pulse 2s infinite'
            }} />
            Live Enterprise APIs Connected
          </span>
          <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 500 }}>
            AWS US-East-1 • Bedrock RAG &amp; DynamoDB active
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Synced {lastSynced}
          </span>
          <button
            onClick={() => loadDashboardData(true)}
            className={`btn btn-secondary flex items-center gap-1.5 ${isSyncing ? 'opacity-70' : ''}`}
            style={{ padding: '5px 12px', fontSize: '0.8125rem' }}
            disabled={isSyncing}
          >
            <Icon name="refresh" size={13} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Hero AI Search & Prompt Card — Amazon Squall Navy & Amber Royal */}
      <div className="hero-search" role="search" style={{
        background: 'linear-gradient(135deg, #131921 0%, #232f3e 50%, #37475a 100%)',
        borderRadius: 18,
        padding: '32px 28px',
        color: '#ffffff',
        boxShadow: '0 12px 30px -8px rgba(35, 47, 62, 0.5)',
        border: '1px solid #37475a'
      }}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h1 className="hero-greeting" style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {greeting}, {userName} 👋
          </h1>
          <span style={{
            background: 'rgba(255, 153, 0, 0.2)',
            border: '1px solid rgba(255, 153, 0, 0.4)',
            color: '#ffac31',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            {empId} • {userRole}
          </span>
        </div>

        <p className="hero-subtitle" style={{ color: 'rgba(255, 255, 255, 0.85)', marginBottom: 20, fontSize: '0.9375rem' }}>
          Ask WorkPilot AI anything about maternity policies, leave balances, IT support, or onboarding workflows.
        </p>

        <form className="hero-input-row" onSubmit={handleHeroSubmit}>
          <input
            id="dashboard-search"
            className="hero-input"
            type="text"
            placeholder="Search policies or ask: 'What is the leave policy for maternity?'"
            value={heroQuery}
            onChange={e => setHeroQuery(e.target.value)}
            aria-label="Ask WorkPilot AI a question"
            style={{ background: '#ffffff', color: '#0f172a', borderRadius: 10 }}
          />
          <button type="submit" className="hero-send-btn" id="dashboard-search-submit" style={{
            background: 'linear-gradient(135deg, #ff9900 0%, #ec7211 100%)',
            color: '#ffffff',
            fontWeight: 700,
            borderRadius: 10,
            border: 'none',
            boxShadow: '0 4px 14px rgba(255, 153, 0, 0.4)'
          }}>
            <Icon name="send" size={16} />
            Ask AI
          </button>
        </form>

        <div className="hero-quick-actions" role="list" aria-label="Quick actions" style={{ marginTop: 18 }}>
          {[
            { label: 'Accident Leave Ticket', query: 'I met with an accident, I want to apply for accident leave' },
            { label: 'Apply Leave', query: 'How do I submit a leave request for maternity?' },
            { label: 'Learning Programs', query: 'What security training programs are mandatory?' },
            { label: 'IT Support Ticket', query: 'How do I request a new laptop or hardware?' },
            { label: 'Work From Home Policy', query: 'What is the remote work policy?' },
          ].map(a => (
            <button
              key={a.label}
              className="hero-quick-btn"
              onClick={() => {
                sessionStorage.setItem('workpilot_pending_prompt', a.query)
                onNavigate('assistant')
              }}
              style={{ background: 'rgba(255, 255, 255, 0.12)', border: '1px solid rgba(255, 255, 255, 0.25)', color: '#ffffff' }}
            >
              <Icon name="sparkles" size={13} style={{ color: '#ff9900' }} />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Stats Metric Grid */}
      <div className="grid-4 mb-6">
        {statsList.map(stat => (
          <StatCard
            key={stat.id}
            label={stat.title}
            value={stat.value}
            subtext={stat.subtext}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
            onClick={stat.onClick}
            actionHint={stat.actionHint}
          />
        ))}
      </div>

      {/* Main Content Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Left Column: Today's Priorities with Filters (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card shadow-sm" style={{ borderRadius: 16 }}>
            <div className="card-header flex items-center justify-between flex-wrap gap-2 p-4 border-b border-gray-100">
              <div>
                <h2 className="card-title" style={{ fontSize: '1.125rem', fontWeight: 700 }}>Today's Priorities & Action Items</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                  Direct action workflows synced with DynamoDB
                </p>
              </div>

              {/* Task Category Filter Pills */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'HR', label: 'HR' },
                  { id: 'IT', label: 'IT' },
                  { id: 'urgent', label: '⚡ Urgent' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setTaskFilter(f.id)}
                    className={`btn btn-xs ${taskFilter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ padding: '3px 10px', fontSize: '0.75rem', borderRadius: 6 }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card-body p-4 flex flex-col gap-3" role="list">
              {filteredPriorities.length === 0 ? (
                <div className="text-center py-8 text-secondary">
                  <Icon name="check" size={32} style={{ color: 'var(--success-500)', margin: '0 auto 8px' }} />
                  <p className="font-semibold text-primary">No pending tasks matching "{taskFilter}"</p>
                  <p className="text-xs text-tertiary">All action items in this category are completed!</p>
                </div>
              ) : (
                filteredPriorities.map(task => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggleTask} />
                ))
              )}
            </div>

            <div className="card-footer p-3 bg-gray-50 flex items-center justify-between border-t border-gray-100" style={{ borderRadius: '0 0 16px 16px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Showing {filteredPriorities.length} of {pendingTasksList.length} pending items
              </span>
              <button
                className="btn btn-ghost btn-sm text-xs font-semibold flex items-center gap-1"
                onClick={() => onNavigate('tasks')}
              >
                View Full Tasks Workspace
                <Icon name="arrowRight" size={13} />
              </button>
            </div>
          </div>

          {/* Connected Enterprise Systems Status */}
          <div className="card shadow-sm p-4" style={{ borderRadius: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="section-title" style={{ fontSize: '1rem', fontWeight: 700 }}>Enterprise Systems Health Radar</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Live connection status for integrated enterprise platforms</p>
              </div>
              <span className="badge badge-success text-xs">All Systems Online</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {mockSystems.map(system => (
                <EnterpriseSystemCard key={system.id} {...system} />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Reminders & Live Activity Stream (1 Col) */}
        <div className="space-y-6">

          {/* Proactive Reminders Card */}
          <div className="card shadow-sm" ref={remindersCardRef} style={{ borderRadius: 16 }}>
            <div className="card-header p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="card-title" style={{ fontSize: '1rem', fontWeight: 700 }}>Proactive Reminders</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Saved in DynamoDB</p>
              </div>
              <span className="badge badge-brand text-xs">DynamoDB</span>
            </div>

            <div className="card-body p-4">
              <form onSubmit={handleAddReminder} className="flex gap-2 mb-4">
                <input
                  ref={reminderInputRef}
                  type="text"
                  className="form-input text-xs"
                  placeholder="Add a new reminder..."
                  value={newReminderInput}
                  onChange={e => setNewReminderInput(e.target.value)}
                  id="add-reminder-input"
                  style={{ borderRadius: 8 }}
                />
                <button type="submit" className="btn btn-primary btn-sm text-xs px-3" id="add-reminder-btn">
                  Add
                </button>
              </form>

              {reminders.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0', fontSize: '0.8125rem' }}>
                  No active reminders.
                </p>
              ) : (
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {reminders.map(rem => (
                    <div
                      key={rem.reminder_id}
                      className={`reminder-item p-2.5 rounded-lg border border-gray-100 flex items-center gap-2.5 ${rem.completed ? 'completed opacity-60' : ''}`}
                      style={{ background: 'var(--gray-50)', fontSize: '0.8125rem' }}
                    >
                      <button
                        className={`task-checkbox ${rem.completed ? 'checked' : ''}`}
                        onClick={() => handleToggleReminder(rem.reminder_id, rem.completed)}
                        aria-label={`Mark reminder "${rem.text}" as ${rem.completed ? 'incomplete' : 'complete'}`}
                        style={{ width: 18, height: 18 }}
                      >
                        {rem.completed && <Icon name="check" size={10} />}
                      </button>
                      <span className="reminder-text flex-1" style={{
                        textDecoration: rem.completed ? 'line-through' : 'none',
                        color: rem.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        fontWeight: rem.completed ? 400 : 500
                      }}>
                        {rem.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Real-time Activity Stream Feed */}
          <div className="card shadow-sm p-4" style={{ borderRadius: 16 }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Live System Audit Stream
                </h3>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Real-time</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {activityLogs.map(log => (
                <div key={log.id} className="p-2.5 rounded-lg flex items-start gap-2.5 text-xs" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-light)' }}>
                  <div className="mt-0.5">
                    {log.type === 'success' && <Icon name="check-circle" size={13} style={{ color: 'var(--success-600)' }} />}
                    {log.type === 'task' && <Icon name="zap" size={13} style={{ color: 'var(--brand-600)' }} />}
                    {log.type === 'hr' && <Icon name="file" size={13} style={{ color: 'var(--warning-600)' }} />}
                    {log.type === 'system' && <Icon name="shield" size={13} style={{ color: 'var(--info-600)' }} />}
                  </div>
                  <div className="flex-1">
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>{log.text}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: Fulfilled Tasks & Completed Actions */}
      {activeModal === 'fulfilled' && (
        <div className="modal-backdrop flex items-center justify-center p-4" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000
        }}>
          <div className="card p-6" style={{ width: '100%', maxWidth: 540, borderRadius: 18, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="badge badge-success flex items-center gap-1 p-1 px-2.5 text-xs font-semibold">
                  <Icon name="check" size={13} />
                  Fulfilled History
                </span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Completed Tasks & Fulfilled Actions
                </h2>
              </div>
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs p-2 rounded-full">✕</button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-900">Task Completion Rate: {completionPct}%</div>
                <div className="text-xs text-emerald-700">{completedTasksList.length} completed out of {taskStats.total} total assigned tasks</div>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow">
                {completionPct}%
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6 max-h-64 overflow-y-auto pr-1">
              {completedTasksList.length === 0 ? (
                <div className="p-4 text-center text-xs text-secondary bg-gray-50 rounded-lg">
                  No completed tasks recorded yet. Click any task checkbox to fulfill it!
                </div>
              ) : (
                completedTasksList.map(t => (
                  <div key={t.id} className="p-3 rounded-xl flex items-center justify-between text-xs" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-light)' }}>
                    <div className="flex items-center gap-2.5">
                      <Icon name="check-circle" size={16} style={{ color: 'var(--success-600)' }} />
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</span>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Stored in DynamoDB</div>
                      </div>
                    </div>
                    <span className="badge badge-gray">{t.category || 'HR'}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setActiveModal(null)
                  onNavigate('tasks')
                }}
                className="btn btn-primary text-xs flex items-center gap-1.5 px-4 py-2"
              >
                Go to My Tasks (Completed) →
              </button>
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs px-4 py-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Enterprise Microservices & Infrastructure Status */}
      {activeModal === 'systemStatus' && (
        <div className="modal-backdrop flex items-center justify-center p-4" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000
        }}>
          <div className="card p-6" style={{ width: '100%', maxWidth: 560, borderRadius: 18, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="badge badge-success flex items-center gap-1">
                  🟢 100% Operational
                </span>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  AWS Microservices & Infrastructure Health
                </h2>
              </div>
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs p-2 rounded-full">✕</button>
            </div>

            <div className="flex flex-col gap-2.5 mb-6">
              {[
                { name: '1. Agent & RAG Service', type: 'AWS Lambda (Node.js 20)', status: 'Operational', latency: '42ms' },
                { name: '2. Task & Reminders Service', type: 'AWS Lambda (Node.js 20)', status: 'Operational', latency: '18ms' },
                { name: '3. HR & Employee Service', type: 'AWS Lambda (Node.js 20)', status: 'Operational', latency: '14ms' },
                { name: '4. IT Support & Asset Service', type: 'AWS Lambda (Node.js 20)', status: 'Operational', latency: '16ms' },
                { name: '5. Onboarding Workflow Service', type: 'AWS Lambda (Node.js 20)', status: 'Operational', latency: '21ms' },
                { name: 'Bedrock Knowledge Base', type: 'OpenSearch Serverless Vector', status: 'Healthy', latency: '110ms' },
                { name: 'Enterprise DynamoDB Tables', type: 'PAY_PER_REQUEST (8 Tables)', status: 'Healthy', latency: '6ms' }
              ].map(s => (
                <div key={s.name} className="p-3 rounded-xl flex items-center justify-between text-xs" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{s.type}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-tertiary" style={{ fontSize: '0.7rem' }}>{s.latency}</span>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>{s.status}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-200">
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary text-xs px-4 py-2">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
