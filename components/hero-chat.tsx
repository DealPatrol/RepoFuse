'use client'

import { useState } from 'react'

export function HeroChat() {
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!message.trim()) return
    setSubmitted(true)

    // After 2 seconds of analyzing, redirect to GitHub sign in
    setTimeout(() => {
      window.location.href = `/api/auth/github/login?returnTo=/dashboard`
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div style={styles.container}>
      {!submitted ? (
        <div style={styles.heroBox}>
          <h1 style={styles.title}>
            Your Million Dollar Idea<br />
            <span style={styles.titleGradient}>is hiding in your code</span>
          </h1>

          <p style={styles.subtitle}>
            Describe what you want to build — RepoFuse will scan your repos and surface hidden opportunities.
          </p>

          <div style={styles.chatBox}>
            <input
              style={styles.input}
              placeholder="What do you want to build? (AI SaaS, mobile app, open-source project...)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
            />
            <button
              style={{
                ...styles.button,
                opacity: message.trim() ? 1 : 0.5,
                cursor: message.trim() ? 'pointer' : 'not-allowed',
              }}
              onClick={handleSubmit}
              disabled={!message.trim()}
            >
              Generate
            </button>
          </div>

          <p style={styles.hint}>
            Sign in with GitHub to analyze your repositories
          </p>
        </div>
      ) : (
        <div style={styles.analysisBox}>
          <h2 style={styles.loadingTitle}>Analyzing your idea…</h2>
          <p style={styles.loadingSubtitle}>
            Matching your repos to components, services, and opportunities.
          </p>

          <div style={styles.loader}></div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
    width: '100%',
  } as React.CSSProperties,
  heroBox: {
    maxWidth: 600,
    textAlign: 'center' as const,
    width: '100%',
  } as React.CSSProperties,
  title: {
    fontSize: '36px',
    fontWeight: 700,
    marginBottom: 16,
    color: '#F0F6FC',
    lineHeight: 1.2,
  } as React.CSSProperties,
  titleGradient: {
    background: 'linear-gradient(135deg, #06B6D4 0%, #F59E0B 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '16px',
    color: '#8B949E',
    marginBottom: 32,
    lineHeight: 1.6,
  } as React.CSSProperties,
  chatBox: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    flexDirection: 'row' as const,
  } as React.CSSProperties,
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: '#F0F6FC',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
  } as React.CSSProperties,
  button: {
    padding: '12px 24px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #06B6D4 0%, #0099FF 100%)',
    color: '#0D1117',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  hint: {
    marginTop: 16,
    fontSize: '13px',
    color: '#6B7280',
  } as React.CSSProperties,
  analysisBox: {
    textAlign: 'center' as const,
    width: '100%',
  } as React.CSSProperties,
  loadingTitle: {
    fontSize: '28px',
    fontWeight: 600,
    marginBottom: 10,
    color: '#F0F6FC',
  } as React.CSSProperties,
  loadingSubtitle: {
    fontSize: '14px',
    color: '#8B949E',
    marginBottom: 32,
  } as React.CSSProperties,
  loader: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: '4px solid rgba(6, 182, 212, 0.2)',
    borderTopColor: '#06B6D4',
    animation: 'spin 1s linear infinite',
    margin: '0 auto',
  } as React.CSSProperties,
}
