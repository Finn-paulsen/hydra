import React from 'react'
import './LoginModal.css'

// ─── Audio ────────────────────────────────────────────────────────────────────
function playBeep(freq) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = freq || 440
    gain.gain.value = 0.001
    osc.connect(gain)
    gain.connect(ctx.destination)
    const now = ctx.currentTime
    gain.gain.exponentialRampToValueAtTime(0.018, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06)
    osc.start(now)
    osc.stop(now + 0.1)
  } catch (e) {}
}

// ─── All steps flat ───────────────────────────────────────────────────────────
const ALL_STEPS = [
  // Phase 0
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: 'Bitte warten...' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: '' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: 'Benutzerkonfiguration wird geladen...' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: 'Netzlaufwerke werden verbunden...' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: 'Sicherheitsrichtlinien werden übernommen...' },
  { phase: 0, phaseTitle: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET', line: 'Anmelde-Skripte werden ausgeführt...' },
  // Phase 1
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: 'Drucker werden konfiguriert...' },
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: 'Softwareverteilung wird geprüft...' },
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: '  [BUNDESARCHIV-CLIENT v4.1] – AKTUELL' },
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: '  [SICHERHEITSMODUL REV.7]  – AKTUELL' },
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: '  [NETZWERKTREIBER IPX/SPX]  – AKTUELL' },
  { phase: 1, phaseTitle: 'SYSTEMKONFIGURATION', line: 'Zertifikatsspeicher wird aktualisiert...' },
  // Phase 2
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: 'Benutzerprofil wird synchronisiert...' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: 'Startmenü wird konfiguriert...' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: 'Desktop-Einstellungen werden übernommen...' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: 'Zugriffsrechte werden geprüft...' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: '  ARCHIV-ZUGRIFF:    STUFE II – GEWÄHRT' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: '  NETZWERK-ZUGRIFF:  EINGESCHRÄNKT' },
  { phase: 2, phaseTitle: 'PROFIL WIRD GELADEN', line: '  DRUCKER-ZUGRIFF:   LOKAL ONLY' },
  // Phase 3
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: 'Sitzungs-ID wird registriert...' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: 'Audit-Protokoll wird gestartet...' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: 'Verbindung zu Bundesrechenzentrum...' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: '  STATUS: HERGESTELLT  [192.168.47.1]' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: '' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: 'Anmeldung erfolgreich.' },
  { phase: 3, phaseTitle: 'SITZUNG WIRD INITIALISIERT', line: 'Willkommen im BUNDESARCHIV-SYSTEM.' },
]
const STEP_DELAY = 550 // ms zwischen jeder Zeile
const TOTAL_PHASES = 4

// ─── Class Component (kein useEffect-Problem) ─────────────────────────────────
class PolicyScreen extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      stepIdx: -1,   // -1 = noch nicht gestartet
      lines: [],
      currentPhase: 0,
      currentPhaseTitle: ALL_STEPS[0].phaseTitle,
    }
    this.timer = null
    this.started = false
  }

  componentDidMount() {
    // 700ms nach Mount starten – React hat dann sicher gerendert
    this.timer = window.setTimeout(() => this.advance(), 700)
  }

  componentWillUnmount() {
    if (this.timer) window.clearTimeout(this.timer)
    this.timer = null
  }

  advance() {
    const nextIdx = this.state.stepIdx + 1

    if (nextIdx >= ALL_STEPS.length) {
      // Sequenz fertig – 800ms warten dann Desktop
      this.timer = window.setTimeout(() => {
        if (this.props.onDone) this.props.onDone()
      }, 800)
      return
    }

    const step = ALL_STEPS[nextIdx]
    const isNewPhase = nextIdx === 0 || step.phase !== ALL_STEPS[nextIdx - 1].phase

    this.setState(prev => ({
      stepIdx: nextIdx,
      currentPhase: step.phase,
      currentPhaseTitle: step.phaseTitle,
      // Bei neuer Phase: Zeilen zurücksetzen
      lines: isNewPhase ? [step.line] : [...prev.lines, step.line],
    }))

    playBeep(440 + (nextIdx % 8) * 40)

    this.timer = window.setTimeout(() => this.advance(), STEP_DELAY)
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
            <span className="policy-logo-text">BUNDESARCHIV-SYSTEM</span>
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
