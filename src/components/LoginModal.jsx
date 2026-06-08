import React, { useEffect, useRef, useState, useCallback } from 'react'
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

// ─── Audio Engine ────────────────────────────────────────────────────────────
let _audioCtx = null
function getAudioCtx() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!_audioCtx) _audioCtx = new AC()
  if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(() => {})
  return _audioCtx
}

function playTone(freq, durationMs, type, volume, startDelay) {
  type = type || 'square'
  volume = volume || 0.06
  startDelay = startDelay || 0
  const ctx = getAudioCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.value = 0.001
  osc.connect(gain)
  gain.connect(ctx.destination)
  const now = ctx.currentTime + startDelay
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
  osc.start(now)
  osc.stop(now + durationMs / 1000 + 0.02)
}

function playKeyClick() {
  playTone(900, 28, 'square', 0.025)
}

function playErrorBeep() {
  playTone(280, 160, 'sawtooth', 0.09)
  setTimeout(() => playTone(220, 200, 'sawtooth', 0.09), 180)
}

// Bedrohlicher Alarm – tiefe, langsame Sirene
function playAlarmCycle() {
  const ctx = getAudioCtx()
  if (!ctx) return
  // Tiefe Sirene: langsam von 220 auf 440 und zurück
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sawtooth'
  osc.frequency.value = 220
  gain.gain.value = 0.001
  osc.connect(gain)
  gain.connect(ctx.destination)
  const now = ctx.currentTime
  gain.gain.exponentialRampToValueAtTime(0.15, now + 0.05)
  osc.frequency.exponentialRampToValueAtTime(380, now + 0.6)
  osc.frequency.exponentialRampToValueAtTime(220, now + 1.2)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3)
  osc.start(now)
  osc.stop(now + 1.35)

  // Zweiter Ton – kurzer harter Beep
  playTone(660, 80, 'square', 0.12, 0.1)
  playTone(440, 80, 'square', 0.10, 0.25)
}

function playSuccessChime() {
  playTone(523, 80, 'sine', 0.06)
  setTimeout(() => playTone(659, 80, 'sine', 0.06), 90)
  setTimeout(() => playTone(784, 120, 'sine', 0.07), 180)
}

function playPolicyBeep() {
  playTone(440, 60, 'square', 0.04)
}

// ─── Zufällige Verbindungsfehler ─────────────────────────────────────────────
const CONNECTION_ERRORS = [
  { code: 'ERR_TIMEOUT_7F', msg: 'VERBINDUNGS-TIMEOUT – BUNDESRECHENZENTRUM NICHT ERREICHBAR' },
  { code: 'ERR_PROTO_MISMATCH', msg: 'PROTOKOLL-INKOMPATIBILITÄT: X.25 v2.1 ERWARTET, v1.4 EMPFANGEN' },
  { code: 'ERR_CERT_EXPIRED', msg: 'SICHERHEITSZERTIFIKAT ABGELAUFEN (SEIT 14.03.1999)' },
  { code: 'ERR_MODEM_BUSY', msg: 'MODEM-VERBINDUNG BELEGT – LEITUNG 0228-99-4412 BESETZT' },
  { code: 'ERR_CHECKSUM', msg: 'PRÜFSUMMEN-FEHLER IM DATENPAKET – ÜBERTRAGUNG UNTERBROCHEN' },
  { code: 'ERR_NODE_DOWN', msg: 'NETZWERKKNOTEN BONN-WEST NICHT VERFÜGBAR [SEIT 2003]' },
  { code: 'ERR_AUTH_SRV', msg: 'AUTHENTIFIZIERUNGSSERVER ANTWORTET NICHT (PING: ---ms)' },
  { code: 'ERR_LEGACY_HANDSHAKE', msg: 'VERALTETES HANDSHAKE-PROTOKOLL – UPGRADE ERFORDERLICH' },
  { code: 'ERR_BUFFER_OVERFLOW', msg: 'PUFFERÜBERLAUF IN SICHERHEITSMODUL REV.7 – NEUSTART EMPFOHLEN' },
  { code: 'ERR_CLOCK_SKEW', msg: 'SYSTEMZEIT-ABWEICHUNG ZU GROSS – KERBEROS-AUTHENTIFIZIERUNG FEHLGESCHLAGEN' },
]

function getRandomConnectionError() {
  return CONNECTION_ERRORS[Math.floor(Math.random() * CONNECTION_ERRORS.length)]
}

// Wahrscheinlichkeit für zufälligen Verbindungsfehler (auch bei richtigen Daten)
function shouldRandomFail() {
  return Math.random() < 0.35
}

// ─── Boot-Sequenz ────────────────────────────────────────────────────────────
const BOOT_LINES = [
  'BUNDESARCHIV-TERMINAL  v2.3.1  (C) 1987 SIEMENS NIXDORF AG',
  'BIOS-PRÜFUNG ........................... OK',
  'SPEICHER: 640K BASIS / 384K ERWEITERT  [EMS: DEAKTIVIERT]',
  'FESTPLATTE C:  ST-225  20MB  CHS=615/4/17',
  'NETZWERKADAPTER: NE2000  IRQ=3  I/O=0x300',
  'CO-PROZESSOR: NICHT VORHANDEN',
  'LADEN: SICHERHEITSMODUL REV.7 .......... OK',
  'LADEN: NETZWERKTREIBER NOVELL IPX ....... OK',
  'VERBINDUNGSAUFBAU: BUNDESRECHENZENTRUM BONN',
  'VERSCHLÜSSELUNG: DES-56  INITIALISIERT',
  '─────────────────────────────────────────────────────────',
  'ZUGRIFFS-PROTOKOLL AKTIV  –  ALLE SITZUNGEN WERDEN ERFASST',
]

// ─── Alarm-Meldungen ─────────────────────────────────────────────────────────
const ALARM_MESSAGES_ROTATING = [
  'UNBEFUGTER ZUGRIFFSVERSUCH PROTOKOLLIERT',
  'SICHERHEITSSTUFE ROT – SYSTEM GESPERRT',
  'VERBINDUNG ZU BEHÖRDE WIRD AUFGEBAUT...',
  'DATENTRÄGER-SICHERUNG LÄUFT',
  'BENUTZER-KENNUNG WIRD ÜBERMITTELT',
  'ALLE EINGABEN AUFGEZEICHNET UND GESPEICHERT',
  'EINHEIT ALPHA BENACHRICHTIGT',
  'TERMINAL-SPERRUNG AKTIV',
  'PROTOKOLL AN DATENSCHUTZBEHÖRDE WEITERGELEITET',
  'NETZWERKVERBINDUNG WIRD ISOLIERT',
  'FESTPLATTE WIRD GESICHERT – BITTE NICHT AUSSCHALTEN',
  'STANDORT-ERMITTLUNG ÜBER LEITUNGSKENNUNG AKTIV',
]

// ─── Fake CMD-Fenster Inhalte ─────────────────────────────────────────────────
const CMD_WINDOWS = [
  {
    title: 'C:\\WINDOWS\\SYSTEM32\\CMD.EXE',
    lines: [
      'Microsoft(R) Windows NT(TM)',
      'Copyright (C) 1993-1999 Microsoft Corp.',
      '',
      'C:\\> NETSTAT -AN',
      '',
      'Aktive Verbindungen',
      '',
      '  Proto  Lokale Adresse    Remoteadresse      Status',
      '  TCP    0.0.0.0:139       0.0.0.0:0          ABHÖREN',
      '  TCP    0.0.0.0:445       0.0.0.0:0          ABHÖREN',
      '  TCP    127.0.0.1:1024    TERMINAL-LOKAL     HERGESTELLT',
      '  TCP    192.168.1.47:1337 85.214.132.117:443 HERGESTELLT',
      '',
      'C:\\> TRACERT 85.214.132.117',
      '',
      'Routenverfolgung zu BUND-SICHERHEIT-SRV01',
      '  1    <1ms   <1ms   <1ms  192.168.1.1',
      '  2    12ms   11ms   13ms  10.0.0.1',
      '  3    28ms   27ms   29ms  85.214.132.117',
      '',
      'Ablaufverfolgung abgeschlossen.',
    ]
  },
  {
    title: 'SICHERHEITSPROTOKOLL – EREIGNISANZEIGE',
    lines: [
      'Ereignisanzeige – Sicherheitsprotokoll',
      '══════════════════════════════════════',
      '',
      'EREIGNIS-ID: 529  FEHLER-ANMELDUNG',
      'Datum:  ' + new Date().toLocaleDateString('de-DE'),
      'Zeit:   ' + new Date().toLocaleTimeString('de-DE'),
      'Benutzer: UNBEKANNT',
      'Computer: TERMINAL-85BF5DF2',
      '',
      'Beschreibung:',
      'Anmeldefehler: Unbekannter Benutzername',
      'oder falsches Kennwort.',
      '',
      'Anmeldetyp: 3 (Netzwerk)',
      'Anmeldevorgang: NtLmSsp',
      'Authentifizierungspaket: NTLM',
      'Arbeitsstationsname: TERMINAL-85BF5DF2',
      '',
      'EREIGNIS-ID: 530  KONTO GESPERRT',
      'Maximale Anmeldeversuche überschritten.',
      'Konto wird für 24 Stunden gesperrt.',
    ]
  },
  {
    title: 'NETZ-ANALYSE – BUNDESRECHENZENTRUM',
    lines: [
      'C:\\TOOLS> IPCONFIG /ALL',
      '',
      'Windows NT IP-Konfiguration',
      '',
      '  Hostname: TERMINAL-85BF5DF2',
      '  DNS-Suffix: bundesarchiv.intern',
      '  Knotentyp: Hybrid',
      '',
      'Ethernet-Adapter:',
      '  Beschreibung: NE2000 Compatible',
      '  Physikalische Adresse: 00-A0-C9-47-B2-F1',
      '  DHCP aktiviert: Nein',
      '  IP-Adresse: 192.168.47.83',
      '  Subnetzmaske: 255.255.255.0',
      '  Standardgateway: 192.168.47.1',
      '',
      'C:\\TOOLS> PING SICHERHEIT-SRV01',
      '',
      'Ping wird ausgeführt für SICHERHEIT-SRV01',
      'Antwort von 192.168.47.1: Bytes=32 Zeit=1ms',
      '',
      'VERBINDUNG ZU SICHERHEITSZENTRALE AKTIV.',
    ]
  }
]

// ─── Group Policy / Post-Login Dialoge ───────────────────────────────────────
const POLICY_STEPS = [
  {
    title: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET',
    lines: [
      'Bitte warten...',
      '',
      'Benutzerkonfiguration wird geladen...',
      'Netzlaufwerke werden verbunden...',
      'Sicherheitsrichtlinien werden übernommen...',
      'Anmelde-Skripte werden ausgeführt...',
    ],
    duration: 3200,
  },
  {
    title: 'SYSTEMKONFIGURATION',
    lines: [
      'Drucker werden konfiguriert...',
      'Softwareverteilung wird geprüft...',
      '  [BUNDESARCHIV-CLIENT v4.1] – AKTUELL',
      '  [SICHERHEITSMODUL REV.7]  – AKTUELL',
      '  [NETZWERKTREIBER IPX/SPX]  – AKTUELL',
      'Zertifikatsspeicher wird aktualisiert...',
    ],
    duration: 2800,
  },
  {
    title: 'PROFIL WIRD GELADEN',
    lines: [
      'Benutzerprofil wird synchronisiert...',
      'Startmenü wird konfiguriert...',
      'Desktop-Einstellungen werden übernommen...',
      'Zugriffsrechte werden geprüft...',
      '  ARCHIV-ZUGRIFF:    STUFE II – GEWÄHRT',
      '  NETZWERK-ZUGRIFF:  EINGESCHRÄNKT',
      '  DRUCKER-ZUGRIFF:   LOKAL ONLY',
    ],
    duration: 2500,
  },
  {
    title: 'SITZUNG WIRD INITIALISIERT',
    lines: [
      'Sitzungs-ID wird registriert...',
      'Audit-Protokoll wird gestartet...',
      'Verbindung zu Bundesrechenzentrum...',
      '  STATUS: HERGESTELLT  [192.168.47.1]',
      '',
      'Anmeldung erfolgreich.',
      'Willkommen im BUNDESARCHIV-SYSTEM.',
    ],
    duration: 2000,
  },
]

// ─── Image Build Meldungen ────────────────────────────────────────────────────
const IMAGE_BUILD_LINES = [
  'SYSTEMABBILD WIRD ERSTELLT...',
  'Festplatteninhalt wird erfasst...',
  'Partitionstabelle wird gelesen...',
  'Sektor 0 – 2048: OK',
  'Sektor 2048 – 8192: OK',
  'Komprimierung: LZW  [Faktor: 2.3:1]',
  'Prüfsumme: MD5 wird berechnet...',
  'Abbild-Datei: C:\\BACKUP\\IMG_' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '.IMG',
  'Größe: 847 MB  [komprimiert: 367 MB]',
  'Abbild erfolgreich erstellt.',
]

export default function LoginModal({ onSuccess, policyOnly = false }) {
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
  const [cmdWindows, setCmdWindows] = useState([])
  const [activeCmdWindow, setActiveCmdWindow] = useState(0)
  const [cmdLineIdx, setCmdLineIdx] = useState(0)
  const [showImageBuild, setShowImageBuild] = useState(false)
  const [imageBuildLines, setImageBuildLines] = useState([])
  const [policyPhase, setPolicyPhase] = useState(-1) // -1 = nicht aktiv, 0-3 = aktiv, 99 = fertig
  const [policyLines, setPolicyLines] = useState([])
  const [policyProgress, setPolicyProgress] = useState(0)
  const [randomFailMsg, setRandomFailMsg] = useState(null)
  const [policyStarted, setPolicyStarted] = useState(false)

  const sessionId = useRef(uuidv4())
  const userRef = useRef(null)
  const alarmIntervalRef = useRef(null)
  const alarmTextIntervalRef = useRef(null)
  const cmdLineIntervalRef = useRef(null)
  const policyTimerRef = useRef(null)
  const { setLoginUser } = useUserProfile()

  // Uhr
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Boot-Sequenz (nur wenn nicht policyOnly)
  useEffect(() => {
    if (policyOnly) {
      // Policy-Screen direkt anzeigen, Sequenz nach 500ms starten
      setBootDone(true)
      setPolicyPhase(0)
      // 500ms warten damit React den Policy-Screen rendert, dann Sequenz starten
      const tid = setTimeout(() => {
        setPolicyStarted(true)
      }, 500)
      return () => clearTimeout(tid)
    }
    let cancelled = false
    let i = 0
    function addLine() {
      if (cancelled || i >= BOOT_LINES.length) {
        if (!cancelled) {
          setTimeout(() => {
            setBootDone(true)
            setTimeout(() => { if (userRef.current) userRef.current.focus() }, 200)
          }, 500)
        }
        return
      }
      setBootLines(prev => [...prev, BOOT_LINES[i]])
      playTone(500 + i * 30, 25, 'square', 0.02)
      i++
      setTimeout(addLine, 100 + Math.random() * 160)
    }
    setTimeout(addLine, 400)
    return () => { cancelled = true }
  }, [policyOnly])

  // Cleanup
  useEffect(() => {
    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current)
      if (alarmTextIntervalRef.current) clearInterval(alarmTextIntervalRef.current)
      if (cmdLineIntervalRef.current) clearInterval(cmdLineIntervalRef.current)
      if (policyTimerRef.current) clearTimeout(policyTimerRef.current)
    }
  }, [])

  // Gelegentliche Glitch-Effekte
  useEffect(() => {
    if (!bootDone) return
    const t = setInterval(() => {
      if (Math.random() < 0.06) {
        setGlitch(true)
        setTimeout(() => setGlitch(false), 60 + Math.random() * 100)
      }
    }, 3000)
    return () => clearInterval(t)
  }, [bootDone])

  function simulateDelay(ms) {
    return new Promise(r => setTimeout(r, ms))
  }

  async function writeAudit(entry) {
    try {
      const key = 'audit_log_v1'
      const cur = (await localforage.getItem(key)) || []
      cur.push(entry)
      await localforage.setItem(key, cur)
    } catch (e) {}
  }

  // ─── Alarm starten ──────────────────────────────────────────────────────────
  function startAlarm() {
    setAlarmPhase(1)
    playAlarmCycle()
    alarmIntervalRef.current = setInterval(() => {
      playAlarmCycle()
    }, 1400)

    let msgIdx = 0
    setAlarmText(ALARM_MESSAGES_ROTATING[0])
    alarmTextIntervalRef.current = setInterval(() => {
      msgIdx = (msgIdx + 1) % ALARM_MESSAGES_ROTATING.length
      setAlarmText(ALARM_MESSAGES_ROTATING[msgIdx])
    }, 1800)

    // CMD-Fenster nach 2 Sekunden öffnen
    setTimeout(() => {
      const shuffled = [...CMD_WINDOWS].sort(() => Math.random() - 0.5)
      setCmdWindows(shuffled)
      setActiveCmdWindow(0)
      setCmdLineIdx(0)
      setAlarmPhase(2)

      // Image Build nach 4 Sekunden
      setTimeout(() => {
        setShowImageBuild(true)
        let lineIdx = 0
        const interval = setInterval(() => {
          if (lineIdx >= IMAGE_BUILD_LINES.length) {
            clearInterval(interval)
            return
          }
          setImageBuildLines(prev => [...prev, IMAGE_BUILD_LINES[lineIdx]])
          lineIdx++
        }, 400)
      }, 4000)
    }, 2000)

    // CMD-Fenster wechseln
    let cmdIdx = 0
    const cmdSwitchInterval = setInterval(() => {
      cmdIdx = (cmdIdx + 1) % CMD_WINDOWS.length
      setActiveCmdWindow(cmdIdx)
      setCmdLineIdx(0)
    }, 6000)

    setTimeout(() => clearInterval(cmdSwitchInterval), 60000)
  }

  // ─── Group Policy Sequenz ────────────────────────────────────────────────────
  // useEffect startet die Sequenz sobald policyStarted=true gesetzt wird
  useEffect(() => {
    if (!policyStarted) return
    let cancelled = false
    let timeoutId = null
    // 300ms warten damit React den Policy-Screen zuerst malt
    timeoutId = setTimeout(async () => {
      if (cancelled) return
      for (let i = 0; i < POLICY_STEPS.length; i++) {
        if (cancelled) return
        setPolicyPhase(i)
        setPolicyLines([])
        setPolicyProgress(0)
        playPolicyBeep()
        await simulateDelay(300)
        const step = POLICY_STEPS[i]
        for (let j = 0; j < step.lines.length; j++) {
          if (cancelled) return
          await simulateDelay(step.duration / step.lines.length)
          setPolicyLines(prev => [...prev, step.lines[j]])
          setPolicyProgress(Math.round(((j + 1) / step.lines.length) * 100))
          if (step.lines[j] && !step.lines[j].startsWith(' ') && step.lines[j] !== '') {
            playTone(440 + j * 20, 30, 'square', 0.02)
          }
        }
        await simulateDelay(600)
      }
      if (!cancelled) {
        await simulateDelay(800)
        onSuccess && onSuccess()
      }
    }, 300)
    return () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId) }
  }, [policyStarted])

  // ─── Login Handler ───────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (busy || lockdown) return
    getAudioCtx()
    setBusy(true)
    setRandomFailMsg(null)

    // Verbindungsaufbau simulieren
    setMessage('VERBINDUNGSAUFBAU...')
    await simulateDelay(400 + Math.random() * 500)

    // Zufällige Verbindungsstörung (auch bei richtigen Daten)
    if (shouldRandomFail()) {
      const err = getRandomConnectionError()
      setMessage('FEHLER [' + err.code + ']')
      playErrorBeep()
      await simulateDelay(300)
      setRandomFailMsg(err.msg)
      await simulateDelay(2000 + Math.random() * 1500)
      setMessage('ERNEUTER VERBINDUNGSVERSUCH...')
      await simulateDelay(800 + Math.random() * 600)
    }

    setMessage('AUTHENTIFIZIERUNG LÄUFT')
    for (let i = 0; i < 4; i++) {
      await simulateDelay(250 + Math.random() * 200)
      setMessage(prev => prev + '.')
      playTone(480, 40, 'square', 0.02)
    }
    await simulateDelay(300 + Math.random() * 400)

    const ts = new Date().toISOString()
    const valid = isValidCredential(user, pass)

    if (valid) {
      setMessage('ZUGANGSDATEN VERIFIZIERT')
      playSuccessChime()
      if (setLoginUser) {
        await setLoginUser({ username: user, loginTime: ts, sessionId: sessionId.current, isLoggedIn: true })
      }
      await writeAudit({ ts, user, action: 'login', result: 'success', info: navigator.userAgent })
      await simulateDelay(800)
      setMessage('')
      setBusy(false)
      // onSuccess() wechselt in App.jsx zur 'policy'-Phase
      // Die neue LoginModal-Instanz mit policyOnly=true startet dann automatisch die Policy-Sequenz
      onSuccess && onSuccess()
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
        setMessage('FEHLER: ZUGANGSDATEN UNGÜLTIG  [VERSUCH ' + newFail + '/3]')
        setBusy(false)
        await simulateDelay(500)
        setPass('')
        setRandomFailMsg(null)
        if (userRef.current) userRef.current.focus()
      }
    }
  }

  // ─── BOOT SCREEN ─────────────────────────────────────────────────────────────
  if (!bootDone) {
    return (
      <div className="retro-screen">
        <div className="crt-overlay" />
        <div className="retro-boot">
          {bootLines.map((line, i) => (
            <div key={i} className="retro-boot-line">{line}</div>
          ))}
          {bootLines.length < BOOT_LINES.length && <span className="crt-cursor">_</span>}
        </div>
      </div>
    )
  }

  // ─── GROUP POLICY SCREEN ──────────────────────────────────────────────────────
  if (policyPhase >= 0) {
    const step = POLICY_STEPS[Math.min(policyPhase, POLICY_STEPS.length - 1)]
    return (
      <div className="retro-screen retro-policy-screen">
        <div className="crt-overlay" />
        <div className="policy-container">
          <div className="policy-logo-row">
            <span className="policy-logo-char">■</span>
            <span className="policy-logo-text">BUNDESARCHIV-SYSTEM</span>
            <span className="policy-logo-char">■</span>
          </div>
          <div className="policy-step-box">
            <div className="policy-step-title">{step.title}</div>
            <div className="policy-step-lines">
              {policyLines.map((line, i) => (
                <div key={i} className={'policy-step-line' + (line === '' ? ' policy-empty-line' : '')}>
                  {line || '\u00a0'}
                </div>
              ))}
              <span className="crt-cursor">_</span>
            </div>
            <div className="policy-progress-bar-wrap">
              <div className="policy-progress-bar-fill" style={{ width: policyProgress + '%' }} />
            </div>
            <div className="policy-progress-label">{policyProgress}%</div>
          </div>
          <div className="policy-step-counter">
            SCHRITT {policyPhase + 1} VON {POLICY_STEPS.length}
          </div>
          <div className="policy-footer-note">
            Bitte warten. Computer nicht ausschalten oder neu starten.
          </div>
        </div>
      </div>
    )
  }

  // ─── ALARM / LOCKDOWN SCREEN ──────────────────────────────────────────────────
  if (lockdown) {
    const activeCmdData = cmdWindows[activeCmdWindow] || CMD_WINDOWS[0]
    return (
      <div className={'retro-screen retro-alarm-screen' + (alarmPhase >= 2 ? ' alarm-phase2' : '')}>
        <div className="crt-overlay" />

        {/* Alarm-Header */}
        <div className="alarm-topbar">
          <span className="alarm-topbar-blink">▌</span>
          <span className="alarm-topbar-title">SICHERHEITSALARM – ZUGANG VERWEIGERT</span>
          <span className="alarm-topbar-blink">▌</span>
        </div>

        <div className="alarm-body">
          {/* Linke Spalte: Status */}
          <div className="alarm-left-col">
            <div className="alarm-status-box">
              <div className="alarm-status-row alarm-blink-slow">
                ▐ TERMINAL GESPERRT ▌
              </div>
              <div className="alarm-status-divider">{'─'.repeat(28)}</div>
              <div className="alarm-status-row">
                <span className="alarm-key">TERMINAL :</span>
                <span className="alarm-val">{sessionId.current.slice(0, 10).toUpperCase()}</span>
              </div>
              <div className="alarm-status-row">
                <span className="alarm-key">ZEIT&nbsp;&nbsp;&nbsp;&nbsp; :</span>
                <span className="alarm-val">{format(now, 'HH:mm:ss')}</span>
              </div>
              <div className="alarm-status-row">
                <span className="alarm-key">STUFE&nbsp;&nbsp;&nbsp; :</span>
                <span className="alarm-val alarm-blink">ROT</span>
              </div>
              <div className="alarm-status-divider">{'─'.repeat(28)}</div>
              <div className="alarm-rotating-msg">{alarmText}</div>
              <div className="alarm-status-divider">{'─'.repeat(28)}</div>
              <div className="alarm-warn-list">
                <div className="alarm-warn-item alarm-blink-slow">! DATENTRÄGER WIRD GESICHERT !</div>
                <div className="alarm-warn-item">! IP-ADRESSE WIRD PROTOKOLLIERT !</div>
                <div className="alarm-warn-item alarm-blink-slow">! BEHÖRDE WIRD BENACHRICHTIGT !</div>
                <div className="alarm-warn-item">! VERBINDUNG WIRD AUFGEZEICHNET !</div>
              </div>
            </div>

            {/* Image Build */}
            {showImageBuild && (
              <div className="alarm-imagebuild-box">
                <div className="alarm-imagebuild-title">SYSTEMABBILD-ERSTELLUNG</div>
                {imageBuildLines.map((line, i) => (
                  <div key={i} className="alarm-imagebuild-line">{line}</div>
                ))}
                {imageBuildLines.length < IMAGE_BUILD_LINES.length && (
                  <span className="crt-cursor">_</span>
                )}
              </div>
            )}
          </div>

          {/* Rechte Spalte: Fake CMD-Fenster */}
          {alarmPhase >= 2 && cmdWindows.length > 0 && (
            <div className="alarm-cmd-col">
              <div className="alarm-cmd-window">
                <div className="alarm-cmd-titlebar">
                  <span className="alarm-cmd-titlebar-btn">■</span>
                  <span className="alarm-cmd-titlebar-text">{activeCmdData.title}</span>
                  <span className="alarm-cmd-titlebar-btn">×</span>
                </div>
                <div className="alarm-cmd-body">
                  {activeCmdData.lines.map((line, i) => (
                    <div key={i} className="alarm-cmd-line">{line || '\u00a0'}</div>
                  ))}
                  <span className="crt-cursor">_</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Unterer Statusbalken */}
        <div className="alarm-bottombar">
          <span className="alarm-blink">■ SICHERHEITSPROTOKOLL AKTIV</span>
          <span>{format(now, 'dd.MM.yyyy HH:mm:ss')}</span>
          <span className="alarm-blink">■ ÜBERTRAGUNG LÄUFT</span>
        </div>
      </div>
    )
  }

  // ─── NORMALER LOGIN SCREEN ────────────────────────────────────────────────────
  return (
    <div className={'retro-screen' + (glitch ? ' retro-glitch' : '')}>
      <div className="crt-overlay" />
      <div className="retro-statusbar">
        <span>BUNDESARCHIV-TERMINAL  v2.3.1</span>
        <span className="retro-clock">{format(now, 'dd.MM.yyyy  HH:mm:ss')}</span>
      </div>

      <div className="retro-login-panel">
        {/* Header */}
        <div className="retro-ascii-header">
          <div className="retro-ascii-art">
{'  ██████╗  ██████╗ ██╗   ██╗'}{'\n'}
{' ██╔════╝ ██╔═══██╗██║   ██║'}{'\n'}
{' ██║  ███╗██║   ██║██║   ██║'}{'\n'}
{' ██║   ██║██║   ██║╚██╗ ██╔╝'}{'\n'}
{' ╚██████╔╝╚██████╔╝ ╚████╔╝ '}{'\n'}
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
              onChange={e => { setUser(e.target.value); playKeyClick() }}
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
              onChange={e => { setPass(e.target.value); playKeyClick() }}
              disabled={busy}
              autoComplete="current-password"
              spellCheck={false}
            />
          </div>
          <div className="retro-divider" style={{ marginTop: '10px' }}>{'─'.repeat(44)}</div>
          <button className="retro-submit-btn" type="submit" disabled={busy || !user || !pass}>
            {busy ? '[ BITTE WARTEN... ]' : '[ ANMELDEN ]'}
          </button>
        </form>

        {message && (
          <div className="retro-message-line">
            <span>&gt;&gt; </span>{message}<span className="crt-cursor">_</span>
          </div>
        )}

        {randomFailMsg && (
          <div className="retro-random-fail">
            <div className="retro-random-fail-title">VERBINDUNGSFEHLER:</div>
            <div className="retro-random-fail-msg">{randomFailMsg}</div>
            <div className="retro-random-fail-retry">Erneuter Verbindungsversuch läuft...</div>
          </div>
        )}

        <div className="retro-attempt-info">
          {failCount > 0
            ? 'FEHLVERSUCHE: ' + failCount + '/3  –  BEI 3 VERSUCHEN: SPERRUNG'
            : 'ANMELDEVERSUCHE VERBLEIBEND: ' + (3 - failCount)
          }
        </div>

        <div className="retro-divider" style={{ marginTop: '6px' }}>{'─'.repeat(44)}</div>

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
