import { useState } from 'react'
import Icon from '../components/Icon'

const COMMON_ISSUES = [
  { id: 'vpn',      label: 'VPN Not Working',  icon: 'wifi',    color: 'var(--danger-500)',  bg: 'var(--danger-50)' },
  { id: 'password', label: 'Password Reset',   icon: 'lock',    color: 'var(--warning-500)', bg: 'var(--warning-50)' },
  { id: 'laptop',   label: 'Laptop Issue',     icon: 'laptop',  color: 'var(--info-500)',    bg: 'var(--info-50)' },
  { id: 'software', label: 'Software Access',  icon: 'package', color: 'var(--brand-500)',   bg: 'var(--brand-50)' },
]

const MOCK_IT_RESPONSES = {
  vpn: "For VPN issues:\n\n1. Restart your VPN client completely.\n2. Check your internet connection.\n3. Try a different VPN server region.\n4. Clear the VPN client cache and reconnect.\n\nIf the issue persists, a support ticket will be raised and IT will respond within 2 business hours.",
  password: "To reset your password:\n\n1. Go to the Self-Service Portal at identity.company.com.\n2. Click 'Forgot Password'.\n3. Verify your identity using your company email.\n4. Follow the reset link sent to your registered email.\n\nFor urgent access, call the IT helpdesk directly.",
  laptop: "For laptop hardware issues:\n\n1. Check if the device needs a restart.\n2. Run the built-in hardware diagnostics tool.\n3. Check for pending OS/driver updates.\n\nIf the issue is physical damage or won't boot, please log a priority ticket and bring the device to the IT office.",
  software: "For software access requests:\n\n1. Submit a request through the IT Service Portal.\n2. Your manager will be notified for approval.\n3. Once approved, access is provisioned within 24 hours.\n\nFor urgent requirements, request expedited processing and mention your manager's name.",
}

export default function ITSupport() {
  const [issueText, setIssueText] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)

  const handleQuickIssue = (issue) => {
    setSelectedIssue(issue.id)
    setIssueText(`I have an issue with: ${issue.label}`)
    setResponse(null)
  }

  const handleGetHelp = () => {
    if (!issueText.trim()) return
    setLoading(true)
    setResponse(null)

    setTimeout(() => {
      setLoading(false)
      const lower = issueText.toLowerCase()
      let key = 'vpn'
      if (lower.includes('password') || lower.includes('reset')) key = 'password'
      else if (lower.includes('laptop') || lower.includes('hardware')) key = 'laptop'
      else if (lower.includes('software') || lower.includes('access') || lower.includes('install')) key = 'software'

      setResponse({
        text: MOCK_IT_RESPONSES[key],
        ticketId: `INC-${Math.floor(Math.random() * 90000) + 10000}`,
      })
    }, 1200)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          IT Support
        </h1>
        <p className="text-secondary">Get AI-powered help for common IT issues</p>
      </div>

      {/* Common Issues */}
      <h2 className="section-title">Common Issues</h2>
      <div className="grid-4 mb-6">
        {COMMON_ISSUES.map(issue => (
          <button
            key={issue.id}
            className={`issue-chip ${selectedIssue === issue.id ? 'selected' : ''}`}
            onClick={() => handleQuickIssue(issue)}
            id={`it-issue-${issue.id}`}
            style={selectedIssue === issue.id ? {
              borderColor: 'var(--brand-400)',
              background: 'var(--brand-50)',
            } : {}}
          >
            <div className="issue-chip-icon" style={{ background: issue.bg }}>
              <span style={{ color: issue.color }}>
                <Icon name={issue.icon} size={20} />
              </span>
            </div>
            <span className="issue-chip-label">{issue.label}</span>
          </button>
        ))}
      </div>

      {/* AI Help Input */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Describe Your Issue</span>
          <span className="badge badge-brand">AI Powered</span>
        </div>
        <div className="card-body">
          <textarea
            id="it-issue-input"
            className="form-input form-textarea"
            placeholder="Describe your IT issue in detail... e.g. 'My VPN disconnects every 30 minutes when I'm on WiFi'"
            value={issueText}
            onChange={e => setIssueText(e.target.value)}
            rows={3}
            aria-label="Describe your IT issue"
          />
          <div className="flex items-center justify-between mt-3" style={{ flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              AI will provide troubleshooting steps and auto-escalate if needed
            </span>
            <button
              className="btn btn-primary"
              onClick={handleGetHelp}
              disabled={!issueText.trim() || loading}
              id="it-get-help-btn"
            >
              {loading ? (
                <span>Analyzing...</span>
              ) : (
                <>
                  <Icon name="zap" size={15} />
                  Get AI Help
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* AI Response */}
      {loading && (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            Analyzing your issue...
          </div>
        </div>
      )}

      {response && !loading && (
        <div>
          <div className="card mb-3" style={{
            borderLeft: '3px solid var(--brand-500)',
            background: 'linear-gradient(135deg, var(--brand-50), white)',
          }}>
            <div className="card-header">
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--brand-500)' }}><Icon name="zap" size={16} /></span>
                <span className="card-title">AI Recommendation</span>
              </div>
              <span className="badge badge-success">Ticket: {response.ticketId}</span>
            </div>
            <div className="card-body">
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-primary)' }}>
                {response.text}
              </div>
            </div>
          </div>

          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-primary" id="it-log-ticket-btn">
              <Icon name="external" size={14} />
              Log Full Ticket
            </button>
            <button className="btn btn-secondary" id="it-escalate-btn">
              Escalate to Engineer
            </button>
            <button className="btn btn-ghost" onClick={() => { setResponse(null); setIssueText(''); setSelectedIssue(null) }}>
              Ask Another Question
            </button>
          </div>
        </div>
      )}

      {/* Status Banner */}
      <div className="card mt-6" style={{
        background: 'var(--success-50)',
        borderColor: 'var(--success-200)',
        padding: '14px 18px',
      }}>
        <div className="flex items-center gap-10" style={{ flexWrap: 'wrap', gap: 24 }}>
          <div className="flex items-center gap-2">
            <span className="status-dot online" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--success-600)' }}>All Systems Operational</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            IT Response Time: &lt;2 hours · Helpdesk: Mon–Fri 8AM–6PM
          </span>
        </div>
      </div>
    </div>
  )
}
