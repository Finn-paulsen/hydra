import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { format } from 'date-fns'
import localforage from 'localforage'
import { useUserProfile } from '../hooks/useUserProfile'
import './LoginModal.css'

// Benutzer mit Rollen und Zugriffsrechten
const VALID_CREDENTIALS = [
  { user: 'demo',  pass: 'demo',  role: 'user',  permissions: ['read'],                          displayName: 'Demo-Benutzer',  clearance: 'STUFE I'   },
  { user: 'test',  pass: 'test',  role: 'user',  permissions: ['read', 'write'],                  displayName: 'Test-Benutzer',  clearance: 'STUFE II'  },
  { user: 'admin', pass: 'admin', role: 'admin', permissions: ['read', 'write', 'delete', 'manage'], displayName: 'Administrator', clearance: 'STUFE IV'  },
]

function isValidCredential(u, p) {
  return VALID_CREDENTIALS.some(e => e.user === u && e.pass === p)
}

function getCredential(u, p) {
  return VALID_CREDENTIALS.find(e => e.user === u && e.pass === p) || null
}

// ─── Audio Engine ─────────────────────────────────────────────────────────────
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
  type = type || 'square'; volume = volume || 0.06; startDelay = startDelay || 0
  const ctx = getAudioCtx(); if (!ctx) return
  const osc = ctx.createOscillator(); const gain = ctx.createGain()
  osc.type = type; osc.frequency.value = freq; gain.gain.value = 0.001
  osc.connect(gain); gain.connect(ctx.destination)
  const now = ctx.currentTime + startDelay
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000)
  osc.start(now); osc.stop(now + durationMs / 1000 + 0.02)
}

function playKeyClick() { playTone(820, 22, 'square', 0.018) }

function playErrorBeep() {
  playTone(260, 180, 'sawtooth', 0.08)
  setTimeout(() => playTone(200, 220, 'sawtooth', 0.08), 200)
}

// Alarm-Sound: echter Behörden-Alarm-Ton – wie ein alter Feuermelder
// Zwei-Ton-Wechsel (Yelp-Pattern), tief und bedrohlich
function playAlarmCycle() {
  const ctx = getAudioCtx(); if (!ctx) return
  const now = ctx.currentTime

  // Ton A: 770 Hz, 0.5s
  const oscA = ctx.createOscillator(); const gainA = ctx.createGain()
  oscA.type = 'sawtooth'; oscA.frequency.value = 770
  gainA.gain.value = 0.001
  oscA.connect(gainA); gainA.connect(ctx.destination)
  gainA.gain.exponentialRampToValueAtTime(0.22, now + 0.015)
  gainA.gain.setValueAtTime(0.22, now + 0.48)
  gainA.gain.exponentialRampToValueAtTime(0.0001, now + 0.52)
  oscA.start(now); oscA.stop(now + 0.55)

  // Ton B: 640 Hz, 0.5s – nach 0.55s
  const oscB = ctx.createOscillator(); const gainB = ctx.createGain()
  oscB.type = 'sawtooth'; oscB.frequency.value = 640
  gainB.gain.value = 0.001
  oscB.connect(gainB); gainB.connect(ctx.destination)
  gainB.gain.exponentialRampToValueAtTime(0.22, now + 0.565)
  gainB.gain.setValueAtTime(0.22, now + 1.03)
  gainB.gain.exponentialRampToValueAtTime(0.0001, now + 1.07)
  oscB.start(now + 0.55); oscB.stop(now + 1.1)

  // Tiefer Brummton als Unterlage
  const drone = ctx.createOscillator(); const droneGain = ctx.createGain()
  drone.type = 'triangle'; drone.frequency.value = 80
  droneGain.gain.value = 0.001
  drone.connect(droneGain); droneGain.connect(ctx.destination)
  droneGain.gain.exponentialRampToValueAtTime(0.06, now + 0.05)
  droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.05)
  drone.start(now); drone.stop(now + 1.1)
}

function playSuccessChime() {
  playTone(440, 60, 'sine', 0.05)
  setTimeout(() => playTone(550, 60, 'sine', 0.05), 80)
  setTimeout(() => playTone(660, 100, 'sine', 0.06), 160)
}

function playPolicyBeep() { playTone(400, 50, 'square', 0.03) }

// ─── Echte PC-Ressourcen via Browser-APIs ─────────────────────────────────────
async function detectHardware() {
  const lines = []

  // CPU-Kerne
  const cores = navigator.hardwareConcurrency || 1
  // Wir zeigen das als "Prozessor-Einheiten" – reale Zahl
  const cpuModel = cores <= 2 ? 'Intel 486DX2/66  [64-BIT ERWEITERUNG: AKTIV]' : cores <= 4 ? 'Intel Pentium 133 MHz  [64-BIT]' : 'Intel Pentium II 266 MHz  [64-BIT]'
  lines.push({ text: 'PROZESSOR: ' + cpuModel, delay: 2800 })
  lines.push({ text: 'PROZESSOR-KERNE: ' + cores + '  MODUS: PROTECTED  BUS: ISA/PCI', delay: 2200 })

  // RAM – navigator.deviceMemory (in GB, gerundet)
  const ramGB = navigator.deviceMemory || 0.5
  const ramMB = Math.round(ramGB * 1024)
  const ramDisplay = ramMB >= 1024 ? Math.round(ramMB / 1024) + ' GB' : ramMB + ' MB'
  lines.push({ text: 'SPEICHERTEST: ' + ramDisplay + ' GESAMT...', delay: 3200 })
  lines.push({ text: 'KONVENTIONELL: 640K  ERWEITERT (EMS): ' + (ramMB - 1) + ' MB  FREI: ' + Math.round(ramMB * 0.87) + ' MB', delay: 2600 })

  // Verbindungstyp
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  let netType = 'UNBEKANNT'
  let netSpeed = '---'
  if (conn) {
    netType = conn.effectiveType ? conn.effectiveType.toUpperCase() : 'LAN'
    netSpeed = conn.downlink ? Math.round(conn.downlink) + ' Mbit/s' : '---'
  }
  lines.push({ text: 'NETZWERK-ADAPTER: WIRD ERKANNT...', delay: 2800 })
  lines.push({ text: 'ADAPTER: 3COM ETHERLINK III  IRQ=10  I/O=0x300  DMA=3', delay: 2400 })
  lines.push({ text: 'VERBINDUNGSTYP: ' + netType + '  GESCHWINDIGKEIT: ' + netSpeed, delay: 1800 })

  // Bildschirmauflösung
  const sw = window.screen.width; const sh = window.screen.height
  const cd = window.screen.colorDepth || 8
  lines.push({ text: 'GRAFIKKARTE: CIRRUS LOGIC GD5428  VRAM: 1 MB', delay: 2200 })
  lines.push({ text: 'AUFLÖSUNG: ' + sw + 'x' + sh + '  FARBTIEFE: ' + cd + ' BIT  REFRESH: 60 Hz', delay: 1600 })

  // Sprache / Zeitzone
  const lang = navigator.language || 'DE'
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin'
  lines.push({ text: 'REGION: ' + lang.toUpperCase() + '  ZEITZONE: ' + tz + '  CODEPAGE: 850', delay: 1800 })

  // Plattform
  const platform = navigator.platform || 'Win32'
  lines.push({ text: 'BETRIEBSSYSTEM: ' + platform.toUpperCase() + '  [WINDOWS NT 4.0 SP6a]', delay: 2000 })
  lines.push({ text: 'SICHERHEITSSTUFE: HOCH  AUDIT: AKTIV  PROTOKOLL: AKTIVIERT', delay: 1600 })

  return lines
}

// ─── Boot-Sequenz Zeilen ──────────────────────────────────────────────────────
// Statische Zeilen kommen zuerst, dann dynamische Hardware-Erkennung
const BOOT_LINES_STATIC_PRE = [
  { text: '', delay: 400 },
  { text: 'SIEMENS NIXDORF PCD-4H  BIOS v2.07  (C) 1994', delay: 800 },
  { text: 'COPYRIGHT (C) SIEMENS NIXDORF INFORMATIONSSYSTEME AG, 1987-1994', delay: 1200 },
  { text: '', delay: 600 },
  { text: 'BIOS-DATUM: 14.03.1994  SERIENNUMMER: SN-4H-0038471', delay: 1800 },
  { text: '', delay: 400 },
  { text: 'SPEICHERTEST LÄUFT', delay: 3600 },
  { text: 'BIOS-ERWEITERUNG: SCSI-CONTROLLER  IRQ=11  I/O=0x330  OK', delay: 2400 },
  { text: 'BIOS-ERWEITERUNG: VGA-BIOS  CIRRUS LOGIC  v1.62  OK', delay: 1800 },
  { text: '', delay: 500 },
  { text: 'FESTPLATTEN-CONTROLLER: IDE  IRQ=14  I/O=0x1F0', delay: 2200 },
  { text: 'FESTPLATTE 0:  SEAGATE ST-31200N  1.2 GB  [CHS=2484/16/63]  OK', delay: 3400 },
  { text: 'FESTPLATTE 1:  NICHT VORHANDEN', delay: 1200 },
  { text: 'CD-ROM-LAUFWERK:  NEC CDR-260  [ATAPI]  OK', delay: 1800 },
  { text: '', delay: 400 },
  { text: 'HARDWARE-ERKENNUNG LÄUFT...', delay: 2400 },
]

const BOOT_LINES_STATIC_POST = [
  { text: 'NETZWERKADAPTER: 3COM ETHERLINK III  IRQ=10  I/O=0x300  DMA=3', delay: 2800 },
  { text: 'MAC-ADRESSE: WIRD GELESEN...', delay: 2200 },
  { text: 'PROTOKOLL-STACK: TCP/IP v3.11  IPX/SPX v2.0  NETBIOS  GELADEN', delay: 2600 },
  { text: 'SICHERHEITSMODUL: REV.7  SIGNATURPRÜFUNG...', delay: 3200 },
  { text: 'SICHERHEITSMODUL: SIGNATUR OK  INITIALISIERT', delay: 2000 },
  { text: 'VERSCHLÜSSELUNG: DES-56  SCHLÜSSELAUSTAUSCH...', delay: 2800 },
  { text: 'VERSCHLÜSSELUNG: AKTIV  SITZUNGSSCHLÜSSEL GENERIERT', delay: 2200 },
  { text: '──────────────────────────────────────────────────────', delay: 800 },
  { text: 'VERBINDUNGSAUFBAU ZUM ZENTRALRECHNER...', delay: 3600 },
  { text: 'ROUTE: 192.168.1.1  HOP: 1  LATENZ: 847ms', delay: 2800 },
  { text: 'AUTHENTIFIZIERUNGSSERVER: 192.168.1.1  ANTWORTET', delay: 2400 },
  { text: 'SITZUNGSPROTOKOLL AKTIV  –  ALLE ZUGRIFFE WERDEN ERFASST', delay: 1800 },
  { text: '──────────────────────────────────────────────────────', delay: 600 },
]

// ─── Verbindungsfehler ────────────────────────────────────────────────────────
const CONNECTION_ERRORS = [
  { code: 'ERR_TIMEOUT_7F',      msg: 'VERBINDUNGS-TIMEOUT – ZENTRALRECHNER NICHT ERREICHBAR' },
  { code: 'ERR_PROTO_MISMATCH',  msg: 'PROTOKOLL-INKOMPATIBILITÄT: X.25 v2.1 ERWARTET, v1.4 EMPFANGEN' },
  { code: 'ERR_CERT_EXPIRED',    msg: 'SICHERHEITSZERTIFIKAT ABGELAUFEN (SEIT 14.03.1999)' },
  { code: 'ERR_MODEM_BUSY',      msg: 'LEITUNG BELEGT – WÄHLANSCHLUSS 0228-99-4412 BESETZT' },
  { code: 'ERR_CHECKSUM',        msg: 'PRÜFSUMMEN-FEHLER IM DATENPAKET – ÜBERTRAGUNG UNTERBROCHEN' },
  { code: 'ERR_NODE_DOWN',       msg: 'NETZWERKKNOTEN NICHT VERFÜGBAR [LETZTE MELDUNG: 12.06.2003]' },
  { code: 'ERR_AUTH_SRV',        msg: 'AUTHENTIFIZIERUNGSSERVER ANTWORTET NICHT' },
  { code: 'ERR_LEGACY_HANDSHAKE',msg: 'VERALTETES HANDSHAKE-PROTOKOLL – UPDATE ERFORDERLICH' },
  { code: 'ERR_BUFFER_OVERFLOW', msg: 'PUFFERÜBERLAUF IN SICHERHEITSMODUL REV.7' },
  { code: 'ERR_CLOCK_SKEW',      msg: 'SYSTEMZEIT-ABWEICHUNG ZU GROSS – KERBEROS FEHLGESCHLAGEN' },
  { code: 'ERR_SESS_LIMIT',      msg: 'MAXIMALE SITZUNGSANZAHL ERREICHT – BITTE SPÄTER VERSUCHEN' },
  { code: 'ERR_ROUTE_FAIL',      msg: 'KEINE ROUTE ZUM ZIELHOST – NETZWERK NICHT ERREICHBAR' },
]

function shouldRandomFail() { return Math.random() < 0.35 }
function getRandomConnectionError() {
  return CONNECTION_ERRORS[Math.floor(Math.random() * CONNECTION_ERRORS.length)]
}

// ─── Alarm-Meldungen (realistisch, keine Hacker-Klischees) ────────────────────
const ALARM_MESSAGES = [
  'ZUGRIFFSVERSUCH PROTOKOLLIERT',
  'VERBINDUNG ZU PROTOKOLLSERVER AKTIV',
  'KENNUNG WIRD ÜBERMITTELT',
  'ALLE EINGABEN AUFGEZEICHNET',
  'SITZUNG WIRD GESICHERT',
  'TERMINAL GESPERRT',
  'PROTOKOLLEINTRAG WIRD ERSTELLT',
  'VERBINDUNGSDATEN WERDEN GESPEICHERT',
  'LEITUNGSKENNUNG WIRD ERMITTELT',
  'ZUSTÄNDIGE STELLE WIRD BENACHRICHTIGT',
]

// ─── Alarm-Sequenz: Linke Meldungen + synchrone CMD-Befehle ─────────────────
// Jede Phase hat eine linke Meldung und passende CMD-Ausgabe rechts
function buildAlarmSequence(sessionId) {
  const ip = '192.168.' + (Math.floor(Math.random() * 5) + 1) + '.' + (Math.floor(Math.random() * 200) + 10)
  const mac = Array.from({length: 6}, () => Math.floor(Math.random()*256).toString(16).padStart(2,'0').toUpperCase()).join('-')
  const ts = new Date()
  const dateStr = ts.toLocaleDateString('de-DE')
  const timeStr = ts.toLocaleTimeString('de-DE')
  const termId = sessionId.slice(0,8).toUpperCase()
  const gateway = '192.168.1.1'

  return [
    {
      leftMsg: 'VERBINDUNGSDATEN WERDEN PROTOKOLLIERT',
      cmdTitle: 'C:\\WINNT\\SYSTEM32\\CMD.EXE',
      cmdLines: [
        'Microsoft Windows NT [Version 4.0.1381]',
        '(C) Copyright 1985-1996 Microsoft Corp.',
        '',
        'C:\\> netstat -an',
        '',
        'Aktive Verbindungen',
        '',
        '  Proto  Lok. Adresse          Rem. Adresse         Status',
        '  TCP    0.0.0.0:135           0.0.0.0:0            ABHÖREN',
        '  TCP    0.0.0.0:139           0.0.0.0:0            ABHÖREN',
        '  TCP    0.0.0.0:445           0.0.0.0:0            ABHÖREN',
        '  TCP    ' + ip + ':1024  ' + gateway + ':443      HERGESTELLT',
        '  TCP    ' + ip + ':1025  ' + gateway + ':139      HERGESTELLT',
        '  UDP    0.0.0.0:137           *:*',
        '  UDP    0.0.0.0:138           *:*',
        '',
        'C:\\> _',
      ]
    },
    {
      leftMsg: 'LEITUNGSKENNUNG WIRD ERMITTELT',
      cmdTitle: 'C:\\WINNT\\SYSTEM32\\CMD.EXE',
      cmdLines: [
        'C:\\> ipconfig /all',
        '',
        'Windows NT IP-Konfiguration',
        '',
        '   Hostname . . . . . : TERMINAL-' + termId,
        '   Primäres DNS-Suffix:',
        '   Knotentyp  . . . . : Hybrid',
        '   IP-Routing aktiviert: Nein',
        '   WINS-Proxy aktiviert: Nein',
        '',
        'Ethernet-Adapter "LAN-Verbindung":',
        '',
        '   Beschreibung . . . : 3Com EtherLink III',
        '   Physikalische Adr. : ' + mac,
        '   DHCP aktiviert . . : Nein',
        '   IP-Adresse . . . . : ' + ip,
        '   Subnetzmaske . . . : 255.255.255.0',
        '   Standardgateway  . : ' + gateway,
        '   DNS-Server . . . . : ' + gateway,
        '',
        'C:\\> _',
      ]
    },
    {
      leftMsg: 'DATENTRÄGER WIRD GESICHERT',
      cmdTitle: 'Ereignisanzeige – Sicherheitsprotokoll',
      cmdLines: [
        'Ereignisanzeige  [TERMINAL-' + termId + ']',
        'Protokoll: Sicherheit',
        '─────────────────────────────────────────',
        '',
        'Ereignis-ID : 529  [Anmeldefehler]',
        'Typ         : Fehlerüberwachung',
        'Datum       : ' + dateStr,
        'Uhrzeit     : ' + timeStr,
        'Benutzer    : NT AUTHORITY\\SYSTEM',
        'Computer    : TERMINAL-' + termId,
        '',
        'Beschreibung:',
        '  Anmeldefehler – Unbekannter Benutzername',
        '  oder falsches Kennwort.',
        '  Anmeldetyp  : 3 (Netzwerk)',
        '  Prozess     : NtLmSsp',
        '  Paket       : NTLM',
        '',
        'Ereignis-ID : 539  [Konto gesperrt]',
        '  Kontosperrungsschwelle überschritten.',
        '  Konto gesperrt für: 1440 Minuten.',
        '',
        '─────────────────────────────────────────',
      ]
    },
    {
      leftMsg: 'ZUSTÄNDIGE STELLE WIRD INFORMIERT',
      cmdTitle: 'C:\\WINNT\\SYSTEM32\\CMD.EXE',
      cmdLines: [
        'C:\\> net send ' + gateway + ' SICHERHEITSVORFALL',
        '',
        'Nachricht wurde an ' + gateway + ' gesendet.',
        '',
        'C:\\> net user UNBEKANNT /domain',
        '',
        'Benutzername              UNBEKANNT',
        'Vollständiger Name',
        'Kommentar',
        'Letzter Anmeldeversuch    ' + dateStr + '  ' + timeStr,
        'Anmeldefehler             3',
        'Konto aktiv               Nein',
        'Konto gesperrt            Ja',
        '',
        'Befehl wurde erfolgreich ausgeführt.',
        '',
        'C:\\> _',
      ]
    },
    {
      leftMsg: 'SITZUNGSPROTOKOLL WIRD ARCHIVIERT',
      cmdTitle: 'C:\\WINNT\\SYSTEM32\\CMD.EXE',
      cmdLines: [
        'C:\\> tracert ' + gateway,
        '',
        'Routenverfolgung zu ' + gateway,
        'über maximal 30 Hops:',
        '',
        '  1    <1 ms    <1 ms    <1 ms  ' + gateway,
        '  2     2 ms     1 ms     2 ms  10.0.0.1',
        '  3    14 ms    13 ms    14 ms  172.16.0.1',
        '  4    21 ms    20 ms    21 ms  Ziel erreicht.',
        '',
        'Ablaufverfolgung beendet.',
        '',
        'C:\\> auditpol /get /category:*',
        '',
        '  Anmeldevorgänge      : Erfolg und Fehler',
        '  Objektzugriff        : Fehler',
        '  Kontoverwaltung      : Erfolg und Fehler',
        '',
        'C:\\> _',
      ]
    },
  ]
}

// ─── Group Policy Schritte ────────────────────────────────────────────────────
const POLICY_STEPS = [
  {
    title: 'GRUPPENRICHTLINIEN WERDEN ANGEWENDET',
    lines: [
      'Bitte warten...',
      '',
      'Benutzerkonfiguration wird geladen...',
      'Domänencontroller wird kontaktiert...  [DC01.BUND.INT]',
      'Netzlaufwerke werden verbunden...',
      '  H:\\  →  \\\\192.168.1.5\\users$\\%USERNAME%  [OK]',
      'Sicherheitsrichtlinien werden übernommen...',
      'Anmeldeskripte werden ausgeführt...',
      '  LOGON.BAT  –  AUSGEFÜHRT',
    ],
    duration: 4200,
  },
  {
    title: 'SYSTEMKONFIGURATION',
    lines: [
      'Softwareverteilung wird geprüft...',
      '  [NETZWERKCLIENT v4.1]      – AKTUELL',
      '  [SICHERHEITSMODUL REV.7]   – AKTUELL',
      '  [NETZWERKTREIBER IPX/SPX]  – AKTUELL',
      '  [DRUCKER-TREIBER LPT1]     – AKTUELL',
      'Zertifikatsspeicher wird aktualisiert...',
      'Lokale Sicherheitsrichtlinie wird angewendet...',
    ],
    duration: 3500,
  },
  {
    title: 'PROFIL WIRD GELADEN',
    lines: [
      'Benutzerprofil wird synchronisiert...',
      '  Quelle: \\\\192.168.1.5\\profiles$\\%USERNAME%',
      'Startmenü wird konfiguriert...',
      'Desktop-Einstellungen werden übernommen...',
      'Zugriffsrechte werden geprüft...',
      '  ARCHIV-ZUGRIFF:    STUFE II – GEWÄHRT',
      '  NETZWERK-ZUGRIFF:  EINGESCHRÄNKT',
      '  DRUCKER-ZUGRIFF:   LOKAL ONLY',
    ],
    duration: 3200,
  },
  {
    title: 'SITZUNG WIRD INITIALISIERT',
    lines: [
      'Sitzungs-ID wird registriert...',
      'Audit-Protokoll wird gestartet...',
      'Verbindung zum Zentralrechner...',
      '  STATUS: HERGESTELLT  [192.168.1.1]',
      'Sitzungsschlüssel wird generiert...',
      '',
      'Anmeldung erfolgreich.',
      'Sitzung wird geöffnet...',
    ],
    duration: 2800,
  },
]

export default function LoginModal({ onSuccess }) {
  const [user, setUser]               = useState('')
  const [pass, setPass]               = useState('')
  const [busy, setBusy]               = useState(false)
  const [message, setMessage]         = useState('')
  const [failCount, setFailCount]     = useState(0)
  const [lockdown, setLockdown]       = useState(false)
  const [bootDone, setBootDone]       = useState(false)
  const [bootLines, setBootLines]     = useState([])
  const [now, setNow]                 = useState(new Date())
  const [glitch, setGlitch]           = useState(false)
  const [alarmPhase, setAlarmPhase]   = useState(0)
  const [alarmLeftMsgs, setAlarmLeftMsgs] = useState([])
  const [alarmCmdTitle, setAlarmCmdTitle] = useState('C:\\WINNT\\SYSTEM32\\CMD.EXE')
  const [alarmCmdLines, setAlarmCmdLines] = useState([])
  const [alarmSequence, setAlarmSequence] = useState([])
  const [randomFailMsg, setRandomFailMsg] = useState(null)
  const [policyStarted, setPolicyStarted] = useState(false)  // einmaliger Trigger
  const [policyPhase, setPolicyPhase] = useState(-1)
  const [policyLines, setPolicyLines] = useState([])
  const [policyProgress, setPolicyProgress] = useState(0)

  const sessionId  = useRef(uuidv4())
  const userRef    = useRef(null)
  const alarmIntRef    = useRef(null)
  const alarmTxtIntRef = useRef(null)
  const cmdSwitchIntRef = useRef(null)
  const policyRunning  = useRef(false)
  const { setLoginUser } = useUserProfile()

  // Uhr
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Boot-Sequenz mit echter Hardware-Erkennung
  useEffect(() => {
    let cancelled = false

    async function runBoot() {
      // Statische Zeilen zuerst
      for (const item of BOOT_LINES_STATIC_PRE) {
        if (cancelled) return
        await new Promise(r => setTimeout(r, item.delay + Math.random() * 400))
        if (cancelled) return
        setBootLines(prev => [...prev, item.text])
        playTone(420 + Math.random() * 80, 22, 'square', 0.015)
      }

      // Echte Hardware-Erkennung
      if (cancelled) return
      const hwLines = await detectHardware()
      for (const item of hwLines) {
        if (cancelled) return
        await new Promise(r => setTimeout(r, item.delay + Math.random() * 600))
        if (cancelled) return
        setBootLines(prev => [...prev, item.text])
        playTone(380 + Math.random() * 60, 20, 'square', 0.012)
      }

      // Statische Zeilen danach
      for (const item of BOOT_LINES_STATIC_POST) {
        if (cancelled) return
        await new Promise(r => setTimeout(r, item.delay + Math.random() * 500))
        if (cancelled) return
        setBootLines(prev => [...prev, item.text])
        playTone(420 + Math.random() * 80, 22, 'square', 0.015)
      }

      if (!cancelled) {
        await new Promise(r => setTimeout(r, 800))
        setBootDone(true)
        setTimeout(() => { if (userRef.current) userRef.current.focus() }, 200)
      }
    }

    setTimeout(runBoot, 500)
    return () => { cancelled = true }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (alarmIntRef.current) clearInterval(alarmIntRef.current)
      if (alarmTxtIntRef.current) clearInterval(alarmTxtIntRef.current)
      if (cmdSwitchIntRef.current) clearInterval(cmdSwitchIntRef.current)
    }
  }, [])

  // Gelegentliche Glitch-Effekte
  useEffect(() => {
    if (!bootDone) return
    const t = setInterval(() => {
      if (Math.random() < 0.05) {
        setGlitch(true)
        setTimeout(() => setGlitch(false), 50 + Math.random() * 80)
      }
    }, 4000)
    return () => clearInterval(t)
  }, [bootDone])

  // Policy-Sequenz (läuft nach erfolgreichem Login – genau einmal)
  // policyStarted wechselt nur einmal von false auf true → Effect wird genau einmal ausgeführt
  useEffect(() => {
    if (!policyStarted) return
    let cancelled = false

    async function runPolicy() {
      for (let i = 0; i < POLICY_STEPS.length; i++) {
        if (cancelled) return
        // Neuen Schritt anzeigen: Titel, leere Zeilen, Fortschritt auf 0
        setPolicyPhase(i)
        setPolicyLines([])
        setPolicyProgress(0)
        playPolicyBeep()
        await new Promise(r => setTimeout(r, 500))
        if (cancelled) return
        const step = POLICY_STEPS[i]
        const lineDelay = Math.floor(step.duration / step.lines.length)
        for (let j = 0; j < step.lines.length; j++) {
          if (cancelled) return
          await new Promise(r => setTimeout(r, lineDelay + Math.random() * 150))
          if (cancelled) return
          setPolicyLines(prev => [...prev, step.lines[j]])
          setPolicyProgress(Math.round(((j + 1) / step.lines.length) * 100))
          if (step.lines[j] && step.lines[j] !== '') playTone(400 + j * 15, 25, 'square', 0.018)
        }
        // Kurze Pause am Ende jedes Schritts
        await new Promise(r => setTimeout(r, 900))
      }
      if (!cancelled) {
        await new Promise(r => setTimeout(r, 700))
        onSuccess && onSuccess()
      }
    }

    runPolicy()
    return () => { cancelled = true }
  }, [policyStarted])

  function simulateDelay(ms) { return new Promise(r => setTimeout(r, ms)) }

  async function writeAudit(entry) {
    try {
      const key = 'audit_log_v1'
      const cur = (await localforage.getItem(key)) || []
      cur.push(entry); await localforage.setItem(key, cur)
    } catch (e) {}
  }

  // ─── Alarm starten ────────────────────────────────────────────────────────────
  function startAlarm() {
    setAlarmPhase(1)
    playAlarmCycle()
    alarmIntRef.current = setInterval(playAlarmCycle, 1200)

    const seq = buildAlarmSequence(sessionId.current)
    setAlarmSequence(seq)

    // Sequenz: alle 7s nächste Phase, linke Meldung + CMD-Fenster synchron
    let seqIdx = 0
    function advanceAlarmSeq() {
      if (seqIdx >= seq.length) return
      const phase = seq[seqIdx]
      // Linke Meldung hinzufügen
      setAlarmLeftMsgs(prev => [...prev, phase.leftMsg])
      // CMD-Fenster wechseln
      setAlarmCmdTitle(phase.cmdTitle)
      setAlarmCmdLines([])
      setAlarmPhase(2)
      // CMD-Zeilen schrittweise eintippen (alle 180ms eine Zeile)
      phase.cmdLines.forEach((line, i) => {
        setTimeout(() => {
          setAlarmCmdLines(prev => [...prev, line])
        }, i * 180)
      })
      seqIdx++
      if (seqIdx < seq.length) {
        cmdSwitchIntRef.current = setTimeout(advanceAlarmSeq, 7000)
      }
    }
    setTimeout(advanceAlarmSeq, 1200)
  }

  // ─── Login Handler ────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (busy || lockdown) return
    getAudioCtx()
    setBusy(true)
    setRandomFailMsg(null)

    setMessage('VERBINDUNGSAUFBAU...')
    await simulateDelay(600 + Math.random() * 800)

    if (shouldRandomFail()) {
      const err = getRandomConnectionError()
      setMessage('FEHLER [' + err.code + ']')
      playErrorBeep()
      await simulateDelay(400)
      setRandomFailMsg(err.msg)
      await simulateDelay(2500 + Math.random() * 2000)
      setRandomFailMsg(null)
      setMessage('ERNEUTER VERBINDUNGSVERSUCH...')
      await simulateDelay(1200 + Math.random() * 800)
    }

    setMessage('AUTHENTIFIZIERUNG LÄUFT')
    for (let i = 0; i < 14; i++) {
      await simulateDelay(280 + Math.random() * 320)
      setMessage(prev => prev + '.')
      playTone(460, 35, 'square', 0.018)
    }
    await simulateDelay(600 + Math.random() * 800)

    const ts = new Date().toISOString()
    const valid = isValidCredential(user, pass)
    const cred = getCredential(user, pass)

    if (valid && cred) {
      setMessage('ZUGANGSDATEN BESTÄTIGT')
      playSuccessChime()
      if (setLoginUser) {
        await setLoginUser({
          username: user,
          displayName: cred.displayName,
          role: cred.role,
          permissions: cred.permissions,
          clearance: cred.clearance,
          loginTime: ts,
          sessionId: sessionId.current,
          isLoggedIn: true
        })
      }
      // Auch in localStorage für andere Komponenten
      localStorage.setItem('gov_current_user', JSON.stringify({
        username: user,
        displayName: cred.displayName,
        role: cred.role,
        permissions: cred.permissions,
        clearance: cred.clearance,
        loginTime: ts,
        isLoggedIn: true
      }))
      await writeAudit({ ts, user, action: 'login', result: 'success', info: navigator.userAgent })
      await simulateDelay(900)
      setMessage('')
      setBusy(false)
      // Policy-Sequenz starten (einmaliger Trigger)
      setPolicyStarted(true)
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

  // ─── BOOT SCREEN ──────────────────────────────────────────────────────────────
  if (!bootDone) {
    return (
      <div className="retro-screen">
        <div className="crt-overlay" />
        <div className="retro-boot">
          {bootLines.map((line, i) => (
            <div key={i} className="retro-boot-line">{line}</div>
          ))}
          <span className="crt-cursor">_</span>
        </div>
      </div>
    )
  }

  // ─── GROUP POLICY SCREEN ───────────────────────────────────────────────────────
  if (policyStarted) {
    const safePhase = Math.max(0, Math.min(policyPhase, POLICY_STEPS.length - 1))
    const step = POLICY_STEPS[safePhase]
    return (
      <div className="retro-screen retro-policy-screen">
        <div className="crt-overlay" />
        <div className="policy-container">
          <div className="policy-logo-row">
            <span className="policy-logo-char">■</span>
            <span className="policy-logo-text">BUND.INT  –  SICHERHEITSTERMINAL</span>
            <span className="policy-logo-char">■</span>
          </div>

          {/* Schritt-Indikatoren oben */}
          <div className="policy-steps-indicator">
            {POLICY_STEPS.map((s, idx) => (
              <div
                key={idx}
                className={'policy-step-indicator' +
                  (idx < safePhase ? ' policy-step-done' :
                   idx === safePhase ? ' policy-step-active' : '')}
              >
                <span className="policy-step-num">{idx + 1}</span>
                <span className="policy-step-ind-title">{s.title.split(' ').slice(0, 2).join(' ')}</span>
              </div>
            ))}
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
            SCHRITT {safePhase + 1} VON {POLICY_STEPS.length}
          </div>
          <div className="policy-footer-note">
            Bitte warten. Computer nicht ausschalten oder neu starten.
          </div>
        </div>
      </div>
    )
  }

  // ─── ALARM / LOCKDOWN SCREEN ───────────────────────────────────────────────────
  if (lockdown) {
    return (
      <div className={'retro-screen retro-alarm-screen' + (alarmPhase >= 2 ? ' alarm-phase2' : '')}>
        <div className="crt-overlay" />

        <div className="alarm-topbar">
          <span className="alarm-topbar-blink">▌</span>
          <span className="alarm-topbar-title">SICHERHEITSPROTOKOLL – ZUGANG VERWEIGERT</span>
          <span className="alarm-topbar-blink">▌</span>
        </div>

        <div className="alarm-body">
          {/* Linke Spalte: Status + synchronisierte Meldungen */}
          <div className="alarm-left-col">
            <div className="alarm-status-box">
              <div className="alarm-status-row alarm-blink-slow">
                ▐ TERMINAL GESPERRT ▌
              </div>
              <div className="alarm-status-divider">{'─'.repeat(30)}</div>
              <div className="alarm-status-row">
                <span className="alarm-key">TERMINAL :</span>
                <span className="alarm-val">{sessionId.current.slice(0, 10).toUpperCase()}</span>
              </div>
              <div className="alarm-status-row">
                <span className="alarm-key">DATUM    :</span>
                <span className="alarm-val">{format(now, 'dd.MM.yyyy')}</span>
              </div>
              <div className="alarm-status-row">
                <span className="alarm-key">UHRZEIT  :</span>
                <span className="alarm-val">{format(now, 'HH:mm:ss')}</span>
              </div>
              <div className="alarm-status-row">
                <span className="alarm-key">VERSUCHE :</span>
                <span className="alarm-val">3 / 3  –  GESPERRT</span>
              </div>
              <div className="alarm-status-divider">{'─'.repeat(30)}</div>
              <div className="alarm-warn-list">
                {alarmLeftMsgs.map((msg, i) => (
                  <div key={i} className={'alarm-warn-item' + (i === alarmLeftMsgs.length - 1 ? ' alarm-warn-active' : '')}>
                    &gt; {msg}
                  </div>
                ))}
                {alarmLeftMsgs.length === 0 && (
                  <div className="alarm-warn-item alarm-blink-slow">&gt; PROTOKOLL WIRD INITIALISIERT...</div>
                )}
              </div>
            </div>
          </div>

          {/* Rechte Spalte: CMD-Fenster – synchron mit linker Seite */}
          {alarmPhase >= 2 && (
            <div className="alarm-cmd-col">
              <div className="alarm-cmd-window">
                <div className="alarm-cmd-titlebar">
                  <div className="alarm-cmd-titlebar-left">
                    <span className="alarm-cmd-titlebar-icon">■</span>
                  </div>
                  <span className="alarm-cmd-titlebar-text">{alarmCmdTitle}</span>
                  <div className="alarm-cmd-titlebar-right">
                    <span className="alarm-cmd-titlebar-btn">—</span>
                    <span className="alarm-cmd-titlebar-btn">□</span>
                    <span className="alarm-cmd-titlebar-btn alarm-cmd-close">×</span>
                  </div>
                </div>
                <div className="alarm-cmd-body">
                  {alarmCmdLines.map((line, i) => (
                    <div key={i} className="alarm-cmd-line">{line === '' ? ' ' : line}</div>
                  ))}
                  <span className="alarm-cmd-cursor">_</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="alarm-bottombar">
          <span className="alarm-blink">■ PROTOKOLL AKTIV</span>
          <span>{format(now, 'dd.MM.yyyy  HH:mm:ss')}</span>
          <span className="alarm-blink">■ VERBINDUNG GESICHERT</span>
        </div>
      </div>
    )
  }

  // ─── NORMALER LOGIN SCREEN ─────────────────────────────────────────────────────
  return (
    <div className={'retro-screen' + (glitch ? ' retro-glitch' : '')}>
      <div className="crt-overlay" />
      <div className="retro-statusbar">
        <span>SICHERHEITSTERMINAL  v4.1</span>
        <span className="retro-clock">{format(now, 'dd.MM.yyyy  HH:mm:ss')}</span>
      </div>

      <div className="retro-login-panel">

        <div className="retro-header-block">
          <div className="retro-header-title">ZUGANGSSTEUERUNG</div>
          <div className="retro-header-sub">Autorisierter Zugriff erforderlich</div>
        </div>

        <div className="retro-divider">{'─'.repeat(44)}</div>

        <div className="retro-info-grid">
          <div className="retro-info-row">
            <span className="retro-info-key">SYSTEM&nbsp;&nbsp;&nbsp;&nbsp;:</span>
            <span className="retro-info-val">ZENTRALRECHNER  [EINGESCHRÄNKT]</span>
          </div>
          <div className="retro-info-row">
            <span className="retro-info-key">TERMINAL&nbsp;&nbsp;:</span>
            <span className="retro-info-val">{sessionId.current.slice(0, 12).toUpperCase()}</span>
          </div>
          <div className="retro-info-row">
            <span className="retro-info-key">SICHERHEIT:</span>
            <span className="retro-info-val">DES-56  –  VERSCHLÜSSELT</span>
          </div>
          <div className="retro-info-row">
            <span className="retro-info-key">STATUS&nbsp;&nbsp;&nbsp;&nbsp;:</span>
            <span className="retro-info-val retro-blink-slow">WARTE AUF EINGABE</span>
          </div>
        </div>

        <div className="retro-divider">{'─'.repeat(44)}</div>

        <div className="retro-notice">
          <div>UNBEFUGTER ZUGRIFF IST STRAFBAR</div>
          <div>ALLE AKTIVITÄTEN WERDEN PROTOKOLLIERT</div>
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
            <div className="retro-random-fail-retry">Erneuter Verbindungsversuch...</div>
          </div>
        )}

        <div className="retro-attempt-info">
          {failCount > 0
            ? 'FEHLVERSUCHE: ' + failCount + '/3'
            : 'VERSUCHE VERBLEIBEND: ' + (3 - failCount)
          }
        </div>

        <div className="retro-divider" style={{ marginTop: '6px' }}>{'─'.repeat(44)}</div>

        <div className="retro-footer">
          <div>SIEMENS NIXDORF  •  v4.1  •  1994</div>
          <div>SUPPORT: 0228-99-0  •  NOTFALL: 0228-99-1</div>
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
