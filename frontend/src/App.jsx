import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Assistant from './pages/Assistant'
import Tasks from './pages/Tasks'
import Learning from './pages/Learning'
import ITSupport from './pages/ITSupport'
import Policies from './pages/Policies'
import Settings from './pages/Settings'

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

export default function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      />

      <div className="main-content">
        <Header
          pageLabel={PAGE_LABELS[activePage]}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
        />
        <main className="page-body">
          <PageComponent onNavigate={handleNav} />
        </main>
      </div>
    </div>
  )
}
