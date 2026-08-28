import { useState, useEffect, useCallback } from 'react'
import Icon from './Icon'
import { fetchTasks } from '../services/api'
import { mockTasks, mockLearning } from '../services/mockData'

export default function Sidebar({ activePage, onNavigate, isOpen, currentUser, onLogout }) {
  const [taskCount, setTaskCount] = useState(3)
  const [learningCount, setLearningCount] = useState(2)

  const userName = currentUser?.name || 'Alex Morgan'
  const userRole = currentUser?.designation || currentUser?.title || 'Product Engineer'
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const calculateCounts = useCallback(async () => {
    try {
      const savedOverrides = localStorage.getItem('workpilot_task_overrides')
      const overrides = savedOverrides ? JSON.parse(savedOverrides) : {}

      // Calculate tasks count
      const fetched = await fetchTasks(currentUser?.id || 'EMP001')
      let pending = 0

      if (fetched && fetched.length > 0) {
        fetched.forEach(t => {
          const id = t.taskId || t.id
          const isChecked = overrides[id] !== undefined ? overrides[id] : Boolean(t.completed)
          if (!isChecked) pending++
        })
        mockTasks.forEach(m => {
          if (!fetched.some(f => (f.taskId || f.id) === m.id || f.title?.toLowerCase() === m.title?.toLowerCase())) {
            const isChecked = overrides[m.id] !== undefined ? overrides[m.id] : Boolean(m.checked)
            if (!isChecked) pending++
          }
        })
      } else {
        mockTasks.forEach(m => {
          const isChecked = overrides[m.id] !== undefined ? overrides[m.id] : Boolean(m.checked)
          if (!isChecked) pending++
        })
      }

      setTaskCount(pending)

      // Calculate learning in-progress count
      const savedCourses = localStorage.getItem('workpilot_learning_courses')
      const courses = savedCourses ? JSON.parse(savedCourses) : mockLearning
      const inProgress = courses.filter(c => c.status === 'in-progress' || c.progress < 100).length
      setLearningCount(inProgress)
    } catch (e) {
      console.warn('[Sidebar] Error calculating real-time counts:', e)
    }
  }, [currentUser?.id])

  useEffect(() => {
    calculateCounts()

    const handleUpdate = () => calculateCounts()
    window.addEventListener('workpilot-data-updated', handleUpdate)

    return () => window.removeEventListener('workpilot-data-updated', handleUpdate)
  }, [calculateCounts])

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Overview',     icon: 'home' },
    { id: 'assistant', label: 'AI Assistant', icon: 'bot',    badge: null },
    { id: 'tasks',     label: 'My Tasks',     icon: 'tasks',  badge: taskCount > 0 ? String(taskCount) : null },
    { id: 'learning',  label: 'Learning',     icon: 'book',   badge: learningCount > 0 ? String(learningCount) : null },
    { id: 'itsupport', label: 'IT Support',   icon: 'monitor' },
    { id: 'policies',  label: 'Policies',     icon: 'file' },
  ]

  const WORKSPACE_ITEMS = [
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'help',     label: 'Help',     icon: 'help' },
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`} role="navigation" aria-label="Main navigation">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" aria-hidden="true">
          <Icon name="zap" size={20} />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">WorkPilot AI</span>
          <span className="sidebar-brand-tagline">Enterprise Assistant</span>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Main Menu</span>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={activePage === item.id ? 'page' : undefined}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
            {item.badge && (
              <span className="nav-badge" aria-label={`${item.badge} items`}>{item.badge}</span>
            )}
          </button>
        ))}

        <div className="sidebar-divider" />

        <span className="sidebar-section-label">Workspace</span>
        {WORKSPACE_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={activePage === item.id ? 'page' : undefined}
          >
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
          </button>
        ))}

        <div className="sidebar-spacer" />
      </nav>

      {/* User profile */}
      <footer className="sidebar-footer">
        <div className="sidebar-user" id="sidebar-user-profile">
          <div className="user-avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="user-info">
            <div className="user-name">{userName}</div>
            <div className="user-role">{userRole}</div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="logout-btn"
            >
              <Icon name="logout" size={16} />
            </button>
          )}
        </div>
      </footer>
    </aside>
  )
}
