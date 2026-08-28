import Icon from './Icon'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview',     icon: 'home' },
  { id: 'assistant', label: 'AI Assistant', icon: 'bot',    badge: null },
  { id: 'tasks',     label: 'My Tasks',     icon: 'tasks',  badge: '3' },
  { id: 'learning',  label: 'Learning',     icon: 'book',   badge: '2' },
  { id: 'itsupport', label: 'IT Support',   icon: 'monitor' },
  { id: 'policies',  label: 'Policies',     icon: 'file' },
]

const WORKSPACE_ITEMS = [
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'help',     label: 'Help',     icon: 'help' },
]

export default function Sidebar({ activePage, onNavigate, isOpen }) {
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
        <button className="sidebar-user" id="sidebar-user-profile" aria-label="User profile">
          <div className="user-avatar" aria-hidden="true">AM</div>
          <div className="user-info">
            <div className="user-name">Alex Morgan</div>
            <div className="user-role">Product Engineer</div>
          </div>
          <Icon name="moreVertical" size={16} />
        </button>
      </footer>
    </aside>
  )
}
