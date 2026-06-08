import React, { useEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import localforage from 'localforage'
import { useUserProfile } from '../hooks/useUserProfile'
import './LoginModal.css'

const VALID_CREDENTIALS = [
  { user: 'demo', pass: 'demo' },
  { user: 'test', pass: 'test' },
  { user: 'admin', pass: 'admin' },
]

function isValidCredential(user, pass) {
  return VALID_CREDENTIALS.some(e => e.user === user && e.pass === pass)
}

let _audioCtx = null
function getAudioCtx() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!_audioCtx) _audioCtx = new AC()
  if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(() => {})
  return _audioCtx
}

function playTone(freq, durationMs, type, volume) {
  type = type || 'square'
  volume = volume || 0.08
  const ctx = getAudioCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.value = 0.001
  osc.connect(gain)
  gain.connect(ctx.destination)
  const now = ctx.currentTime
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
  osc.start(now)
  osc.stop(now + durationMs / 1000 + 0.02)
}

function playKeyClick() {
  playTone(1100, 40, 'square', 0.04)
}

function playErrorBeep() {
  playTone(220, 180, 'sawtooth', 0.10)
  setTimeout(function() { playTone(180, 220, 'sawtooth', 0.10) }, 200)
}

function playAlarmCycle() {
  playTone(880, 120, 'sawtooth', 0.18)
  setTimeout(function() { playTone(660, 120, 'sawtooth', 0.18) }, 130)
  setTimeout(function() { playTone(880, 120, 'sawtooth', 0.18) }, 260)
  setTimeout(function() { playTone(440, 200, 'square', 0.22) }, 390)
  setTimeout(function() { playTone(330, 180, 'sawtooth', 0.20) }, 600)
}

const BOOT_LINES = [
  'BUNDESARCHIV-TERMINAL  v2.3.1  (C) 1987 SIEMENS AG',
  'BIOS-PRÜFUNG.............. OK',
  'SPEICHER: 640K BASIS / 384K ERWEITERT',
  'FESTPLATTE C: GEFUNDEN  [ST-225  20MB]',
  'NETZWERKADAPTER: NE2000  IRQ=3  I/O=300H',
  'LADEN: SICHERHEITSMODUL REV.7 ............ OK',
  'VERBINDUNG: BUNDESRECHENZENTRUM BONN',
  'VERSCHLÜSSELUNG: DES-56  AKTIV',
  '────────────────────────────────────────────────',
  'ANMELDEPROTOKOLL AKTIV  –  ALLE ZUGRIFFE WERDEN ERFASST',
]

const ALARM_MESSAGES = [
  '>>> SICHERHEITSALARM <<<',
  'UNBEFUGTER ZUGRIFFSVERSUCH REGISTRIERT',
  'STANDORT WIRD ERMITTELT...',
  'VERBINDUNG ZU SICHERHEITSZENTRALE...',
  'BEHÖRDE WIRD BENACHRICHTIGT',
  'ALLE EINGABEN WERDEN AUFGEZEICHNET',
  '>>> SYSTEM GESPERRT <<<',
  'EINHEIT ALPHA – BITTE REAGIEREN',
  'ZUGRIFF VERWEIGERT – STUFE ROT',
  'RÜCKVERFOLGUNG AKTIV...',
]

export default function LoginModal({ onSuccess }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failCount, setFailCount] = useState(0)
  const [lockdown, setLockdown] = useState(false)
  const [bootDone, setBootDone] = useState(false)
  const [bootLines, setBootLines] = useState([])
  const [now, setNow] = useState(new Date())
  const [glitch, setGlitch] = useState(false)
  const [alarmPhase, setAlarmPhase] = useState(0)
  const [alarmText, setAlarmText] = useState('')
  const [traceWidth, setTraceWidth] = useState(0)

  const sessionId = useRef(uuidv4())
  const userRef = useRef(null)
  const alarmIntervalRef = useRef(null)
  const alarmTextIntervalRef = useRef(null)
  const traceIntervalRef = useRef(null)
  const { setLoginUser } = useUserProfile()

  useEffect(function() {
    const t = setInterval(function() { setNow(new Date()) }, 1000)
    return function() { clearInterval(t) }
  }, [])

  useEffect(function() {
    let cancelled = false
    let i = 0
    function addLine() {
      if (cancelled || i >= BOOT_LINES.length) {
        if (!cancelled) {
          setTimeout(function() {
            setBootDone(true)
            setTimeout(function() {
              if (userRef.current) userRef.current.focus()
            }, 200)
          }, 400)
        }
        return
      }
      setBootLines(function(prev) { return prev.concat([BOOT_LINES[i]]) })
      playTone(600 + i * 40, 30, 'square', 0.03)
      i++
      setTimeout(addLine, 120 + Math.random() * 180)
    }
    setTimeout(addLine, 300)
    return function() { cancelled = true }
  }, [])

  useEffect(function() {
    return function() {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current)
      if (alarmTextIntervalRef.current) clearInterval(alarmTextIntervalRef.current)
      if (traceIntervalRef.current) clearInterval(traceIntervalRef.current)
    }
  }, [])

  useEffect(function() {
    if (!bootDone) return
    const t = setInterval(function() {
      if (Math.random() < 0.08) {
        setGlitch(true)
        setTimeout(function() { setGlitch(false) }, 80 + Math.random() * 120)
      }
    }, 2000)
    return function() { clearInterval(t) }
  }, [bootDone])

  function simulateDelay(ms) {
    return new Promise(function(r) { setTimeout(r, ms) })
  }

  async function writeAudit(entry) {
    try {
      const key = 'audit_log_v1'
      const cur = (await localforage.getItem(key)) || []
      cur.push(entry)
      await localforage.setItem(key, cur)
    } catch (e) {}
  }

  function startAlarm() {
    setAlarmPhase(1)
    playAlarmCycle()
    alarmIntervalRef.current = setInterval(function() {
      playAlarmCycle()
    }, 900)

    let msgIdx = 0
    setAlarmText(ALARM_MESSAGES[0])
    alarmTextIntervalRef.current = setInterval(function() {
      msgIdx = (msgIdx + 1) % ALARM_MESSAGES.length
      setAlarmText(ALARM_MESSAGES[msgIdx])
    }, 1200)

    setTraceWidth(0)
    traceIntervalRef.current = setInterval(function() {
      setTraceWidth(function(w) { return w >= 100 ? 0 : w + 1 })
    }, 80)

    setTimeout(function() { setAlarmPhase(2) }, 3000)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy || lockdown) return
    getAudioCtx()
    setBusy(true)
    setMessage('VERBINDUNG WIRD HERGESTELLT...')
    await simulateDelay(600 + Math.random() * 800)
    setMessage('AUTHENTIFIZIERUNG LÄUFT')
    for (let i = 0; i < 3; i++) {
      await simulateDelay(300 + Math.random() * 200)
      setMessage(function(prev) { return prev + '.' })
      playTone(500, 50, 'square', 0.03)
    }
    await simulateDelay(400 + Math.random() * 600)
    const ts = new Date().toISOString()
    const valid = isValidCredential(user, pass)

    if (valid) {
      setMessage('ZUGANG GEWÄHRT')
      playTone(880, 80, 'square', 0.06)
      setTimeout(function() { playTone(1100, 120, 'square', 0.06) }, 90)
      if (setLoginUser) {
        await setLoginUser({ username: user, loginTime: ts, sessionId: sessionId.current, isLoggedIn: true })
      }
      await writeAudit({ ts, user, action: 'login', result: 'success', info: navigator.userAgent })
      await simulateDelay(900)
      onSuccess && onSuccess()
      setFailCount(0)
    } else {
      const newFail = failCount + 1
      setFailCount(newFail)
      playErrorBeep()
      await writeAudit({ ts, user: user || '(leer)', action: 'login', result: 'failure', info: navigator.userAgent })
      if (newFail >= 3) {
        setLockdown(true)
        setMessage('')
        startAlarm()
      } else {
        setMessage('FEHLER: UNGÜLTIGE ZUGANGSDATEN  [VERSUCH ' + newFail + '/3]')
        setBusy(false)
        await simulateDelay(400)
        setPass('')
        if (userRef.current) userRef.current.focus()
      }
    }
  }

  if (!bootDone) {
    return (
      <div className="retro-screen">
        <div className="crt-overlay" />
        <div className="retro-boot">
          {bootLines.map(function(line, i) {
            return <div key={i} className="retro-boot-line">{line}</div>
          })}
          {bootLines.length < BOOT_LINES.length && <span className="crt-cursor">█</span>}
        </div>
      </div>
    )
  }

  if (lockdown) {
    return (
      <div className={'retro-screen retro-alarm-screen ' + (alarmPhase === 2 ? 'alarm-critical' : 'alarm-warning')}>
        <div className="crt-overlay" />
        <div className="alarm-container">
          <div className="alarm-header-bar">
            <span className="alarm-blink">▐▌</span>
            <span className="alarm-title-text">SICHERHEITSALARM</span>
            <span className="alarm-blink">▌▐</span>
          </div>
          <div className="alarm-box">
            <div className="alarm-box-border">╔══════════════════════════════════════╗</div>
            <div className="alarm-box-row">║  ZUGANG VERWEIGERT – STUFE ROT        ║</div>
            <div className="alarm-box-row">║  TERMINAL: {sessionId.current.slice(0,10).toUpperCase()}{'  '}║</div>
            <div className="alarm-box-row">║  {format(now, 'dd.MM.yyyy HH:mm:ss')}{'                  '}║</div>
            <div className="alarm-box-border">╠══════════════════════════════════════╣</div>
            <div className="alarm-box-row alarm-msg-row">║  <span className="alarm-scroll-text">{alarmText}</span>  ║</div>
            <div className="alarm-box-border">╚══════════════════════════════════════╝</div>
          </div>
          <div className="alarm-warning-lines">
            <div className="alarm-warn-line">! DREI FEHLGESCHLAGENE ANMELDEVERSUCHE !</div>
            <div className="alarm-warn-line">! PROTOKOLL WIRD AN BEHÖRDE ÜBERMITTELT !</div>
            <div className="alarm-warn-line alarm-blink">! DIESES TERMINAL WURDE GESPERRT !</div>
          </div>
          <div className="alarm-trace">
            <div className="alarm-trace-label">RÜCKVERFOLGUNG AKTIV...</div>
            <div className="alarm-trace-bar">
              <div className="alarm-trace-fill" style={{ width: traceWidth + '%' }} />
            </div>
            <div className="alarm-blink">STANDORT WIRD ÜBERMITTELT</div>
          </div>
          <div className="alarm-beep-row">
            {[0,1,2,3,4,5,6,7].map(function(i) {
              return <span key={i} className="alarm-beep-dot" style={{ animationDelay: (i * 0.11) + 's' }}>◆</span>
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={'retro-screen' + (glitch ? ' retro-glitch' : '')}>
      <div className="crt-overlay" />
      <div className="retro-statusbar">
        <span>BUNDESARCHIV-TERMINAL v2.3.1</span>
        <span className="retro-clock">{format(now, 'dd.MM.yyyy  HH:mm:ss')}</span>
      </div>
      <div className="retro-login-panel">
        <div className="retro-ascii-header">
          <div className="retro-ascii-art">
            {'  ██████╗  ██████╗ ██╗   ██╗'}<br/>
            {' ██╔════╝ ██╔═══██╗██║   ██║'}<br/>
            {' ██║  ███╗██║   ██║██║   ██║'}<br/>
            {' ██║   ██║██║   ██║╚██╗ ██╔╝'}<br/>
            {' ╚██████╔╝╚██████╔╝ ╚████╔╝ '}<br/>
            {'  ╚═════╝  ╚═════╝   ╚═══╝  '}
          </div>
          <div className="retro-subtitle">BUNDESARCHIV  –  ZUGANGSSTEUERUNG</div>
          <div className="retro-subtitle-small">VERTRAULICH  •  INTERN  •  NICHT FÜR DIE ÖFFENTLICHKEIT</div>
        </div>
        <div className="retro-divider">{'─'.repeat(44)}</div>
        <div className="retro-info-grid">
          <div className="retro-info-row">
            <span className="retro-info-key">SYSTEM&nbsp;&nbsp;&nbsp;&nbsp;:</span>
            <span className="retro-info-val">BUNDESRECHENZENTRUM BONN  [OFFLINE]</span>
          </div>
          <div className="retro-info-row">
            <span className="retro-info-key">TERMINAL&nbsp;&nbsp;:</span>
            <span className="retro-info-val">{sessionId.current.slice(0, 12).toUpperCase()}</span>
          </div>
          <div className="retro-info-row">
            <span className="retro-info-key">SICHERHEIT:</span>
            <span className="retro-info-val">STUFE III  –  DES-56  VERSCHLÜSSELT</span>
          </div>
          <div className="retro-info-row">
            <span className="retro-info-key">STATUS&nbsp;&nbsp;&nbsp;&nbsp;:</span>
            <span className="retro-info-val retro-blink-slow">BEREIT – WARTE AUF EINGABE</span>
          </div>
        </div>
        <div className="retro-divider">{'─'.repeat(44)}</div>
        <div className="retro-notice">
          <div>! WARNUNG: UNBEFUGTER ZUGRIFF IST STRAFBAR !</div>
          <div>! ALLE AKTIVITÄTEN WERDEN PROTOKOLLIERT&nbsp;&nbsp;&nbsp;&nbsp;!</div>
        </div>
        <div className="retro-divider">{'─'.repeat(44)}</div>
        <form onSubmit={handleSubmit} className="retro-form">
          <div className="retro-field">
            <label className="retro-label" htmlFor="r-user">BENUTZER&nbsp;&nbsp;:</label>
            <input
              id="r-user"
              ref={userRef}
              className="retro-input"
              value={user}
              onChange={function(e) { setUser(e.target.value); playKeyClick() }}
              disabled={busy}
              autoComplete="username"
              spellCheck={false}
            />
          </div>
          <div className="retro-field">
            <label className="retro-label" htmlFor="r-pass">KENNWORT&nbsp;&nbsp;:</label>
            <input
              id="r-pass"
              type="password"
              className="retro-input"
              value={pass}
              onChange={function(e) { setPass(e.target.value); playKeyClick() }}
              disabled={busy}
              autoComplete="current-password"
              spellCheck={false}
            />
          </div>
          <div className="retro-divider" style={{ marginTop: '12px' }}>{'─'.repeat(44)}</div>
          <button className="retro-submit-btn" type="submit" disabled={busy || !user || !pass}>
            {busy ? '[ BITTE WARTEN... ]' : '[ ANMELDEN ]'}
          </button>
        </form>
        {message ? (
          <div className="retro-message-line">
            <span>&gt;&gt; </span>{message}<span className="crt-cursor">█</span>
          </div>
        ) : null}
        <div className="retro-attempt-info">
          {failCount > 0
            ? 'FEHLVERSUCHE: ' + failCount + '/3  –  BEI 3 VERSUCHEN: SPERRUNG'
            : 'ANMELDEVERSUCHE VERBLEIBEND: ' + (3 - failCount)
          }
        </div>
        <div className="retro-divider" style={{ marginTop: '8px' }}>{'─'.repeat(44)}</div>
        <div className="retro-footer">
          <div>SIEMENS NIXDORF  •  BUNDESARCHIV-SYSTEM  •  1987</div>
          <div>SUPPORT: BONN 0228-99-0  •  NOTFALL: 110</div>
        </div>
      </div>
      <div className="retro-bottombar">
        <span>F1=HILFE</span>
        <span>F5=NEUSTART</span>
        <span>ESC=ABBRUCH</span>
        <span className="retro-blink-slow">■ ONLINE</span>
      </div>
    </div>
  )
}
