import Icon from './Icon'

export default function Header({ pageLabel, onToggleSidebar }) {
  return (
    <header className="page-header" role="banner">
      <div className="header-left">
        <button
          className="header-hamburger"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          id="header-menu-toggle"
        >
          <Icon name="menu" size={20} />
        </button>
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
        <div className="header-avatar" role="button" tabIndex={0} aria-label="User menu" id="header-avatar">
          AM
        </div>
      </div>
    </header>
  )
}
