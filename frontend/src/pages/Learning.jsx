import { useState, useEffect, useCallback } from 'react'
import Icon from '../components/Icon'
import { fetchTasks, fetchOnboardingStatus, saveLearningProgress } from '../services/api'
import { mockLearning } from '../services/mockData'

const USER_ID = 'EMP001'

const STATUS_STYLES = {
  'completed':   { badge: 'badge-success', label: 'Completed' },
  'in-progress': { badge: 'badge-warning', label: 'In Progress' },
  'not-started': { badge: 'badge-gray',    label: 'Not Started' },
}

const COURSE_MODULES = {
  'l1': [
    { title: 'Module 1: Password & MFA Security Policy', duration: '10 min', completed: true },
    { title: 'Module 2: Identifying Phishing & Social Engineering', duration: '15 min', completed: true },
    { title: 'Module 3: Secure Remote Access & VPN Usage', duration: '15 min', completed: true },
    { title: 'Module 4: Enterprise Data Handling Best Practices', duration: '10 min', completed: false }
  ],
  'l2': [
    { title: 'Module 1: GDPR & Data Protection Overview', duration: '15 min', completed: true },
    { title: 'Module 2: PII Data Storage & Encryption', duration: '20 min', completed: false },
    { title: 'Module 3: Incident Response & Breach Notification', duration: '15 min', completed: false }
  ],
  'l3': [
    { title: 'Module 1: Workplace Ergonomics & Safety Guidelines', duration: '15 min', completed: true },
    { title: 'Module 2: Emergency Response & Evacuation Protocol', duration: '15 min', completed: true }
  ]
}

function ProgressBar({ pct }) {
  return (
    <div className="progress-track" style={{ height: 8, borderRadius: 4, background: 'var(--gray-200)', overflow: 'hidden' }}>
      <div
        className="progress-fill"
        style={{
          width: `${pct}%`,
          height: '100%',
          background: pct === 100 ? 'var(--success-500)' : 'var(--brand-500)',
          transition: 'width 0.4s ease-in-out'
        }}
      />
    </div>
  )
}

export default function Learning({ onNavigate }) {
  const [courses, setCourses] = useState(() => {
    const saved = localStorage.getItem('workpilot_learning_courses')
    return saved ? JSON.parse(saved) : mockLearning
  })
  const [loading, setLoading] = useState(false)
  const [lastSynced, setLastSynced] = useState(new Date().toLocaleTimeString())
  const [activeCourse, setActiveCourse] = useState(null)
  const [selectedProgress, setSelectedProgress] = useState(0)
  const [activityLog, setActivityLog] = useState([
    { id: 1, text: 'Completed Security Awareness Module 3', time: '10 min ago', icon: 'check' },
    { id: 2, text: 'Enrolled in Data Privacy Fundamentals', time: '1 hour ago', icon: 'book' }
  ])
  const [syncing, setSyncing] = useState(false)

  // Save courses to localStorage for immediate UI persistence across page switches
  useEffect(() => {
    localStorage.setItem('workpilot_learning_courses', JSON.stringify(courses))
  }, [courses])

  // Fetch live tasks and onboarding status from real-time API
  const loadLearningData = useCallback(async () => {
    setSyncing(true)
    try {
      const [tasks, onboarding] = await Promise.all([
        fetchTasks(USER_ID),
        fetchOnboardingStatus(USER_ID)
      ])

      const learningTasks = tasks.filter(t =>
        t.category === 'LEARNING' || t.category === 'ONBOARDING' || t.category === 'HR'
      )

      setCourses(prevCourses => {
        const merged = [...prevCourses]

        // Integrate live API tasks dynamically
        learningTasks.forEach(t => {
          const title = t.title
          const existingIdx = merged.findIndex(c => c.title.toLowerCase() === title.toLowerCase())
          const isCompleted = t.completed

          if (existingIdx >= 0) {
            merged[existingIdx] = {
              ...merged[existingIdx],
              status: isCompleted ? 'completed' : merged[existingIdx].status,
              progress: isCompleted ? 100 : merged[existingIdx].progress,
              taskId: t.taskId
            }
          } else {
            merged.push({
              id: t.taskId || `course-api-${Date.now()}`,
              title: t.title,
              category: 'Required',
              status: isCompleted ? 'completed' : 'in-progress',
              progress: isCompleted ? 100 : 25,
              deadline: t.dueDate || 'Assigned via AI Assistant',
              taskId: t.taskId
            })
          }
        })

        // Integrate onboarding workflow tasks if returned from API
        if (onboarding && onboarding.tasks) {
          onboarding.tasks.forEach(t => {
            if (!merged.some(m => m.title.toLowerCase() === t.title.toLowerCase())) {
              merged.push({
                id: t.taskId || `onboard-${Date.now()}`,
                title: t.title,
                category: 'Required',
                status: t.completed ? 'completed' : 'in-progress',
                progress: t.completed ? 100 : 30,
                deadline: 'Intern Onboarding Requirement'
              })
            }
          })
        }

        return merged
      })

      setLastSynced(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('[Learning] Error loading live learning data:', err)
    } finally {
      setSyncing(false)
      setLoading(false)
    }
  }, [])

  // Initial load and periodic real-time sync (every 5 seconds)
  useEffect(() => {
    loadLearningData()
    const interval = setInterval(loadLearningData, 5000)

    const handleUpdate = () => loadLearningData()
    window.addEventListener('workpilot-data-updated', handleUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener('workpilot-data-updated', handleUpdate)
    }
  }, [loadLearningData])

  // Course Player Modal actions
  const openCoursePlayer = (course) => {
    setActiveCourse(course)
    setSelectedProgress(course.progress)
  }

  const handleSaveProgress = async (newProgress) => {
    if (!activeCourse) return

    const newStatus = newProgress >= 100 ? 'completed' : (newProgress > 0 ? 'in-progress' : 'not-started')

    // Update local state immediately
    setCourses(prev => prev.map(c => {
      if (c.id === activeCourse.id) {
        return { ...c, progress: newProgress, status: newStatus }
      }
      return c
    }))

    // Add activity entry
    setActivityLog(prev => [
      {
        id: Date.now(),
        text: `Updated "${activeCourse.title}" progress to ${newProgress}%`,
        time: 'Just now',
        icon: newProgress >= 100 ? 'check' : 'book'
      },
      ...prev.slice(0, 4)
    ])

    // Save to real-time API Gateway / DynamoDB
    await saveLearningProgress({
      courseId: activeCourse.taskId || activeCourse.id,
      title: activeCourse.title,
      progress: newProgress,
      status: newStatus,
      userId: USER_ID
    })

    setActiveCourse(null)
  }

  const required = courses.filter(c => c.category === 'Required' || c.category === 'LEARNING' || c.category === 'ONBOARDING')
  const elective = courses.filter(c => c.category === 'Elective')
  const completedCount = required.filter(l => l.status === 'completed').length
  const avgProgress = required.length > 0
    ? Math.round(required.reduce((a, b) => a + (b.progress || 0), 0) / required.length)
    : 0

  return (
    <div className="learning-page-container">
      {/* Header with Real-Time Indicator */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
              Learning & Compliance
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
            Real-time compliance tracking & assigned enterprise training courses
          </p>
        </div>

        {/* Sync Status Button */}
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Synced {lastSynced}
          </span>
          <button
            onClick={loadLearningData}
            disabled={syncing}
            className="btn btn-secondary flex items-center gap-2"
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
          >
            <Icon name="refresh" size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Hero Compliance Progress Card */}
      <div className="card mb-6" style={{
        background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #6366f1 100%)',
        borderColor: 'transparent',
        boxShadow: '0 10px 25px -5px rgba(79,70,229,0.3)',
        borderRadius: 16
      }}>
        <div className="card-body p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem', fontWeight: 500, marginBottom: 4 }}>
                Overall Compliance & Training Progress
              </div>
              <div className="flex items-baseline gap-3">
                <span style={{ color: 'white', fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>
                  {avgProgress}%
                </span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                  ({completedCount} of {required.length} Required Completed)
                </span>
              </div>
            </div>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              color: 'white'
            }}>
              <Icon name="star" size={28} />
            </div>
          </div>

          <ProgressBar pct={avgProgress} />

          <div className="flex items-center justify-between mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <span>Status: {avgProgress >= 80 ? '🟢 Compliant' : '🟡 In Progress'}</span>
            <span>Auto-synced with AWS API Gateway</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Required Training + Live Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left 2 Cols: Required Courses */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title" style={{ margin: 0 }}>Required Enterprise Training</h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {required.length} courses
            </span>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-tertiary)' }}>Loading training catalog...</p>
          ) : (
            <div className="flex flex-col gap-4">
              {required.map(course => {
                const st = STATUS_STYLES[course.status] || STATUS_STYLES['in-progress']
                return (
                  <div
                    key={course.id}
                    className="card p-4 hover:shadow-md transition-all"
                    style={{
                      borderLeft: `4px solid ${course.progress === 100 ? '#22c55e' : '#6366f1'}`,
                      background: 'var(--bg-card)'
                    }}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {course.title}
                        </h3>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                          📅 {course.deadline}
                        </div>
                      </div>
                      <span className={`badge ${st.badge}`}>{st.label}</span>
                    </div>

                    <div className="learning-progress-row flex items-center justify-between text-xs mb-1.5">
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Progress</span>
                      <span style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{course.progress}%</span>
                    </div>
                    <ProgressBar pct={course.progress} />

                    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
                      <button
                        onClick={() => openCoursePlayer(course)}
                        className="btn btn-primary flex items-center gap-2"
                        style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
                      >
                        <Icon name={course.progress === 100 ? 'check' : 'play'} size={14} />
                        {course.progress === 100 ? 'Review Course' : (course.progress > 0 ? 'Resume Course' : 'Start Course')}
                      </button>

                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('assistant')}
                          className="btn btn-secondary flex items-center gap-1.5"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}
                        >
                          <Icon name="message-square" size={13} />
                          Ask AI Assistant
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Real-Time Activity Feed & Recommendations */}
        <div className="flex flex-col gap-6">
          {/* AI Recommended Course */}
          <div className="card p-4" style={{ background: 'var(--brand-50)', borderColor: 'var(--brand-200)' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--brand-700)', fontWeight: 600, fontSize: '0.875rem' }}>
              <Icon name="zap" size={16} />
              AI Recommendation
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Finish <strong>Security Awareness Training</strong> (80% complete) to achieve 100% compliance before tomorrow’s deadline.
            </p>
            <button
              onClick={() => openCoursePlayer(courses[0])}
              className="btn btn-primary w-full"
              style={{ fontSize: '0.8125rem', padding: '7px 12px' }}
            >
              Finish Now (+20% Compliance)
            </button>
          </div>

          {/* Real-Time Activity Feed */}
          <div className="card p-4">
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }} className="flex items-center gap-2">
              <Icon name="activity" size={16} />
              Real-Time Activity Stream
            </h3>
            <div className="flex flex-col gap-3">
              {activityLog.map(item => (
                <div key={item.id} className="flex items-start gap-2.5 text-xs">
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'var(--brand-100)',
                    color: 'var(--brand-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    flexShrink: 0
                  }}>
                    <Icon name={item.icon} size={12} />
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.text}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Elective Courses */}
      <h2 className="section-title mb-4">Elective Professional Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {elective.map(course => {
          const st = STATUS_STYLES[course.status] || STATUS_STYLES['not-started']
          return (
            <div key={course.id} className="card p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {course.title}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{course.deadline}</div>
                </div>
                <span className={`badge ${st.badge}`}>{st.label}</span>
              </div>
              <div className="learning-progress-row flex items-center justify-between text-xs mb-1.5">
                <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                <span style={{ fontWeight: 600 }}>{course.progress}%</span>
              </div>
              <ProgressBar pct={course.progress} />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => openCoursePlayer(course)}
                  className="btn btn-secondary text-xs"
                  style={{ padding: '5px 12px' }}
                >
                  {course.progress > 0 ? 'Continue' : 'Start Course'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Interactive Course Player & Progress Simulator Modal */}
      {activeCourse && (
        <div className="modal-backdrop flex items-center justify-center p-4" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000
        }}>
          <div className="card p-6" style={{ width: '100%', maxWidth: 540, borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="badge badge-brand mb-1">Interactive Course Player</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {activeCourse.title}
                </h2>
              </div>
              <button onClick={() => setActiveCourse(null)} className="btn btn-secondary text-xs p-2">✕</button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Update your real-time training progress below. Progress is automatically synced with AWS API Gateway.
            </p>

            {/* Course Modules List */}
            <div className="mb-6 p-3 rounded-lg" style={{ background: 'var(--gray-50)', border: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                COURSE MODULES & SYLLABUS:
              </div>
              {(COURSE_MODULES[activeCourse.id] || [
                { title: 'Module 1: Policy Overview & Enterprise Standards', duration: '15 min', completed: selectedProgress >= 50 },
                { title: 'Module 2: Final Assessment & Certificate', duration: '15 min', completed: selectedProgress === 100 }
              ]).map((m, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0 border-gray-200">
                  <span className="flex items-center gap-2" style={{ color: m.completed ? 'var(--success-600)' : 'var(--text-primary)' }}>
                    <Icon name={m.completed ? 'check-circle' : 'circle'} size={14} />
                    {m.title}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>{m.duration}</span>
                </div>
              ))}
            </div>

            {/* Interactive Progress Slider */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm font-semibold mb-2">
                <span>Set Progress Percentage:</span>
                <span style={{ color: 'var(--brand-600)', fontSize: '1.125rem' }}>{selectedProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={selectedProgress}
                onChange={(e) => setSelectedProgress(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--brand-600)', height: 6, cursor: 'pointer' }}
              />
              <div className="flex gap-2 mt-3">
                <button onClick={() => setSelectedProgress(Math.min(100, selectedProgress + 20))} className="btn btn-secondary text-xs flex-1">
                  +20% Progress
                </button>
                <button onClick={() => setSelectedProgress(100)} className="btn btn-secondary text-xs flex-1" style={{ color: 'var(--success-600)' }}>
                  Mark 100% Complete
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button onClick={() => setActiveCourse(null)} className="btn btn-secondary text-sm">
                Cancel
              </button>
              <button
                onClick={() => handleSaveProgress(selectedProgress)}
                className="btn btn-primary text-sm flex items-center gap-2"
              >
                <Icon name="check" size={16} />
                Save & Sync Real-Time API
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
