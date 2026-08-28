import { useState } from 'react'
import Icon from '../components/Icon'
import { signUpUser, loginUser } from '../services/api'

export default function Auth({ onLoginSuccess }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Sign Up form state
  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    gender: 'Male',
    designation: '',
    password: '',
    confirmPassword: '',
  })

  const handleSignUpChange = (field, value) => {
    setSignUpData(prev => ({ ...prev, [field]: value }))
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please fill in both email and password.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const res = await loginUser({ email: loginEmail, password: loginPassword })
      setSuccessMsg('Authenticated successfully! Redirecting...')
      setTimeout(() => {
        onLoginSuccess(res.user)
      }, 500)
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUpSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!signUpData.name.trim()) {
      setErrorMsg('Full Name is required.')
      return
    }
    if (!signUpData.email.trim() || !signUpData.email.includes('@')) {
      setErrorMsg('Valid Email Address is required.')
      return
    }
    if (!signUpData.phoneNumber.trim()) {
      setErrorMsg('Phone Number is required.')
      return
    }
    if (!signUpData.designation.trim()) {
      setErrorMsg('Designation is required.')
      return
    }
    if (!signUpData.password || signUpData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.')
      return
    }
    if (signUpData.password !== signUpData.confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await signUpUser(signUpData)
      setSuccessMsg('Account created in AWS Cognito! Logging you in...')
      setTimeout(() => {
        onLoginSuccess(res.user)
      }, 800)
    } catch (err) {
      setErrorMsg(err.message || 'Account creation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoLogin = () => {
    setMode('login')
    setLoginEmail('priya.sharma@apex-enterprise.com')
    setLoginPassword('WorkPilot@2026')
  }

  return (
    <div className="auth-container" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
      padding: '24px 16px',
      overflowY: 'auto',
      zIndex: 9999,
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
    }}>
      {/* Background glow Orbs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '15%',
        width: 380,
        height: 380,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(134, 59, 255, 0.35) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '15%',
        width: 420,
        height: 420,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(71, 191, 255, 0.25) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
      }} />

      {/* Main Glassmorphism Auth Card */}
      <div style={{
        width: '100%',
        maxWidth: mode === 'signup' ? 540 : 440,
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        borderRadius: 20,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 10,
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '32px 32px 20px 32px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.8) 0%, rgba(255,255,255,1) 100%)',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #7e14ff 0%, #47bfff 100%)',
            boxShadow: '0 8px 20px rgba(126, 20, 255, 0.3)',
            marginBottom: 12,
          }}>
            <img src="/favicon.svg" alt="WorkPilot AI Logo" style={{ width: 28, height: 28 }} />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#0f172a',
            margin: 0,
          }}>
            WorkPilot <span style={{ color: '#7e14ff' }}>AI</span>
          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: '#64748b',
            marginTop: 4,
            marginBottom: 0,
          }}>
            Enterprise Autonomous Employee Assistant
          </p>

          {/* Mode Switcher Tabs */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: 12,
            padding: 4,
            marginTop: 20,
            gap: 4,
          }}>
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg('') }}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: mode === 'login' ? '#ffffff' : 'transparent',
                color: mode === 'login' ? '#7e14ff' : '#64748b',
                boxShadow: mode === 'login' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg('') }}
              style={{
                flex: 1,
                padding: '8px 16px',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: mode === 'signup' ? '#ffffff' : 'transparent',
                color: mode === 'signup' ? '#7e14ff' : '#64748b',
                boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px 32px 32px 32px' }}>
          {/* Error Banner */}
          {errorMsg && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 14px',
              borderRadius: 10,
              fontSize: '0.84rem',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Icon name="alertTriangle" size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#16a34a',
              padding: '12px 14px',
              borderRadius: 10,
              fontSize: '0.84rem',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <Icon name="checkCircle" size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Work Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="name@apex-enterprise.com"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    required
                    style={{ width: '100%', paddingLeft: 38, height: 42 }}
                  />
                  <div style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }}>
                    <Icon name="mail" size={18} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#334155' }}>
                    Password
                  </label>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required
                    style={{ width: '100%', paddingLeft: 38, paddingRight: 38, height: 42 }}
                  />
                  <div style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }}>
                    <Icon name="lock" size={18} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 10,
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  height: 44,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #7e14ff 0%, #6366f1 100%)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(126, 20, 255, 0.35)',
                }}
              >
                {loading ? 'Authenticating with AWS Cognito...' : 'Sign In to Workspace'}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUpSubmit}>
              {/* Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ankit Verma"
                    value={signUpData.name}
                    onChange={e => handleSignUpChange('name', e.target.value)}
                    required
                    style={{ width: '100%', paddingLeft: 36, height: 40 }}
                  />
                  <div style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }}>
                    <Icon name="user" size={16} />
                  </div>
                </div>
              </div>

              {/* Email & Phone grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="ankit@apex.com"
                    value={signUpData.email}
                    onChange={e => handleSignUpChange('email', e.target.value)}
                    required
                    style={{ width: '100%', height: 40 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+1 555-0192"
                    value={signUpData.phoneNumber}
                    onChange={e => handleSignUpChange('phoneNumber', e.target.value)}
                    required
                    style={{ width: '100%', height: 40 }}
                  />
                </div>
              </div>

              {/* Gender & Designation grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Gender
                  </label>
                  <select
                    className="form-input"
                    value={signUpData.gender}
                    onChange={e => handleSignUpChange('gender', e.target.value)}
                    style={{ width: '100%', height: 40 }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other / Decline</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Software Engineer"
                    value={signUpData.designation}
                    onChange={e => handleSignUpChange('designation', e.target.value)}
                    required
                    style={{ width: '100%', height: 40 }}
                  />
                </div>
              </div>

              {/* Password & Confirm Password grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Min 6 chars"
                      value={signUpData.password}
                      onChange={e => handleSignUpChange('password', e.target.value)}
                      required
                      style={{ width: '100%', paddingRight: 32, height: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      style={{ position: 'absolute', right: 8, top: 9, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <Icon name={showPassword ? 'eyeOff' : 'eye'} size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: 5 }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Re-enter password"
                      value={signUpData.confirmPassword}
                      onChange={e => handleSignUpChange('confirmPassword', e.target.value)}
                      required
                      style={{ width: '100%', paddingRight: 32, height: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(s => !s)}
                      style={{ position: 'absolute', right: 8, top: 9, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  height: 44,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #7e14ff 0%, #6366f1 100%)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(126, 20, 255, 0.35)',
                }}
              >
                {loading ? 'Creating AWS Cognito Account...' : 'Create AWS Enterprise Account'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 32px',
          background: '#f8fafc',
          borderTop: '1px solid #f1f5f9',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#94a3b8',
        }}>
          Protected by AWS Cognito &amp; Bedrock Enterprise Security · us-east-1
        </div>
      </div>
    </div>
  )
}
