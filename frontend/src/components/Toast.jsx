import { useEffect } from 'react'
import Icon from './Icon'

export default function Toast({ toasts, onRemove }) {
  useEffect(() => {
    const timers = toasts.map(t =>
      setTimeout(() => onRemove(t.id), 3500)
    )
    return () => timers.forEach(clearTimeout)
  }, [toasts, onRemove])

  if (!toasts.length) return null

  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type === 'success' ? 'toast-success' : ''}`}>
          <span className="toast-icon" aria-hidden="true">
            {t.type === 'success' ? '✓' : 'ℹ'}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
