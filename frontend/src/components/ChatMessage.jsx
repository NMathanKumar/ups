import Icon from './Icon'

export default function ChatMessage({ message, currentUser }) {
  const isUser = message.role === 'user'
  const userName = currentUser?.name || 'Priya Sharma'
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  const formattedText = message.content.split('\n').map((line, i) => (
    <span key={i}>{line}{i < message.content.split('\n').length - 1 && <br />}</span>
  ))

  return (
    <div className={`message-row ${isUser ? 'user' : 'ai'}`} role="listitem">
      <div className={`message-avatar ${isUser ? 'user-avatar-chat' : 'ai-avatar'}`} aria-hidden="true" style={{
        background: isUser ? 'linear-gradient(135deg, #ff9900, #ec7211)' : 'linear-gradient(135deg, #232f3e, #131921)',
        color: isUser ? '#ffffff' : '#ff9900',
        border: isUser ? 'none' : '1.5px solid #ff9900',
        fontWeight: 800
      }}>
        {isUser ? initials : '⚡'}
      </div>
      <div className="message-bubble-wrap">
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`} style={{
          background: isUser ? 'linear-gradient(135deg, #ff9900 0%, #ec7211 100%)' : '#ffffff',
          color: isUser ? '#ffffff' : '#0f172a',
          border: isUser ? 'none' : '1px solid #e2e8f0',
          boxShadow: isUser ? '0 4px 14px rgba(255, 153, 0, 0.35)' : '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          {formattedText}
        </div>
        <span className="message-meta">
          {isUser ? userName : 'WorkPilot AI'} · {message.time}
        </span>
      </div>
    </div>
  )
}
