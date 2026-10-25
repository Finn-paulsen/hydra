import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

import './styles.css'
// TailwindCSS + DaisyUI sind jetzt aktiv. Du kannst DaisyUI-Komponenten direkt verwenden.
// Beispiel: <button className="btn btn-primary">Click me</button>


const container = document.getElementById('root')
const root = createRoot(container)
root.render(<App />)
