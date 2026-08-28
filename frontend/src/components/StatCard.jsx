import Icon from './Icon'

export default function StatCard({ label, value, subtext, color, bgColor, icon, onClick, actionHint }) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        userSelect: 'none'
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="stat-card-header">
        <span className="stat-label flex items-center gap-1">
          {label}
          {onClick && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: 4 }}>
              ↗
            </span>
          )}
        </span>
        <div className="stat-icon" style={{ background: bgColor }}>
          <span style={{ color }}>
            <Icon name={icon} size={18} />
          </span>
        </div>
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-subtext flex items-center justify-between">
          <span>{subtext}</span>
          {actionHint && (
            <span style={{ fontSize: '0.7rem', color: color || 'var(--brand-600)', fontWeight: 600 }}>
              {actionHint}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
