import Icon from './Icon'

export default function Header({ pageLabel, onToggleSidebar, currentUser }) {
  const userName = currentUser?.name || 'Priya Sharma'
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <header className="page-header" role="banner">
      <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          className="header-hamburger"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          id="header-menu-toggle"
        >
          <Icon name="menu" size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/favicon.svg" alt="WorkPilot AI Logo" style={{ width: 24, height: 24 }} />
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--brand-600)', letterSpacing: '-0.01em' }}>WorkPilot AI</span>
        </div>

        <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>/</span>
        <span className="header-breadcrumb">{pageLabel}</span>
      </div>

      <div className="header-right">
        <button className="header-icon-btn" aria-label="Search" id="header-search-btn">
          <Icon name="search" size={18} />
        </button>
        <button className="header-icon-btn" aria-label="Notifications" id="header-notifications-btn">
          <Icon name="bell" size={18} />
          <span className="notif-dot" aria-hidden="true" />
        </button>
        <div className="header-avatar" role="button" tabIndex={0} aria-label="User menu" id="header-avatar" style={{ background: 'linear-gradient(135deg, #7e14ff 0%, #47bfff 100%)', color: 'white', fontWeight: 700 }}>
          {initials}
        </div>
      </div>
    </header>
  )
}
