import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Assistant from './pages/Assistant'
import Tasks from './pages/Tasks'
import Learning from './pages/Learning'
import ITSupport from './pages/ITSupport'
import Policies from './pages/Policies'
import Settings from './pages/Settings'
import Auth from './pages/Auth'

const PAGES = {
  dashboard: Dashboard,
  assistant: Assistant,
  tasks: Tasks,
  learning: Learning,
  itsupport: ITSupport,
  policies: Policies,
  settings: Settings,
}

const PAGE_LABELS = {
  dashboard: 'Overview',
  assistant: 'AI Assistant',
  tasks: 'My Tasks',
  learning: 'Learning',
  itsupport: 'IT Support',
  policies: 'Policies',
  settings: 'Settings',
}

function getInitialPage() {
  const hash = window.location.hash.replace('#', '').trim()
  if (hash && PAGES[hash]) return hash
  const saved = localStorage.getItem('workpilot_active_page')
  if (saved && PAGES[saved]) return saved
  return 'dashboard'
}

function getInitialUser() {
  try {
    const saved = localStorage.getItem('workpilot_auth_user')
    return saved ? JSON.parse(saved) : null
  } catch (e) {
    return null
  }
}

export default function App() {
  const [activePage, setActivePage] = useState(getInitialPage)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(getInitialUser)

  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
    try {
      localStorage.setItem('workpilot_auth_user', JSON.stringify(user))
    } catch (e) {
      console.warn('[app] Could not save user session:', e)
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('workpilot_auth_user')
  }

  // Sync active page with URL hash and localStorage
  useEffect(() => {
    if (window.location.hash.replace('#', '') !== activePage) {
      window.location.hash = activePage
    }
    localStorage.setItem('workpilot_active_page', activePage)
  }, [activePage])

  // Listen for browser back/forward buttons or direct hash updates
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim()
      if (hash && PAGES[hash]) {
        setActivePage(hash)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />
  }

  const PageComponent = PAGES[activePage] || Dashboard

  const handleNav = (page) => {
    setActivePage(page)
    setSidebarOpen(false)
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'mobile-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <Sidebar
        activePage={activePage}
        onNavigate={handleNav}
        isOpen={sidebarOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      <div className="main-content">
        <Header
          pageLabel={PAGE_LABELS[activePage]}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          currentUser={currentUser}
        />
        <main className="page-body">
          <PageComponent onNavigate={handleNav} currentUser={currentUser} />
        </main>
      </div>
    </div>
  )
}
