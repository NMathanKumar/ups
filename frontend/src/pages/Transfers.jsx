import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import Toast from '../components/Toast'
import { queryAssistant } from '../services/api'

const EMPLOYEES_POOL = [
  { id: 'EMP001', name: 'Priya Sharma', title: 'Senior Product Manager', dept: 'Engineering & Product', email: 'priya.sharma@apex-enterprise.com', assets: 2 },
  { id: 'EMP002', name: 'Meera Nair', title: 'Lead Frontend Engineer', dept: 'UI Innovation', email: 'meera.nair@apex-enterprise.com', assets: 3 },
  { id: 'EMP003', name: 'Alex Rivera', title: 'DevOps & Cloud Lead', dept: 'IT Infrastructure', email: 'alex.rivera@apex-enterprise.com', assets: 2 },
  { id: 'EMP004', name: 'Sarah Jenkins', title: 'HR Business Partner', dept: 'Human Resources', email: 'sarah.jenkins@apex-enterprise.com', assets: 1 },
  { id: 'EMP005', name: 'John Doe', title: 'Security Architect', dept: 'Cybersecurity', email: 'john.doe@apex-enterprise.com', assets: 2 },
  { id: 'EMP006', name: 'Michael Chang', title: 'QA Automation Engineer', dept: 'Operations & Testing', email: 'michael.chang@apex-enterprise.com', assets: 1 },
  { id: 'EMP007', name: 'Emma Watson', title: 'UX Research Specialist', dept: 'Product Design', email: 'emma.watson@apex-enterprise.com', assets: 2 },
]

const DEPARTMENTS = [
  'Engineering & AI Innovation',
  'Product Management & UX',
  'IT Infrastructure & Security',
  'Human Resources & Benefits',
  'Operations & Logistics',
  'Finance & Accounting',
  'Sales & Customer Success',
]

const MANAGERS = [
  'Sarah Jenkins (HR Director)',
  'Alex Rivera (VP Infrastructure)',
  'Priya Sharma (Group PM)',
  'David Vance (VP Engineering)',
  'Elena Rostova (Chief Operations Officer)',
]

export default function Transfers({ currentUser, onNavigate }) {
  const [selectedEmpId, setSelectedEmpId] = useState('EMP002')
  const [targetDept, setTargetDept] = useState('Engineering & AI Innovation')
  const [targetManager, setTargetManager] = useState('David Vance (VP Engineering)')
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().split('T')[0])
  const [reason, setReason] = useState('Departmental reorganization & career mobility request')

  const [toasts, setToasts] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transferHistory, setTransferHistory] = useState([
    {
      id: 'TRF-9021',
      empId: 'EMP003',
      empName: 'Alex Rivera',
      fromDept: 'DevOps',
      toDept: 'IT Infrastructure & Security',
      manager: 'Alex Rivera (VP Infrastructure)',
      date: '2026-08-20',
      status: 'COMPLETED',
    },
  ])

  // Combine logged in user if not in pool
  const allEmployees = [...EMPLOYEES_POOL]
  if (currentUser?.email && !allEmployees.some(e => e.email === currentUser.email)) {
    allEmployees.unshift({
      id: currentUser.employee_id || 'EMP-COGNITO',
      name: currentUser.name || 'Cognito User',
      title: currentUser.designation || 'Product Engineer',
      dept: currentUser.department || 'Engineering',
      email: currentUser.email,
      assets: 2,
    })
  }

  const selectedEmployee = allEmployees.find(e => e.id === selectedEmpId) || allEmployees[0]

  const addToast = (msg, type = 'success') => {
    setToasts(prev => [...prev, { id: Date.now(), message: msg, type }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const handleExecuteTransfer = async (e) => {
    e.preventDefault()
    if (!selectedEmployee) return

    setIsSubmitting(true)
    try {
      const prompt = `Transfer employee ${selectedEmployee.id} (${selectedEmployee.name}) from ${selectedEmployee.dept} to ${targetDept} department under manager ${targetManager}.`
      
      const res = await queryAssistant(prompt, currentUser?.employee_id || 'EMP001', true)

      const trfId = `TRF-${Math.floor(1000 + Math.random() * 9000)}`
      const newRecord = {
        id: trfId,
        empId: selectedEmployee.id,
        empName: selectedEmployee.name,
        fromDept: selectedEmployee.dept,
        toDept: targetDept,
        manager: targetManager,
        date: transferDate,
        status: 'COMPLETED',
      }

      setTransferHistory(prev => [newRecord, ...prev])
      addToast(`Employee transfer logged successfully! Ticket: ${trfId}`, 'success')
      setReason('')
    } catch (err) {
      console.error('[Transfers] Error executing transfer:', err)
      addToast(`Transfer submission failed: ${err.message}`, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="transfers-workspace" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #131921 0%, #232f3e 100%)',
        borderRadius: '12px',
        padding: '24px 32px',
        color: '#ffffff',
        marginBottom: '28px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeft: '5px solid #ff9900'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#ffffff' }}>
            🔄 Resource & Employee Mobility Workspace
          </h1>
          <p style={{ margin: '6px 0 0 0', color: '#a0aec0', fontSize: '14px' }}>
            Fetch Cognito & enterprise pool users, initiate department transfers, and manage project resource allocations.
          </p>
        </div>
        <button
          onClick={() => onNavigate('assistant')}
          style={{
            background: 'linear-gradient(135deg, #ff9900 0%, #ec7211 100%)',
            color: '#131921',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(255,153,0,0.3)'
          }}
        >
          <Icon name="bot" size={18} />
          Ask AI Assistant
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Form Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <h3 style={{ marginTop: 0, color: '#1a202c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
            <Icon name="users" size={20} style={{ color: '#ec7211' }} />
            Initiate Employee Transfer
          </h3>
          <p style={{ color: '#718096', fontSize: '13px', marginBottom: '20px' }}>
            Select an active employee from AWS Cognito / enterprise pool and set receiving parameters.
          </p>

          <form onSubmit={handleExecuteTransfer}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px' }}>
                Select Employee (Cognito / Enterprise Pool) *
              </label>
              <select
                value={selectedEmpId}
                onChange={e => setSelectedEmpId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  background: '#f8fafc',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#1a202c'
                }}
              >
                {allEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id}) — {emp.title} [{emp.dept}]
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px' }}>
                Target Department *
              </label>
              <select
                value={targetDept}
                onChange={e => setTargetDept(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  background: '#ffffff',
                  fontSize: '14px',
                  color: '#1a202c'
                }}
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px' }}>
                Receiving Manager *
              </label>
              <select
                value={targetManager}
                onChange={e => setTargetManager(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  background: '#ffffff',
                  fontSize: '14px',
                  color: '#1a202c'
                }}
              >
                {MANAGERS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px' }}>
                Effective Date
              </label>
              <input
                type="date"
                value={transferDate}
                onChange={e => setTransferDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#2d3748', marginBottom: '6px' }}>
                Reorganization / Transfer Reason
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Specify career development or team restructuring details..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e0',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: isSubmitting ? '#cbd5e0' : 'linear-gradient(135deg, #ec7211 0%, #d96509 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '12px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(236,114,17,0.3)'
              }}
            >
              <Icon name="check" size={18} />
              {isSubmitting ? 'Executing Transfer Workflow...' : 'Execute Employee Transfer Workflow'}
            </button>
          </form>
        </div>

        {/* Live Employee Profile Inspector */}
        <div>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0, color: '#1a202c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Icon name="help" size={20} style={{ color: '#2b6cb0' }} />
              Selected Employee Inspector
            </h3>

            {selectedEmployee ? (
              <div style={{ marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#232f3e',
                    color: '#ff9900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '18px'
                  }}>
                    {selectedEmployee.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', color: '#1a202c' }}>{selectedEmployee.name}</h4>
                    <span style={{ fontSize: '13px', color: '#718096' }}>{selectedEmployee.title}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div style={{ background: '#f7fafc', padding: '10px 12px', borderRadius: '6px' }}>
                    <span style={{ color: '#718096', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Employee ID</span>
                    <strong style={{ color: '#2d3748' }}>{selectedEmployee.id}</strong>
                  </div>
                  <div style={{ background: '#f7fafc', padding: '10px 12px', borderRadius: '6px' }}>
                    <span style={{ color: '#718096', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Current Dept</span>
                    <strong style={{ color: '#2d3748' }}>{selectedEmployee.dept}</strong>
                  </div>
                  <div style={{ background: '#f7fafc', padding: '10px 12px', borderRadius: '6px' }}>
                    <span style={{ color: '#718096', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Enterprise Email</span>
                    <strong style={{ color: '#2d3748', fontSize: '12px' }}>{selectedEmployee.email}</strong>
                  </div>
                  <div style={{ background: '#f7fafc', padding: '10px 12px', borderRadius: '6px' }}>
                    <span style={{ color: '#718096', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Hardware Assets</span>
                    <strong style={{ color: '#2b6cb0' }}>{selectedEmployee.assets} Assigned Devices</strong>
                  </div>
                </div>

                <div style={{ marginTop: '16px', padding: '12px', background: '#ebf8ff', borderRadius: '6px', borderLeft: '4px solid #3182ce', fontSize: '13px', color: '#2c5282' }}>
                  ℹ️ <strong>Workflow Automation:</strong> Submitting this transfer will update the employee department in DynamoDB, issue an HR Transfer Task, and trigger IT access & permission re-configuration.
                </div>
              </div>
            ) : null}
          </div>

          {/* Resource Allocation Grid */}
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ marginTop: 0, color: '#1a202c', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
              <Icon name="tasks" size={20} style={{ color: '#38a169' }} />
              Available Staff Resources
            </h3>
            <div style={{ fontSize: '13px', color: '#718096', marginBottom: '14px' }}>
              Unassigned project resources available for immediate allocation:
            </div>
            {[
              { name: 'David Kim', title: 'Cloud Architect', skills: 'AWS, Terraform, Kubernetes', avail: 'Immediate' },
              { name: 'Anita Roy', title: 'Data Scientist', skills: 'Bedrock, Python, PyTorch', avail: 'In 3 Days' },
              { name: 'Marcus Chen', title: 'Fullstack Dev', skills: 'React, Node.js, GraphQL', avail: 'Immediate' },
            ].map((r, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderBottom: '1px solid #edf2f7',
                fontSize: '13px'
              }}>
                <div>
                  <strong style={{ color: '#2d3748', display: 'block' }}>{r.name} — {r.title}</strong>
                  <span style={{ color: '#718096', fontSize: '12px' }}>Skills: {r.skills}</span>
                </div>
                <span style={{ background: '#e6fffa', color: '#234e52', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                  {r.avail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer History Table */}
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{ marginTop: 0, color: '#1a202c', fontSize: '18px', marginBottom: '16px' }}>
          📋 Department Transfer Log & Ticket History
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#f7fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px', color: '#4a5568' }}>Ticket ID</th>
              <th style={{ padding: '12px', color: '#4a5568' }}>Employee Name</th>
              <th style={{ padding: '12px', color: '#4a5568' }}>From Dept</th>
              <th style={{ padding: '12px', color: '#4a5568' }}>To Dept</th>
              <th style={{ padding: '12px', color: '#4a5568' }}>Receiving Manager</th>
              <th style={{ padding: '12px', color: '#4a5568' }}>Effective Date</th>
              <th style={{ padding: '12px', color: '#4a5568' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {transferHistory.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600, color: '#ec7211' }}>{row.id}</td>
                <td style={{ padding: '12px', fontWeight: 600, color: '#2d3748' }}>{row.empName} <span style={{ color: '#a0aec0', fontSize: '12px' }}>({row.empId})</span></td>
                <td style={{ padding: '12px', color: '#718096' }}>{row.fromDept}</td>
                <td style={{ padding: '12px', fontWeight: 600, color: '#2b6cb0' }}>{row.toDept}</td>
                <td style={{ padding: '12px', color: '#4a5568' }}>{row.manager}</td>
                <td style={{ padding: '12px', color: '#718096' }}>{row.date}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: '#c6f6d5',
                    color: '#22543d',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
