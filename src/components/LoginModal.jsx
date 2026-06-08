import React, { useEffect, useRef, useState } from 'react'
import './terminal.css'
import seal from '../assets/seal.svg'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import localforage from 'localforage'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { Tooltip } from 'react-tooltip'
import { motion } from 'framer-motion'
import { useUserProfile } from '../hooks/useUserProfile'

// Demo creds + temporary test fallback
const VALID_CREDENTIALS = [
  { user: 'demo', pass: 'demo' },
  { user: 'test', pass: 'test' },
]

function isValidCredential(user, pass) {
  return VALID_CREDENTIALS.some(entry => entry.user === user && entry.pass === pass)
}

// Small WebAudio helpers
let audioContextRef = null

function ensureAudioContext() {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  if (!audioContextRef) {
    audioContextRef = new AudioCtx()
  }
  if (audioContextRef.state === 'suspended') {
    audioContextRef.resume().catch(() => {})
  }
  return audioContextRef
}

function makeClickAudio() {
  return (volume = 0.02, freq = 1200) => {
    const ctx = ensureAudioContext()
    if (!ctx) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'square'
    o.frequency.value = freq
    g.gain.value = volume
    o.connect(g)
    g.connect(ctx.destination)
    const now = ctx.currentTime
    o.start(now)
    g.gain.setValueAtTime(volume, now)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
    o.stop(now + 0.06)
  }
}

function makeBeepAudio() {
  return (freq = 800, ms = 200) => {
    const ctx = ensureAudioContext()
    if (!ctx) return
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'sawtooth'
    o.frequency.value = freq
    g.gain.value = 0.001
    o.connect(g)
    g.connect(ctx.destination)
    const now = ctx.currentTime
    g.gain.exponentialRampToValueAtTime(0.06, now + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000)
    o.start(now)
    o.stop(now + ms / 1000 + 0.02)
  }
}

export default function LoginModal({ onSuccess }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failCount, setFailCount] = useState(0)
  const [lockdown, setLockdown] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')
  const userRef = useRef(null)
  const click = useRef(null)
  const beep = useRef(null)
  const alarmTimerRef = useRef(null)

  // User Profile Hook
  const { setLoginUser } = useUserProfile()

  // session id + clock
  const sessionId = useRef(uuidv4())
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    click.current = makeClickAudio()
    beep.current = makeBeepAudio()
    ensureAudioContext()
    // focus with small delay for old machine feel
    setTimeout(() => userRef.current && userRef.current.focus(), 250)
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => {
      clearInterval(t)
      if (alarmTimerRef.current) clearInterval(alarmTimerRef.current)
    }
  }, [])

  async function playKey() {
    try {
      const ctx = ensureAudioContext()
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume()
      }
      click.current && click.current(0.03, 980)
    } catch (e) {}
  }

  async function simulateDelay(ms) {
    return new Promise(r => setTimeout(r, ms))
  }

  async function writeAudit(entry){
    try{
      const key = 'audit_log_v1'
      const cur = (await localforage.getItem(key)) || []
      cur.push(entry)
      await localforage.setItem(key, cur)
    }catch(e){ console.error('audit log failed', e) }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setMessage('Verbindung herstellen...')
    const legacyDelay = 900 + Math.random() * 1400
    await simulateDelay(legacyDelay)
    setMessage('Authentifizierung läuft')
    // dot animation
    for (let i = 0; i < 3; i++){
      await simulateDelay(260 + Math.random() * 220)
      setMessage(prev => prev + '.')
      beep.current && beep.current(500, 60)
    }

    // final check
    await simulateDelay(500 + Math.random() * 700)
    const ts = new Date().toISOString()
    const valid = isValidCredential(user, pass)
    const legacyGlitch = Math.random() < 0.18

    if (valid && legacyGlitch) {
      setMessage('Das System antwortet unzuverlässig. Bitte erneut versuchen.')
      beep.current && beep.current(180, 180)
      setBusy(false)
      setPass('')
      userRef.current && userRef.current.focus()
      return
    }

    if (valid) {
      if (alarmTimerRef.current) {
        clearInterval(alarmTimerRef.current)
        alarmTimerRef.current = null
      }
      setMessage('Zugriff gewährt. Initialisiere System...')
      beep.current && beep.current(1000, 140)
      writeAudit({ts, user, action: 'login', result: 'success', info: navigator.userAgent})
      
      // Speichere User-Profil persistent
      await setLoginUser({
        username: user,
        loginTime: ts,
        sessionId: sessionId.current,
        isLoggedIn: true
      })
      
      await simulateDelay(900)
      onSuccess && onSuccess()
      setFailCount(0)
    } else {
      const newFail = failCount + 1
      setFailCount(newFail)
  setMessage('Authentifizierung fehlgeschlagen. Bitte erneut.')
      beep.current && beep.current(240, 120)
      writeAudit({ts, user: user || '(leer)', action: 'login', result: 'failure', info: navigator.userAgent})
      setBusy(false)
      await simulateDelay(400)
      setPass('')
      userRef.current && userRef.current.focus()
      if (newFail >= 3) {
        setLockdown(true)
        setAlertMsg('ALARM: Mehrfache Zugriffsversuche registriert. Sicherheitszentrale aktiv. Das System meldet einen möglichen Eindringversuch. Alle Protokolle werden gesichert und jede weitere Eingabe wird mit Priorität geprüft.')
        setMessage('Sicherheitsprotokoll aktiv. Alarmton läuft.')
        if (alarmTimerRef.current) clearInterval(alarmTimerRef.current)
        alarmTimerRef.current = setInterval(() => {
          beep.current && beep.current(180, 180)
          beep.current && beep.current(260, 140)
        }, 420)
        toast.error('Sicherheitsalarm: Unbefugter Zugriff gemeldet!', { position: 'top-center', autoClose: 8000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: false })
      }
    }
  }

  return (
    <div className="login-overlay" role="dialog" aria-modal="true">
      <div className="terminal-login-box">
        <div className="terminal-header">
          <div className="terminal-title">WINDOWS 95</div>
          <div className="terminal-subtitle">Legacy-Zugangssteuerung</div>
          <div className="terminal-meta">
            <span>Session: {sessionId.current}</span> | <span>{format(now, 'dd.MM.yyyy HH:mm:ss')}</span>
          </div>
        </div>
        <div className="terminal-warning">
          <div className="terminal-warning-title">ZUGRIFF AUF VERTRAULICHE SYSTEME</div>
          <div className="terminal-warning-text">
            Jeder Zugriff wird im Protokoll verzeichnet und durch die Behördenzentrale geprüft.<br />
            Unbefugte Nutzung ist untersagt und wird dokumentiert.
          </div>
        </div>
        <div className="terminal-system-grid" aria-label="Systemdaten">
          <div className="terminal-info-card">
            <span className="terminal-info-label">Bereich</span>
            <strong>Archiv-Intern</strong>
          </div>
          <div className="terminal-info-card">
            <span className="terminal-info-label">Sicherheitsstufe</span>
            <strong>Stufe III</strong>
          </div>
          <div className="terminal-info-card">
            <span className="terminal-info-label">Terminal-ID</span>
            <strong>{sessionId.current.slice(0, 8).toUpperCase()}</strong>
          </div>
          <div className="terminal-info-card">
            <span className="terminal-info-label">Status</span>
            <strong>Legacy-Login / Offline</strong>
          </div>
        </div>
        {!lockdown ? (
          <form onSubmit={handleSubmit} className="terminal-login-form" style={{ alignItems: 'center' }}>
            <label htmlFor="login-username" style={{ width: '100%', textAlign: 'left', marginBottom: '8px' }}>Benutzername:
              <input
                id="login-username"
                ref={userRef}
                className="terminal-input"
                name="username"
                value={user}
                onChange={e => { setUser(e.target.value); void playKey() }}
                disabled={busy}
                autoComplete="username"
                style={{ width: '100%', marginTop: '4px' }}
              />
            </label>
            <label htmlFor="login-password" style={{ width: '100%', textAlign: 'left', marginBottom: '8px' }}>Passwort:
              <input
                id="login-password"
                type="password"
                className="terminal-input"
                name="password"
                value={pass}
                onChange={e => { setPass(e.target.value); void playKey() }}
                disabled={busy}
                autoComplete="current-password"
                style={{ width: '100%', marginTop: '4px' }}
              />
            </label>
            <button className="terminal-btn" type="submit" disabled={busy || !user || !pass} style={{ width: '100%', marginTop: '16px' }}>ANMELDEN</button>
          </form>
        ) : (
          <div className="terminal-lockdown">
            <div className="terminal-lockdown-title">SICHERHEITSALARM</div>
            <div className="terminal-lockdown-msg">{alertMsg}</div>
          </div>
        )}
        <div className="terminal-message">{message}</div>
        <div className="terminal-countdown">
          {lockdown ? "Zugang gesperrt" : `Sperre nach ${3 - failCount} Fehlversuchen`}
        </div>
      </div>
    </div>
  )
}