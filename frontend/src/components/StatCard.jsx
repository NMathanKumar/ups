import Icon from './Icon'

export default function StatCard({ label, value, subtext, color, bgColor, icon, onClick, actionHint }) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        padding: '20px 22px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        userSelect: 'none',
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
      <div className="stat-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="stat-label flex items-center gap-1" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
          {label}
          {onClick && (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 2 }}>
              ↗
            </span>
          )}
        </span>
        <div className="stat-icon" style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: bgColor || '#f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
        }}>
          <span style={{ color: color || '#4f46e5', display: 'flex', alignItems: 'center' }}>
            <Icon name={icon} size={20} />
          </span>
        </div>
      </div>
      <div>
        <div className="stat-value" style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 6 }}>
          {value}
        </div>
        <div className="stat-subtext flex items-center justify-between" style={{ fontSize: '0.775rem', color: '#64748b' }}>
          <span>{subtext}</span>
          {actionHint && (
            <span style={{ fontSize: '0.75rem', color: color || '#4f46e5', fontWeight: 700 }}>
              {actionHint}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
