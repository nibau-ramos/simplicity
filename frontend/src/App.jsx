import { useEffect, useRef, useState } from 'react'

const sentences = Array.from({ length: 50 }, (_, i) => `Hello World ${String(i + 1).padStart(2, '0')}`)
const doubled = [...sentences, ...sentences]

function playTick(audioCtx, gainValue) {
  if (gainValue === 0) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1400, audioCtx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.025)
  gain.gain.setValueAtTime(gainValue, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04)
  osc.start(audioCtx.currentTime)
  osc.stop(audioCtx.currentTime + 0.04)
}

function App() {
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const audioCtxRef = useRef(null)
  const lastItemRef = useRef(-1)
  const lastTickTimeRef = useRef(0)
  const [audioReady, setAudioReady] = useState(false)
  const [dark, setDark] = useState(false)
  const volumeStates = ['off', 'low', 'medium', 'normal']
  const volumeGains  = { off: 0, low: 0.04, medium: 0.08, normal: 0.12 }
  const [volumeIdx, setVolumeIdx] = useState(1)
  const volumeIdxRef = useRef(1)

  const posRef = useRef(0)
  const velRef = useRef(0)
  const lastTouchYRef = useRef(0)
  const lastTouchTimeRef = useRef(0)
  const rafRef = useRef(null)
  const singleHeightRef = useRef(0)
  const itemHRef = useRef(0)
  const item0CenterRef = useRef(0)
  const lastDirRef = useRef(1)

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    singleHeightRef.current = content.scrollHeight / 2

    // measure item dimensions from DOM — unaffected by CSS transform
    const items = content.querySelectorAll('p')
    itemHRef.current = items[1].offsetTop - items[0].offsetTop
    item0CenterRef.current = items[0].offsetTop + items[0].offsetHeight / 2

    const applyPos = () => {
      const H = singleHeightRef.current
      // seamless wrap using modulo — no visual jump, ever
      posRef.current = ((posRef.current % H) + H) % H
      content.style.transform = `translateY(${-posRef.current}px)`

      const itemHeight = H / sentences.length
      const item = Math.floor(posRef.current / itemHeight) % sentences.length
      if (item !== lastItemRef.current) {
        lastItemRef.current = item
        const now = performance.now()
        if (audioCtxRef.current && now - lastTickTimeRef.current >= 30) {
          lastTickTimeRef.current = now
          const gains = { off: 0, low: 0.04, medium: 0.08, normal: 0.12 }
          const states = ['off', 'low', 'medium', 'normal']
          playTick(audioCtxRef.current, gains[states[volumeIdxRef.current]])
        }
      }
    }

    const snapToNearest = (dir) => {
      const H = singleHeightRef.current
      const itemH = itemHRef.current
      const item0Center = item0CenterRef.current
      const viewportH = container.clientHeight

      // content position currently at viewport center
      const contentCenterPos = posRef.current + viewportH / 2
      const phase = (contentCenterPos - item0Center) / itemH

      // snap in scroll direction: ceil when going down, floor when going up
      const n = dir > 0
        ? Math.ceil(phase - 1e-6)
        : Math.floor(phase + 1e-6)

      const targetContentPos = item0Center + n * itemH
      let target = (((targetContentPos - viewportH / 2) % H) + H) % H

      const animateSnap = () => {
        let diff = target - posRef.current
        if (diff >  H / 2) diff -= H
        if (diff < -H / 2) diff += H
        if (Math.abs(diff) < 0.3) {
          posRef.current = target
          applyPos()
          return
        }
        posRef.current += diff * 0.2
        applyPos()
        rafRef.current = requestAnimationFrame(animateSnap)
      }
      rafRef.current = requestAnimationFrame(animateSnap)
    }

    const momentum = () => {
      velRef.current *= 0.97
      if (Math.abs(velRef.current) < 0.5) {
        velRef.current = 0
        snapToNearest(lastDirRef.current)
        return
      }
      lastDirRef.current = velRef.current > 0 ? 1 : -1
      posRef.current += velRef.current
      applyPos()
      rafRef.current = requestAnimationFrame(momentum)
    }

    const onTouchStart = (e) => {
      cancelAnimationFrame(rafRef.current)
      velRef.current = 0
      lastTouchYRef.current = e.touches[0].clientY
      lastTouchTimeRef.current = performance.now()
    }

    const onTouchMove = (e) => {
      e.preventDefault()
      const y = e.touches[0].clientY
      const now = performance.now()
      const dt = Math.max(now - lastTouchTimeRef.current, 1)
      const dy = lastTouchYRef.current - y
      velRef.current = (dy / dt) * 16
      if (dy !== 0) lastDirRef.current = dy > 0 ? 1 : -1
      posRef.current += dy
      lastTouchYRef.current = y
      lastTouchTimeRef.current = now
      applyPos()
    }

    const onTouchEnd = () => {
      rafRef.current = requestAnimationFrame(momentum)
    }

    let wheelTimer = null
    const onWheel = (e) => {
      e.preventDefault()
      cancelAnimationFrame(rafRef.current)
      clearTimeout(wheelTimer)
      const delta = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY
      if (delta !== 0) lastDirRef.current = delta > 0 ? 1 : -1
      posRef.current += delta
      applyPos()
      wheelTimer = setTimeout(() => snapToNearest(lastDirRef.current), 80)
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: false })
    container.addEventListener('touchend', onTouchEnd)
    container.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const unlockAudio = async () => {
    const ctx = new AudioContext()
    await ctx.resume()
    audioCtxRef.current = ctx
    setAudioReady(true)
  }

  const bg = dark ? '#111' : '#fff'
  const fg = dark ? '#fff' : '#111'

  return (
    <div style={{ position: 'relative', height: '100vh', background: bg, transition: 'background 0.3s, color 0.3s' }}>
      {!audioReady && (
        <div onClick={unlockAudio} style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: dark ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.92)',
          color: fg,
          backdropFilter: 'blur(6px)',
          cursor: 'pointer', fontFamily: "'Courier New', Courier, monospace",
        }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '0.05em' }}>
            tap to enable sound
          </p>
        </div>
      )}
      {/* center selection indicator */}
      <div style={{
        position: 'fixed', top: '50%', left: 0, right: 0, zIndex: 10,
        transform: 'translateY(-50%)',
        height: 'calc(clamp(1rem, 5.5vw, 2.5rem) * 1.2 + 2rem)',
        borderTop: `2px solid ${fg}`,
        borderBottom: `2px solid ${fg}`,
        pointerEvents: 'none',
        transition: 'border-color 0.3s',
      }} />
      <div
        ref={containerRef}
        style={{
          height: '100vh',
          overflow: 'hidden',
          fontFamily: "'Courier New', Courier, monospace",
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div ref={contentRef} style={{ padding: '3rem 1rem', willChange: 'transform' }}>
          {doubled.map((s, i) => (
            <p key={i} style={{
              fontSize: 'clamp(1rem, 5.5vw, 2.5rem)',
              fontWeight: '700',
              textAlign: 'center',
              margin: '1rem 0',
              letterSpacing: '0.05em',
              color: fg,
              whiteSpace: 'nowrap',
            }}>
              {s}
            </p>
          ))}
        </div>
      </div>
      <div style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 30,
        display: 'flex', gap: '0.5rem',
        fontFamily: "'Courier New', Courier, monospace",
      }}>
        {[
          { label: dark ? 'light' : 'dark', onClick: () => setDark(d => !d) },
          { label: volumeStates[volumeIdx], onClick: () => {
            const next = (volumeIdx + 1) % volumeStates.length
            setVolumeIdx(next)
            volumeIdxRef.current = next
          }},
          { label: 'refresh', onClick: () => window.location.reload() },
        ].map(({ label, onClick }, i) => (
          <button key={i} onClick={onClick} style={{
            border: `2px solid ${fg}`,
            background: bg, color: fg,
            fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em',
            padding: '0.6rem 1rem', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.3s, color 0.3s, border-color 0.3s',
          }}>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default App
