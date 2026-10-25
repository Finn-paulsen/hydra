import React, { useState, useRef } from 'react'

function safeId(){return Math.random().toString(36).slice(2,9)}

export default function Browser(){
  const [url, setUrl] = useState('tomate3.com')
  const [content, setContent] = useState('<div class="card"><h3>Willkommen</h3><p>Gib eine Adresse ein, z. B. <code>tomate3.com</code></p></div>')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState([])
  const [pos, setPos] = useState(-1)
  const [live, setLive] = useState(false)
  const iframeRef = useRef(null)

  function addHistory(entry){
    const h = history.slice(0,pos+1)
    h.push(entry)
    setHistory(h)
    setPos(h.length-1)
  }

  async function load(){
    setError(null)
    const host = url.trim() || 'tomate3.com'
    setLoading(true)
    try{
      if(live){
        // call local proxy at :8787 (user must run scripts/proxy.mjs)
        const proxy = `http://localhost:8787/fetch?url=${encodeURIComponent('https://'+host)}`
        const res = await fetch(proxy)
        if(!res.ok) throw new Error('Proxy error')
        const data = await res.text()
        setContent(data)
        addHistory({id:safeId(),url:host,live:true,ts:Date.now(),html:data})
      } else {
        // load local curated page from /data/pages/<host>.html
        const local = `/data/pages/${host}.html`
        const r = await fetch(local)
        if(!r.ok) throw new Error('Seite lokal nicht gefunden')
        const text = await r.text()
        setContent(text)
        addHistory({id:safeId(),url:host,live:false,ts:Date.now(),html:text})
      }
    }catch(e){
      setError(e.message)
      setContent(`<div class=\"card\"><h3>Fehler</h3><p>${e.message}</p><p>Wenn du Live‑Inhalte wünschst: lokal Proxy starten (siehe /scripts/proxy.mjs)</p></div>`)
    }finally{setLoading(false)}
  }

  function goBack(){
    if(pos>0){
      const newPos = pos-1
      setPos(newPos)
      const h = history[newPos]
      setContent(h.html)
      setUrl(h.url)
    }
  }
  function goForward(){
    if(pos < history.length-1){
      const newPos = pos+1
      setPos(newPos)
      const h = history[newPos]
      setContent(h.html)
      setUrl(h.url)
    }
  }

  function archiveCurrent(){
    try{
      const store = JSON.parse(localStorage.getItem('browserArchive')||'[]')
      const entry = {id:safeId(),url,ts:Date.now(),html:content}
      store.unshift(entry)
      localStorage.setItem('browserArchive', JSON.stringify(store))
      alert('Seite zum Archiv hinzugefügt')
    }catch(e){alert('Archiv Fehler: '+e.message)}
  }

  function showArchive(){
    const store = JSON.parse(localStorage.getItem('browserArchive')||'[]')
    const list = store.map(s=>`${new Date(s.ts).toLocaleString()} — ${s.url}`).join('\n')
    if(!list) alert('Archiv leer')
    else alert(list)
  }

  function downloadArchive(){
    const store = localStorage.getItem('browserArchive')||'[]'
    const blob = new Blob([store],{type:'application/json'})
    const urlB = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = urlB
    a.download = 'browser-archive.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(urlB)
  }

  return (
    <div className="browser-root card">
      <div className="browser-bar">
        <div className="nav-buttons">
          <button onClick={goBack} disabled={pos<=0}>{'<'}</button>
          <button onClick={goForward} disabled={pos>=history.length-1}>{'>'}</button>
          <button onClick={()=>{load()}} title="Laden">⟳</button>
        </div>
        <label htmlFor="browser-address">Adresse:
          <input id="browser-address" className="address" name="address" value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')load()}} />
        </label>
        <label className="live-toggle"><input type="checkbox" checked={live} onChange={e=>setLive(e.target.checked)} /> Live (lokaler Proxy)</label>
        <button onClick={archiveCurrent}>Archiv+</button>
        <button onClick={showArchive}>Archiv anzeigen</button>
        <button onClick={downloadArchive}>Export</button>
      </div>

      <div className="browser-content">
        {loading && <div className="loader">Lädt…</div>}
        <div className="browser-frame" dangerouslySetInnerHTML={{__html:content}} ref={iframeRef} />
      </div>

      {error && <div className="browser-error">{error}</div>}
    </div>
  )
}
