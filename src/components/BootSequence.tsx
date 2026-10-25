import React, { useEffect, useRef } from 'react'

export default function BootSequence({ onFinish }){
  const containerRef = useRef(null)
  const timers = useRef([])
  const listeners = useRef([])

  useEffect(()=>{
    const container = containerRef.current
    if(!container) return

    // helper to append a line element
    function appendLine(text, opts = {}){
      const line = document.createElement('div')
      line.className = 'boot-line'
      if(opts.className) line.classList.add(opts.className)
      container.appendChild(line)

      if(opts.instant){
        line.textContent = text
        if(opts.flicker) startFlicker(line)
        container.scrollTop = container.scrollHeight
        return Promise.resolve()
      }

      return new Promise(resolve=>{
        let i = 0
        const speed = opts.speed ?? 18
        const t = setInterval(()=>{
          line.textContent += text[i] ?? ''
          i++
          container.scrollTop = container.scrollHeight
          if(i >= text.length){
            clearInterval(t)
            if(opts.flicker) startFlicker(line)
            resolve()
          }
        }, speed)
        timers.current.push(t)
      })
    }

    function startFlicker(el){
      el.classList.add('flicker-brief')
      const t = setTimeout(()=>el.classList.remove('flicker-brief'), 420)
      timers.current.push(t)
    }

    // wait helper
    function wait(ms){
      return new Promise(resolve=>{const t = setTimeout(resolve, ms); timers.current.push(t)})
    }

  // prompt for interactive override; resolves with {success, attempts}
  function promptForOverride(maxAttempts = 3, enableSound = true){
      return new Promise(resolve=>{
        let attempts = 0

        // prepare audio context for subtle key click
        let audioCtx = null
        function playKeyClick(){
          if(!enableSound) return
          try{
            if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
            const o = audioCtx.createOscillator()
            const g = audioCtx.createGain()
            o.type = 'square'
            o.frequency.value = 800
            g.gain.value = 0.0025
            o.connect(g); g.connect(audioCtx.destination)
            o.start()
            setTimeout(()=>{ o.stop() }, 30)
          }catch(e){/* audio may be blocked by browser autoplay restrictions */}
        }

        function createPrompt(){
          const promptLine = document.createElement('div')
          promptLine.className = 'boot-line prompt-line'
          const prefix = document.createTextNode('> ')
          const userSpan = document.createElement('span')
          userSpan.className = 'user-input'
          const cursorSpan = document.createElement('span')
          cursorSpan.className = 'inline-cursor'
          cursorSpan.textContent = '_'
          promptLine.appendChild(prefix)
          promptLine.appendChild(userSpan)
          promptLine.appendChild(cursorSpan)
          container.appendChild(promptLine)
          container.scrollTop = container.scrollHeight
          return {promptLine, userSpan, cursorSpan}
        }

        let state = createPrompt()
        let buffer = ''

        function invalidatePrompt(){
          state.promptLine.classList.add('invalid')
          state.promptLine.classList.add('shake')
          setTimeout(()=>{
            state.promptLine.classList.remove('shake')
          }, 420)
        }

        function cleanupPromptListeners(fn){
          window.removeEventListener('keydown', fn)
        }

        function onKey(e){
          if(e.key === 'Backspace'){
            e.preventDefault()
            buffer = buffer.slice(0,-1)
            state.userSpan.textContent = buffer
            container.scrollTop = container.scrollHeight
            playKeyClick()
            return
          }
          if(e.key === 'Enter'){
            e.preventDefault()
            const entry = buffer.trim()
            cleanupPromptListeners(onKey)
            // render final typed line
            state.promptLine.textContent = `> ${entry}\n`
            container.scrollTop = container.scrollHeight
            if(entry.toLowerCase() === 'override --force'){
              resolve({success:true, attempts: attempts})
            } else {
              attempts++
              invalidatePrompt()
              appendLine('COMMAND NOT RECOGNIZED\n', {speed:20, className:'warn'}).then(()=>{
                if(attempts >= maxAttempts){
                  appendLine('MAX ATTEMPTS REACHED\n', {speed:18, className:'warn'}).then(()=>{
                    appendLine('ALTERNATIVE: REQUEST OVERRIDE CODE\n', {speed:18, className:'warn'})
                    resolve({success:false, attempts})
                  })
                } else {
                  // create a fresh prompt after a short pause
                  const t = setTimeout(()=>{
                    state = createPrompt()
                    buffer = ''
                    window.addEventListener('keydown', onKey)
                  }, 360)
                  timers.current.push(t)
                }
              })
            }
            return
          }
          // ignore control/meta keys
          if(e.key.length === 1 && !e.ctrlKey && !e.metaKey){
            buffer += e.key
            state.userSpan.textContent = buffer
            container.scrollTop = container.scrollHeight
            playKeyClick()
          }
        }

        window.addEventListener('keydown', onKey)
        listeners.current.push(onKey)
      })
    }

    // simple user id prompt - accepts a small allowlist, otherwise counts as unknown
    function promptForUserId(maxAttempts = 3, allowList = ['fpaulsen','admin','root']){
      return new Promise(resolve=>{
        let attempts = 0

        function create(){
          const promptLine = document.createElement('div')
          promptLine.className = 'boot-line prompt-line'
          const prefix = document.createTextNode('ENTER USER ID: ')
          const userSpan = document.createElement('span')
          userSpan.className = 'user-input'
          const cursorSpan = document.createElement('span')
          cursorSpan.className = 'inline-cursor'
          cursorSpan.textContent = '_'
          promptLine.appendChild(prefix)
          promptLine.appendChild(userSpan)
          promptLine.appendChild(cursorSpan)
          container.appendChild(promptLine)
          container.scrollTop = container.scrollHeight
          return {promptLine, userSpan}
        }

        let state = create()
        let buffer = ''

        function onKey(e){
          if(e.key === 'Backspace'){ e.preventDefault(); buffer = buffer.slice(0,-1); state.userSpan.textContent = buffer; container.scrollTop = container.scrollHeight; return }
          if(e.key === 'Enter'){
            e.preventDefault()
            const entry = buffer.trim()
            window.removeEventListener('keydown', onKey)
            state.promptLine.textContent = `ENTER USER ID: ${entry}\n`
            container.scrollTop = container.scrollHeight
            const match = allowList.includes(entry.toLowerCase())
            if(match){ appendLine(`MATCH: ${entry.toUpperCase()}\n`, {speed:18}).then(()=>resolve({success:true, id:entry})) }
            else {
              attempts++
              appendLine('MATCH: UNKNOWN USER\n', {speed:18, className:'warn'}).then(()=>{
                if(attempts >= maxAttempts){ appendLine('MAX ATTEMPTS REACHED\n', {speed:18, className:'warn'}).then(()=>resolve({success:false})) }
                else { setTimeout(()=>{ state = create(); buffer=''; window.addEventListener('keydown', onKey) }, 260) }
              })
            }
            return
          }
          if(e.key.length === 1 && !e.ctrlKey && !e.metaKey){ buffer += e.key; state.userSpan.textContent = buffer; container.scrollTop = container.scrollHeight }
        }

        window.addEventListener('keydown', onKey)
        listeners.current.push(onKey)
      })
    }

    // passphrase prompt - masked input, strict match, no tolerance
    function promptForPassphrase(maxAttempts = 3, correct = 'blackvault-1979'){
      return new Promise(resolve=>{
        let attempts = 0

        function create(){
          const promptLine = document.createElement('div')
          promptLine.className = 'boot-line prompt-line'
          const prefix = document.createTextNode('ENTER PASSPHRASE TO UNLOCK: ')
          const userSpan = document.createElement('span')
          userSpan.className = 'user-input'
          const cursorSpan = document.createElement('span')
          cursorSpan.className = 'inline-cursor'
          cursorSpan.textContent = '_'
          promptLine.appendChild(prefix)
          promptLine.appendChild(userSpan)
          promptLine.appendChild(cursorSpan)
          container.appendChild(promptLine)
          container.scrollTop = container.scrollHeight
          return {promptLine, userSpan}
        }

        let state = create()
        let buffer = ''

        function onKey(e){
          if(e.key === 'Backspace'){ e.preventDefault(); buffer = buffer.slice(0,-1); state.userSpan.textContent = '•'.repeat(buffer.length); container.scrollTop = container.scrollHeight; return }
          if(e.key === 'Enter'){
            e.preventDefault()
            const entry = buffer
            window.removeEventListener('keydown', onKey)
            state.promptLine.textContent = `ENTER PASSPHRASE TO UNLOCK: ${'•'.repeat(entry.length)}\n`
            container.scrollTop = container.scrollHeight
            if(entry === correct){ appendLine('VAULT UNLOCKED\n', {speed:18}).then(()=>resolve({success:true})) }
            else {
              attempts++
              state.promptLine.classList.add('invalid')
              appendLine('AUTH FAILED\n', {speed:18, className:'warn'}).then(()=>{
                state.promptLine.classList.remove('invalid')
                if(attempts >= maxAttempts){ appendLine('MAX ATTEMPTS REACHED\n', {speed:18, className:'warn'}).then(()=>resolve({success:false})) }
                else { setTimeout(()=>{ state = create(); buffer=''; window.addEventListener('keydown', onKey) }, 360) }
              })
            }
            return
          }
          if(e.key.length === 1 && !e.ctrlKey && !e.metaKey){ buffer += e.key; state.userSpan.textContent = '•'.repeat(buffer.length); container.scrollTop = container.scrollHeight }
        }

        window.addEventListener('keydown', onKey)
        listeners.current.push(onKey)
      })
    }

    // 2FA prompt - generates a one-time code and requires exact numeric entry
    function promptFor2FA(maxAttempts = 3){
      return new Promise(resolve=>{
        const token = String(Math.floor(100000 + Math.random()*900000))
        appendLine('SENDING 2FA TOKEN TO REGISTERED DEVICE...\n', {speed:18}).then(()=>{
            // show debug token for local testing (keep until flow completes to avoid timing issues)
            const dbg = document.createElement('div')
            dbg.className = 'boot-line debug-token'
            dbg.textContent = `DEBUG TOKEN: ${token}`
            dbg.style.opacity = '0.32'
            container.appendChild(dbg)
            container.scrollTop = container.scrollHeight

          // then prompt user
          const promptLine = document.createElement('div')
          promptLine.className = 'boot-line prompt-line'
          const prefix = document.createTextNode('ENTER 6-DIGIT 2FA CODE: ')
          const userSpan = document.createElement('span')
          userSpan.className = 'user-input'
          const cursorSpan = document.createElement('span')
          cursorSpan.className = 'inline-cursor'
          cursorSpan.textContent = '_'
          promptLine.appendChild(prefix)
          promptLine.appendChild(userSpan)
          promptLine.appendChild(cursorSpan)
          container.appendChild(promptLine)
          container.scrollTop = container.scrollHeight

          let attempts = 0
          let buffer = ''
          function onKey(e){
            if(e.key === 'Backspace'){ e.preventDefault(); buffer = buffer.slice(0,-1); userSpan.textContent = buffer; container.scrollTop = container.scrollHeight; return }
            if(e.key === 'Enter'){
              e.preventDefault()
              const entry = buffer.trim()
              window.removeEventListener('keydown', onKey)
              promptLine.textContent = `ENTER 6-DIGIT 2FA CODE: ${entry}\n`
              container.scrollTop = container.scrollHeight
              if(entry === token){
                appendLine('2FA VERIFIED\n', {speed:18}).then(()=>{
                  if(dbg && dbg.parentNode) dbg.remove()
                  resolve({success:true})
                })
              } else {
                attempts++
                promptLine.classList.add('invalid')
                appendLine('INVALID TOKEN\n', {speed:18, className:'warn'}).then(()=>{
                  promptLine.classList.remove('invalid')
                  if(attempts >= maxAttempts){
                    appendLine('TOKEN EXPIRED\n', {speed:18, className:'warn'}).then(()=>{
                      if(dbg && dbg.parentNode) dbg.remove()
                      resolve({success:false})
                    })
                  } else {
                    setTimeout(()=>{
                      buffer=''
                      const nl = document.createElement('div'); nl.className='boot-line'; nl.textContent='RETRY 2FA'; container.appendChild(nl)
                      const t2 = setTimeout(()=>{ promptFor2FA().then(res=>{
                        if(dbg && dbg.parentNode) dbg.remove()
                        resolve(res)
                      }) }, 260)
                      timers.current.push(t2)
                    }, 260)
                  }
                })
              }
              return
            }
            if(e.key.length === 1 && /[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey){ buffer += e.key; userSpan.textContent = buffer; container.scrollTop = container.scrollHeight }
          }
          window.addEventListener('keydown', onKey)
          listeners.current.push(onKey)
        })
      })
    }

    // sequence of phases and lines (timings chosen to feel cinematic but snappy)
    async function runSequence(){
      // Phase 1: black screen - show single cursor then start
      const cursor = document.createElement('span')
      cursor.className = 'boot-cursor'
      cursor.textContent = '_'
      container.appendChild(cursor)
      await wait(1200)
      container.removeChild(cursor)

      // Phase 2: hardware init
      await appendLine('BOOT SEQUENCE STARTED\n', {speed:24})
      await wait(200)
      await appendLine('CHECKING HARDWARE...\n', {speed:22})
      await wait(150)
      await appendLine('CPU: OK\n', {speed:18})
      await appendLine('RAM: OK\n', {speed:18})
      await appendLine('STORAGE: OK\n', {speed:18})
      await appendLine('NETWORK INTERFACE: OK\n', {speed:18})
      await appendLine('SECURITY MODULE: OK\n', {speed:18})
      await wait(350)

      await appendLine('LOADING KERNEL MODULES...\n', {speed:20})
      await wait(180)
      const modules = ['crypto_core','fs_driver','net_stack','surveillance_module','archive_indexer']
      for(let m of modules){
        await appendLine(`[ OK ] ${m}\n`, {speed:20})
        await wait(80)
      }

      // Phase 3: security
      await wait(220)
      await appendLine('INITIALIZING SECURITY LAYER...\n', {speed:20})
      await wait(160)
      await appendLine('ENCRYPTION: ACTIVE\n', {speed:18})
      await appendLine('SESSION TOKEN: GENERATED\n', {speed:18})
      await appendLine('AUTH CHANNEL: SECURE\n', {speed:18})
      await appendLine('INTEGRITY CHECK: PASSED\n', {speed:18})
      await wait(420)

      // Phase 4: identity and multi-step authentication
      await appendLine('VERIFYING USER IDENTITY...\n', {speed:20})
      await wait(300)
      await appendLine('SCANNING...\n', {speed:22})
      await wait(400)

      // 1) User ID
      const uidRes = await promptForUserId(3)
      if(!uidRes.success){
          // offer request override flow
          const reqOk = await requestOverrideFlow()
          if(!reqOk){
            await appendLine('CREDENTIAL LEVEL: UNDEFINED\n', {speed:20})
            await appendLine('ACCESS STATUS: RESTRICTED\n', {speed:20})
            await appendLine('PRESS ANY KEY TO CONTINUE\n', {speed:18})
            const onInputFail = ()=>finish()
            window.addEventListener('keydown', onInputFail, {once:true})
            container.addEventListener('click', onInputFail, {once:true})
            return
          }
      }

      await appendLine(`MATCH: ${uidRes.id.toUpperCase()}\n`, {speed:18})
      await appendLine('CREDENTIAL LEVEL: DEFINED\n', {speed:18})
      await wait(240)

      // 2) Passphrase (masked)
      const passRes = await promptForPassphrase(3)
      if(!passRes.success){
        const reqOk = await requestOverrideFlow()
        if(!reqOk){
          await appendLine('ACCESS STATUS: RESTRICTED\n', {speed:20})
          await appendLine('PRESS ANY KEY TO CONTINUE\n', {speed:18})
          const onInputFail2 = ()=>finish()
          window.addEventListener('keydown', onInputFail2, {once:true})
          container.addEventListener('click', onInputFail2, {once:true})
          return
        }
      }

      await wait(180)
      await appendLine('AUTH CHANNEL: SECURE\n', {speed:18})
      await wait(120)

      // 3) 2FA
      const twoRes = await promptFor2FA(3)
      if(!twoRes.success){
        const reqOk = await requestOverrideFlow()
        if(!reqOk){
          await appendLine('ACCESS STATUS: RESTRICTED\n', {speed:20})
          await appendLine('PRESS ANY KEY TO CONTINUE\n', {speed:18})
          const onInputFail3 = ()=>finish()
          window.addEventListener('keydown', onInputFail3, {once:true})
          container.addEventListener('click', onInputFail3, {once:true})
          return
        }
      }

      await appendLine('INTEGRITY CHECK: PASSED\n', {speed:18})
      await wait(220)

      // interactive override prompt (final manual step)
      await appendLine('TYPE OVERRIDE COMMAND TO PROCEED\n', {speed:20})
      const ov = await promptForOverride()
      if(!ov.success){
        // user failed override; offer request flow
        const reqOk = await requestOverrideFlow()
        if(!reqOk){
          await appendLine('ACCESS STATUS: RESTRICTED\n', {speed:20})
          await appendLine('PRESS ANY KEY TO CONTINUE\n', {speed:18})
          const onInputFail4 = ()=>finish()
          window.addEventListener('keydown', onInputFail4, {once:true})
          container.addEventListener('click', onInputFail4, {once:true})
          return
        }
      }

      // after successful override
      await appendLine('OVERRIDE REQUESTED\n', {speed:20})
      await appendLine('CHECKING SYSTEM RESPONSE...\n', {speed:20})
      await wait(380)
      await appendLine('OVERRIDE ACCEPTED\n', {speed:20})
      await appendLine('TEMPORARY CLEARANCE GRANTED: LEVEL 2\n', {speed:20})
      await wait(360)

      // Phase 5: load project modules with occasional warn
      const proj = ['DOSSIER_ARCHIVE','SURVEILLANCE_CORE','FILE_SYSTEM','NETWORK_GRAPH','TIMELINE_ENGINE']
      for(let i=0;i<proj.length;i++){
        const name = proj[i]
        await appendLine(`LOADING MODULE: ${name}\n`, {speed:20})
        // small chance to show a latency warning on one line (simulate flicker)
        if(i === 2){
          await wait(180)
          await appendLine('[ WARN ] latency detected\n', {speed:20, className:'warn'})
        }
        await wait(140)
      }

      // Phase 6: final header
      await wait(240)
      await appendLine('-----------------------------------------\n', {speed:8})
      await appendLine('BLACKVAULT INFORMATION GRID\n', {speed:14})
      await appendLine('CLASSIFIED ACCESS INTERFACE\n', {speed:14})
      await appendLine('VERSION 3.7.12\n', {speed:14})
      await appendLine('-----------------------------------------\n', {speed:8})
      await wait(200)
      await appendLine('SYSTEM READY\n', {speed:20})
      await appendLine('PRESS ANY KEY TO CONTINUE\n', {speed:20})

      // now wait for key or click
      const onInput = ()=>finish()
      window.addEventListener('keydown', onInput, {once:true})
      container.addEventListener('click', onInput, {once:true})
    }

    // request override flow: user presses R to request, system issues a code, user enters code
    function requestOverrideFlow(){
      return new Promise(resolve=>{
        appendLine('ALTERNATIVE: REQUEST OVERRIDE CODE (PRESS R)\n', {speed:18, className:'warn'}).then(()=>{
          function onKey(e){
            if(e.key && e.key.toLowerCase() === 'r'){
              window.removeEventListener('keydown', onKey)
              proceedRequest()
            }
          }
          function onClick(){
            container.removeEventListener('click', onClick)
            window.removeEventListener('keydown', onKey)
            proceedRequest()
          }
          window.addEventListener('keydown', onKey)
          container.addEventListener('click', onClick)
          listeners.current.push(onKey)

          function proceedRequest(){
            appendLine('REQUEST SENT TO SECURITY OPERATIONS...\n', {speed:18}).then(()=>{
              // simulate processing time
              const t = setTimeout(()=>{
                const code = String(Math.floor(1000 + Math.random()*9000))
                appendLine('OVERRIDE CODE ISSUED\n', {speed:18})
                // debug output for local testing
                const dbg = document.createElement('div')
                dbg.className = 'boot-line debug-token'
                dbg.textContent = `DEBUG OVERRIDE CODE: ${code}`
                container.appendChild(dbg)
                container.scrollTop = container.scrollHeight
                const t2 = setTimeout(()=>{ dbg.remove() }, 3600)
                timers.current.push(t2)

                // now prompt for code entry
                const promptLine = document.createElement('div')
                promptLine.className = 'boot-line prompt-line'
                const prefix = document.createTextNode('ENTER OVERRIDE CODE: ')
                const userSpan = document.createElement('span')
                userSpan.className = 'user-input'
                const cursorSpan = document.createElement('span')
                cursorSpan.className = 'inline-cursor'
                cursorSpan.textContent = '_'
                promptLine.appendChild(prefix)
                promptLine.appendChild(userSpan)
                promptLine.appendChild(cursorSpan)
                container.appendChild(promptLine)
                container.scrollTop = container.scrollHeight

                let attempts = 0
                let buffer = ''
                function onKeyCode(e){
                  if(e.key === 'Backspace'){ e.preventDefault(); buffer = buffer.slice(0,-1); userSpan.textContent = buffer; container.scrollTop = container.scrollHeight; return }
                  if(e.key === 'Enter'){
                    e.preventDefault()
                    const entry = buffer.trim()
                    window.removeEventListener('keydown', onKeyCode)
                    promptLine.textContent = `ENTER OVERRIDE CODE: ${entry}\n`
                    container.scrollTop = container.scrollHeight
                    if(entry === code){ appendLine('OVERRIDE VERIFIED\n', {speed:18}).then(()=>resolve(true)) }
                    else {
                      attempts++
                      promptLine.classList.add('invalid')
                      appendLine('INVALID OVERRIDE CODE\n', {speed:18, className:'warn'}).then(()=>{
                        promptLine.classList.remove('invalid')
                        if(attempts >= 3){ appendLine('REQUEST DENIED\n', {speed:18, className:'warn'}).then(()=>resolve(false)) }
                        else { setTimeout(()=>{ buffer=''; const t3 = setTimeout(()=>{ requestOverrideFlow().then(resolve) }, 260); timers.current.push(t3) }, 260) }
                      })
                    }
                    return
                  }
                  if(e.key.length === 1 && /[0-9]/.test(e.key) && !e.ctrlKey && !e.metaKey){ buffer += e.key; userSpan.textContent = buffer; container.scrollTop = container.scrollHeight }
                }
                window.addEventListener('keydown', onKeyCode)
                listeners.current.push(onKeyCode)

              }, 1200)
              timers.current.push(t)
            })
          }
        })
      })
    }

    function finish(){
      // quick fade out + notify parent
      if(container) container.classList.add('boot-fade')
      const t = setTimeout(()=>{ onFinish && onFinish() }, 420)
      timers.current.push(t)
    }

    runSequence()

    return ()=>{
      // cleanup timers
      timers.current.forEach(t=>clearTimeout(t))
      timers.current = []
      // cleanup listeners
      listeners.current.forEach(fn=>window.removeEventListener('keydown', fn))
      listeners.current = []
    }
  },[onFinish])

  return (
    <div className="boot-overlay" ref={containerRef} aria-hidden="false"></div>
  )
}
