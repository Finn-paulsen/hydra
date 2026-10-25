import React from 'react'
import timeline from '../data/timeline.json'

interface TimelineEvent { year: string | number; title: string; desc: string; }

export default function Timeline(){
  return (
    <div>
      <h3>Timeline</h3>
      <ol>
        {(timeline as TimelineEvent[]).map((e,idx)=> (
          <li key={idx} style={{marginBottom:10}}>
            <strong>{e.year}</strong> — {e.title}
            <div style={{opacity:0.8,fontSize:13}}>{e.desc}</div>
          </li>
        ))}
      </ol>
    </div>
  )
}
