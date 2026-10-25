import React, { useState } from 'react'

// Dummy-Daten für Aufnahmen (pro Jahr/Monat/Tag)
// Realistisches Zeitraster: 4 Kameras, alle 6 Stunden, für jeden Tag
const KAMERAS = [
  { name: 'Kamera 1', ort: 'Parkplatz', src: 'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif', type: 'gif' },
  { name: 'Kamera 2', ort: 'Eingang', src: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', type: 'gif' },
  { name: 'Kamera 3', ort: 'Fahrstuhl', src: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif', type: 'gif' },
  { name: 'Kamera 4', ort: 'Lobby', src: 'https://media.giphy.com/media/3o6Zt481isNVuQI1l6/giphy.gif', type: 'gif' }
]
const ZEITEN = ['00:00','06:00','12:00','18:00']
function generateArchive() {
  const archive = {}
  for (let year = 2002; year <= 2026; year++) {
    archive[year] = {}
    for (let month = 1; month <= 12; month++) {
      archive[year][month] = {}
      for (let day = 1; day <= 28; day++) {
        const date = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
        archive[year][month][day] = KAMERAS.map((k, ki) => ({
          name: k.name,
          ort: k.ort,
          aufnahmen: ZEITEN.map((zeit, zi) => ({
            id: `${date}-${ki}-${zi}`,
            time: `${date} ${zeit}`,
            src: k.src,
            type: k.type
          }))
        }))
      }
    }
  }
  return archive
}
const ARCHIVE = generateArchive()



export default function ArchiveViewer() {
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState("");
  const [searchDate, setSearchDate] = useState(null);

  // Hilfsfunktion: Datum parsen (TT.MM.JJJJ)
  function parseDate(input) {
    const match = input.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) return null;
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (year < 2002 || year > 2026) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 28) return null;
    return { year, month, day };
  }

  // Ergebnisse für das eingegebene Datum suchen
  let results = [];
  if (searchDate) {
    const { year, month, day } = searchDate;
    if (
      ARCHIVE[year] &&
      ARCHIVE[year][month] &&
      ARCHIVE[year][month][day]
    ) {
      results = ARCHIVE[year][month][day];
    }
  }

  // Aufnahmeintervall (Demo: alle 4-6 Stunden)
  const aufnahmeIntervall = 'alle 6 Stunden'

  // ...existing code...

  // Player-Controls (wie SurveillanceCenter, Demo)
  function handlePlay() {}
  function handlePause() {}
  function handleStop() {}
  function handleRewind() {}
  function handleForward() {}

  return (
    <div className="archive-viewer">
      <div className="archive-header">VIDEOARCHIV</div>
      <div className="archive-main">
        <div className="archive-nav">
          <div className="archive-nav-section" style={{marginTop:12}}>
            <div>Aufnahmeintervall:</div>
            <div style={{color:'#ffbf47',fontWeight:700}}>{aufnahmeIntervall}</div>
          </div>
          <div className="archive-nav-section" style={{marginTop:24}}>
            <div>Datumssuche:</div>
            <label htmlFor="archive-search">Suche:
              <input
                id="archive-search"
                type="text"
                name="dateSearch"
                placeholder="TT.MM.JJJJ"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const parsed = parseDate(search);
                    setSearchDate(parsed);
                  }
                }}
                style={{width:120,marginTop:4,padding:4,borderRadius:4,border:'1px solid #444',background:'#232323',color:'#fff'}}
              />
            </label>
          </div>
        </div>
        <div className="archive-results">
          {!selected && (!searchDate || results.length === 0) && (
            <div className="archive-hint">Bitte Datum im Format TT.MM.JJJJ eingeben und Enter drücken…</div>
          )}
          {!selected && results.length > 0 && (
            <div className="archive-table">
              <div className="archive-table-head">
                <div>Kamera</div>
                <div>Ort</div>
                <div>Aufnahmen ({ZEITEN.join(', ')})</div>
              </div>
              {results.map((r, idx) => (
                <div className="archive-table-row" key={r.name+idx}>
                  <div className="archive-table-cell">{r.name}</div>
                  <div className="archive-table-cell">{r.ort}</div>
                  <div className="archive-table-cell">
                    {r.aufnahmen.map(a => (
                      <button className="archive-time-btn" key={a.id} onClick={() => setSelected({ ...a, name: r.name, ort: r.ort })}>{a.time.slice(11,16)}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {selected && (
            <div className="archive-player">
              <div className="archive-player-meta">
                <b>{selected.time}</b> — {selected.name} ({selected.ort})
              </div>
              <div className="archive-player-feed">
                <img src={selected.src} alt={selected.name} style={{width:'100%',maxHeight:260,objectFit:'cover',background:'#232323'}} />
              </div>
              <div className="archive-player-controls">
                <button onClick={handlePlay}>▶</button>
                <button onClick={handlePause}>⏸</button>
                <button onClick={handleStop}>⏹</button>
                <button onClick={handleRewind}>⏪</button>
                <button onClick={handleForward}>⏩</button>
                <button onClick={() => setSelected(null)}>Zurück</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
