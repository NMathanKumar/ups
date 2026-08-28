import { useState } from 'react'
import Icon from '../components/Icon'
import SourceCard from '../components/SourceCard'
import { queryAssistant } from '../services/api'

const USER_ID = 'EMP001'

const COMMON_ISSUES = [
  { id: 'vpn',      label: 'VPN Not Working',  icon: 'wifi',    color: 'var(--danger-500)',  bg: 'var(--danger-50)', text: 'What should I do if my laptop is not connecting to VPN?' },
  { id: 'password', label: 'Password Reset',   icon: 'lock',    color: 'var(--warning-500)', bg: 'var(--warning-50)', text: 'How do I reset my company password?' },
  { id: 'laptop',   label: 'Laptop Support',   icon: 'laptop',  color: 'var(--info-500)',    bg: 'var(--info-50)', text: 'How do I get laptop hardware support or replacement?' },
  { id: 'software', label: 'Software Access',  icon: 'package', color: 'var(--brand-500)',   bg: 'var(--brand-50)', text: 'How do I request software access and permissions?' },
]

export default function ITSupport() {
  const [issueText, setIssueText] = useState('')
  const [response, setResponse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)

  const handleQuickIssue = (issue) => {
    setSelectedIssue(issue.id)
    setIssueText(issue.text)
    handleGetHelpText(issue.text)
  }

  const handleGetHelpText = async (text) => {
    if (!text.trim()) return
    setLoading(true)
    setResponse(null)

    try {
      const res = await queryAssistant(text, USER_ID)
      setResponse(res)
    } catch (err) {
      setResponse({
        answer: `Unable to connect to IT Knowledge Base. Please try again. (${err.message})`,
        sources: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGetHelp = () => {
    handleGetHelpText(issueText)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
          IT Support
        </h1>
        <p className="text-secondary">Get AI-powered help grounded in company IT documentation</p>
      </div>

      {/* Common Issues */}
      <h2 className="section-title">Common IT Queries</h2>
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
          <span className="card-title">Ask IT Support AI</span>
          <span className="badge badge-brand">Bedrock Knowledge Base</span>
        </div>
        <div className="card-body">
          <textarea
            id="it-issue-input"
            className="form-input form-textarea"
            placeholder="Describe your IT issue... e.g. 'My VPN isn't connecting on WiFi'"
            value={issueText}
            onChange={e => setIssueText(e.target.value)}
            rows={3}
            aria-label="Describe your IT issue"
          />
          <div className="flex items-center justify-between mt-3" style={{ flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Responses are grounded in verified enterprise IT documentation.
            </span>
            <button
              className="btn btn-primary"
              onClick={handleGetHelp}
              disabled={!issueText.trim() || loading}
              id="it-get-help-btn"
            >
              {loading ? (
                <span>Searching IT Knowledge Base...</span>
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
            Searching IT policy documents via Bedrock RAG...
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
              {response.category && <span className="badge badge-brand">{response.category}</span>}
            </div>
            <div className="card-body">
              <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-primary)' }}>
                {response.answer}
              </div>

              {response.sources && response.sources.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Verified Source:</span>
                  <div style={{ marginTop: 6 }}>
                    <SourceCard source={{ fileName: response.sources[0].document, system: response.sources[0].category || 'IT Support' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
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
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--success-600)' }}>All Enterprise Systems Operational</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Bedrock RAG Active · Helpdesk: Mon–Fri 8AM–6PM
          </span>
        </div>
      </div>
    </div>
  )
}
