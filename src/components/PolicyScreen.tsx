import React from 'react'
import './LoginModal.css'

// ─── Erweitertes Audio-System ─────────────────────────────────────────────────
let _policyAudioCtx = null
function getPolicyAudioCtx() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    if (!_policyAudioCtx) _policyAudioCtx = new AC()
    if (_policyAudioCtx.state === 'suspended') _policyAudioCtx.resume().catch(() => {})
    return _policyAudioCtx
  } catch (e) { return null }
}

// Kurzer Klick-/Schreib-Sound (wie Drucker oder Terminal-Eingabe)
function playTypeSound(freq, vol) {
  try {
    const ctx = getPolicyAudioCtx(); if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq || 480
    gain.gain.value = 0.001
    osc.connect(gain); gain.connect(ctx.destination)
    const now = ctx.currentTime
    gain.gain.exponentialRampToValueAtTime(vol || 0.016, now + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055)
    osc.start(now); osc.stop(now + 0.08)
  } catch (e) {}
}

// Laufwerk-Zugriff: realistisches Klacken + Rauschen (wie HDD-Kopf)
function playDiskAccess() {
  try {
    const ctx = getPolicyAudioCtx(); if (!ctx) return
    const now = ctx.currentTime
    const pulseCount = 2 + Math.floor(Math.random() * 4) // 2-5 Pulse
    const pulseGap = 0.028 + Math.random() * 0.025

    for (let i = 0; i < pulseCount; i++) {
      const t = now + i * pulseGap
      // Mechanisches Klacken: kurzes Rauschen
      const bufSize = Math.floor(ctx.sampleRate * 0.018)
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let j = 0; j < bufSize; j++) data[j] = (Math.random() * 2 - 1)
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const noiseGain = ctx.createGain()
      noiseGain.gain.value = 0.001
      noise.connect(noiseGain); noiseGain.connect(ctx.destination)
      noiseGain.gain.exponentialRampToValueAtTime(0.018 + Math.random() * 0.008, t + 0.003)
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018)
      noise.start(t)
      // Dazu tiefer Klick-Ton
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = 120 + Math.random() * 60
      gain.gain.value = 0.001
      osc.connect(gain); gain.connect(ctx.destination)
      gain.gain.exponentialRampToValueAtTime(0.014, t + 0.002)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.012)
      osc.start(t); osc.stop(t + 0.02)
    }
  } catch (e) {}
}

// Netzwerk-Verbindungs-Sound: realistischer Modem/Ping-Sound
function playNetworkPing() {
  try {
    const ctx = getPolicyAudioCtx(); if (!ctx) return
    const now = ctx.currentTime
    // Kurzes Carrier-Signal (wie Modem-Handshake)
    const carrier = ctx.createOscillator()
    const carrierGain = ctx.createGain()
    carrier.type = 'sine'
    carrier.frequency.setValueAtTime(2100, now)
    carrier.frequency.setValueAtTime(1300, now + 0.06)
    carrier.frequency.setValueAtTime(2100, now + 0.12)
    carrierGain.gain.value = 0.001
    carrier.connect(carrierGain); carrierGain.connect(ctx.destination)
    carrierGain.gain.exponentialRampToValueAtTime(0.02, now + 0.01)
    carrierGain.gain.setValueAtTime(0.02, now + 0.13)
    carrierGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    carrier.start(now); carrier.stop(now + 0.22)
    // Zweiter Ton: Antwort-Signal
    const resp = ctx.createOscillator()
    const respGain = ctx.createGain()
    resp.type = 'sine'
    resp.frequency.setValueAtTime(1800, now + 0.25)
    resp.frequency.exponentialRampToValueAtTime(1200, now + 0.38)
    respGain.gain.value = 0.001
    resp.connect(respGain); respGain.connect(ctx.destination)
    respGain.gain.exponentialRampToValueAtTime(0.018, now + 0.27)
    respGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42)
    resp.start(now + 0.25); resp.stop(now + 0.46)
  } catch (e) {}
}

// Sicherheits-Check Sound: Scan-Ton + Bestätigung
function playSecurityCheck() {
  try {
    const ctx = getPolicyAudioCtx(); if (!ctx) return
    const now = ctx.currentTime
    // Scan-Ton: kurzer absteigender Sweep
    const scan = ctx.createOscillator()
    const scanGain = ctx.createGain()
    scan.type = 'sawtooth'
    scan.frequency.setValueAtTime(1400, now)
    scan.frequency.exponentialRampToValueAtTime(600, now + 0.08)
    scanGain.gain.value = 0.001
    scan.connect(scanGain); scanGain.connect(ctx.destination)
    scanGain.gain.exponentialRampToValueAtTime(0.016, now + 0.008)
    scanGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)
    scan.start(now); scan.stop(now + 0.1)
    // Bestätigungs-Beep: kurzer hoher Ton
    const confirm = ctx.createOscillator()
    const confirmGain = ctx.createGain()
    confirm.type = 'square'
    confirm.frequency.value = 1047
    confirmGain.gain.value = 0.001
    confirm.connect(confirmGain); confirmGain.connect(ctx.destination)
    confirmGain.gain.exponentialRampToValueAtTime(0.018, now + 0.14)
    confirmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
    confirm.start(now + 0.13); confirm.stop(now + 0.25)
  } catch (e) {}
}

// Profil-Laden Sound (sanftes Rauschen + Ton)
function playProfileLoad() {
  try {
    const ctx = getPolicyAudioCtx(); if (!ctx) return
    const now = ctx.currentTime
    // Weißes Rauschen kurz
    const bufSize = ctx.sampleRate * 0.08
    const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.001
    noise.connect(noiseGain); noiseGain.connect(ctx.destination)
    noiseGain.gain.exponentialRampToValueAtTime(0.012, now + 0.01)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)
    noise.start(now)
    // Dazu ein kurzer Ton
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = 520
    gain.gain.value = 0.001
    osc.connect(gain); gain.connect(ctx.destination)
    gain.gain.exponentialRampToValueAtTime(0.018, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09)
    osc.start(now); osc.stop(now + 0.12)
  } catch (e) {}
}

// Sitzungs-Initialisierung: kurzer aufsteigender Ton
function playSessionInit() {
  try {
    const ctx = getPolicyAudioCtx(); if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.linearRampToValueAtTime(660, now + 0.15)
    gain.gain.value = 0.001
    osc.connect(gain); gain.connect(ctx.destination)
    gain.gain.exponentialRampToValueAtTime(0.022, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    osc.start(now); osc.stop(now + 0.22)
  } catch (e) {}
}

// Windows XP Login-Sound: klassischer Akkord (C-E-G aufsteigend)
function playWindowsLoginSound() {
  try {
    const ctx = getPolicyAudioCtx(); if (!ctx) return
    const now = ctx.currentTime
    // Sanfter Akkord: C4, E4, G4, C5 – wie Windows XP Login
    const notes = [261.63, 329.63, 392.00, 523.25]
    const delays = [0, 0.08, 0.16, 0.28]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.value = 0.001
      osc.connect(gain); gain.connect(ctx.destination)
      const t = now + delays[i]
      gain.gain.exponentialRampToValueAtTime(0.06, t + 0.03)
      gain.gain.setValueAtTime(0.06, t + 0.35)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
      osc.start(t); osc.stop(t + 1.0)
    })
    // Zusätzlicher sanfter Hintergrund-Chord
    const chord = [523.25, 659.25, 783.99]
    chord.forEach((freq) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.value = 0.001
      osc.connect(gain); gain.connect(ctx.destination)
      const t = now + 0.3
      gain.gain.exponentialRampToValueAtTime(0.025, t + 0.05)
      gain.gain.setValueAtTime(0.025, t + 0.5)
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
      osc.start(t); osc.stop(t + 1.4)
    })
  } catch (e) {}
}

// Phasen-Wechsel Sound (kurzer Klick + Ton)
function playPhaseChange() {
  try {
    const ctx = getPolicyAudioCtx(); if (!ctx) return
    const now = ctx.currentTime
    // Klick
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'square'
    osc1.frequency.value = 320
    gain1.gain.value = 0.001
    osc1.connect(gain1); gain1.connect(ctx.destination)
    gain1.gain.exponentialRampToValueAtTime(0.03, now + 0.005)
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.04)
    osc1.start(now); osc1.stop(now + 0.06)
    // Ton
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'triangle'
    osc2.frequency.value = 560
    gain2.gain.value = 0.001
    osc2.connect(gain2); gain2.connect(ctx.destination)
    gain2.gain.exponentialRampToValueAtTime(0.025, now + 0.02)
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
    osc2.start(now + 0.02); osc2.stop(now + 0.16)
  } catch (e) {}
}

// ─── Schritt-Definitionen ─────────────────────────────────────────────────────
// soundType steuert welcher Sound gespielt wird
const ALL_STEPS = [
  // Phase 0: Gruppenrichtlinien
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: 'Bitte warten...', soundType: 'type' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: '', soundType: 'none' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: 'Benutzerkonfiguration wird geladen...', soundType: 'disk' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: 'Domänencontroller wird kontaktiert...  [ZR-BKA-01]', soundType: 'network' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: 'Netzlaufwerke werden verbunden...', soundType: 'disk' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: '  H:\\  →  \\\\192.168.1.5\\users$\\%USERNAME%  [OK]', soundType: 'type' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: 'Sicherheitsrichtlinien werden übernommen...', soundType: 'security' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: 'Anmelde-Skripte werden ausgeführt...', soundType: 'type' },
  // Phase 1: Systemkonfiguration
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: 'Drucker werden konfiguriert...', soundType: 'disk' },
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: 'Softwareverteilung wird geprüft...', soundType: 'network' },
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: '  [NETZWERKCLIENT v4.1]      – AKTUELL', soundType: 'type' },
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: '  [SICHERHEITSMODUL REV.7]  – AKTUELL', soundType: 'type' },
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: '  [NETZWERKTREIBER IPX/SPX]  – AKTUELL', soundType: 'type' },
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: 'Zertifikatsspeicher wird aktualisiert...', soundType: 'security' },
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: 'Lokale Sicherheitsrichtlinie wird angewendet...', soundType: 'security' },
  // Phase 2: Profil laden
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: 'Benutzerprofil wird synchronisiert...', soundType: 'profile' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: '  Quelle: \\\\192.168.1.5\\profiles$\\%USERNAME%', soundType: 'type' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: 'Startmenü wird konfiguriert...', soundType: 'disk' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: 'Desktop-Einstellungen werden übernommen...', soundType: 'disk' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: 'Zugriffsrechte werden geprüft...', soundType: 'security' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: '  DATEI-ZUGRIFF:     STUFE II – GEWÄHRT', soundType: 'type' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: '  NETZWERK-ZUGRIFF:  EINGESCHRÄNKT', soundType: 'type' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: '  DRUCKER-ZUGRIFF:   LOKAL ONLY', soundType: 'type' },
  // Phase 3: Sitzung initialisieren
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: 'Sitzungs-ID wird registriert...', soundType: 'session' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: 'Audit-Protokoll wird gestartet...', soundType: 'disk' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: 'Verbindung zum Zentralrechner...', soundType: 'network' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: '  STATUS: HERGESTELLT  [192.168.1.1]', soundType: 'security' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: '', soundType: 'none' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: 'Anmeldung erfolgreich.', soundType: 'none' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: 'Sitzung wird geöffnet...', soundType: 'none' },
]

const STEP_DELAY = 520 // ms zwischen jeder Zeile
const TOTAL_PHASES = 4

// ─── Class Component ──────────────────────────────────────────────────────────
class PolicyScreen extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      stepIdx: -1,
      lines: [],
      currentPhase: 0,
      currentPhaseTitle: ALL_STEPS[0].phaseTitle,
      loginSoundPlayed: false,
    }
    this.timer = null
    this.loginSoundTimer = null
  }

  componentDidMount() {
    this.timer = window.setTimeout(() => this.advance(), 700)
  }

  componentWillUnmount() {
    if (this.timer) window.clearTimeout(this.timer)
    if (this.loginSoundTimer) window.clearTimeout(this.loginSoundTimer)
    this.timer = null
    this.loginSoundTimer = null
  }

  playStepSound(soundType, lineIdx) {
    switch (soundType) {
      case 'disk':
        playDiskAccess()
        break
      case 'network':
        playNetworkPing()
        break
      case 'security':
        playSecurityCheck()
        break
      case 'profile':
        playProfileLoad()
        break
      case 'session':
        playSessionInit()
        break
      case 'type':
        // Leicht variierte Frequenz je nach Position
        playTypeSound(440 + (lineIdx % 7) * 30, 0.014 + (lineIdx % 3) * 0.003)
        break
      case 'none':
      default:
        break
    }
  }

  advance() {
    const nextIdx = this.state.stepIdx + 1

    if (nextIdx >= ALL_STEPS.length) {
      // Login-Sound spielen wenn alle Schritte fertig
      if (!this.state.loginSoundPlayed) {
        this.setState({ loginSoundPlayed: true })
        playWindowsLoginSound()
      }
      // 1800ms warten (damit Login-Sound ausklingt) dann Desktop
      this.timer = window.setTimeout(() => {
        if (this.props.onDone) this.props.onDone()
      }, 1800)
      return
    }

    const step = ALL_STEPS[nextIdx]
    const isNewPhase = nextIdx === 0 || step.phase !== ALL_STEPS[nextIdx - 1].phase

    if (isNewPhase && nextIdx > 0) {
      playPhaseChange()
    }

    this.setState(prev => ({
      stepIdx: nextIdx,
      currentPhase: step.phase,
      currentPhaseTitle: step.phaseTitle,
      lines: isNewPhase ? [step.line] : [...prev.lines, step.line],
    }), () => {
      // Sound nach State-Update spielen
      if (!isNewPhase || nextIdx === 0) {
        this.playStepSound(step.soundType, nextIdx)
      }
    })

    this.timer = window.setTimeout(() => this.advance(), STEP_DELAY + Math.random() * 120)
  }

  render() {
    const { stepIdx, lines, currentPhase, currentPhaseTitle } = this.state
    const totalSteps = ALL_STEPS.length
    const progress = stepIdx < 0 ? 0 : Math.round(((stepIdx + 1) / totalSteps) * 100)

    return (
      <div className="retro-screen retro-policy-screen">
        <div className="crt-overlay" />
        <div className="policy-container">
          <div className="policy-logo-row">
            <span className="policy-logo-char">■</span>
            <span className="policy-logo-text">ZENTRALRECHNER  –  SYSTEMANMELDUNG</span>
            <span className="policy-logo-char">■</span>
          </div>
          <div className="policy-step-box">
            <div className="policy-step-title">{currentPhaseTitle}</div>
            <div className="policy-step-lines">
              {lines.map((line, i) => (
                <div
                  key={i}
                  className={'policy-step-line' + (line === '' ? ' policy-empty-line' : '')}
                >
                  {line || '\u00a0'}
                </div>
              ))}
              <span className="crt-cursor">_</span>
            </div>
            <div className="policy-progress-bar-wrap">
              <div className="policy-progress-bar-fill" style={{ width: progress + '%' }} />
            </div>
            <div className="policy-progress-label">{progress}%</div>
          </div>
          <div className="policy-step-counter">
            SCHRITT {currentPhase + 1} VON {TOTAL_PHASES}
          </div>
          <div className="policy-footer-note">
            Bitte warten. Computer nicht ausschalten oder neu starten.
          </div>
        </div>
      </div>
    )
  }
}

export default PolicyScreen
