import { useEffect, useRef, useState } from 'react'

const sentences = Array.from({ length: 50 }, (_, i) => `Hello World ${String(i + 1).padStart(2, '0')}`)
const doubled = [...sentences, ...sentences]

function playTick(audioCtx) {
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1400, audioCtx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(700, audioCtx.currentTime + 0.025)
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime)
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

  const posRef = useRef(0)
  const velRef = useRef(0)
  const lastTouchYRef = useRef(0)
  const lastTouchTimeRef = useRef(0)
  const rafRef = useRef(null)
  const singleHeightRef = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    singleHeightRef.current = content.scrollHeight / 2

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
          playTick(audioCtxRef.current)
        }
      }
    }

    const momentum = () => {
      velRef.current *= 0.97
      if (Math.abs(velRef.current) < 0.1) { velRef.current = 0; return }
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
      posRef.current += dy
      lastTouchYRef.current = y
      lastTouchTimeRef.current = now
      applyPos()
    }

    const onTouchEnd = () => {
      rafRef.current = requestAnimationFrame(momentum)
    }

    const onWheel = (e) => {
      e.preventDefault()
      cancelAnimationFrame(rafRef.current)
      const delta = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY
      posRef.current += delta
      applyPos()
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
      <button
        onClick={() => setDark(d => !d)}
        style={{
          position: 'absolute', bottom: '1.5rem', right: '1.5rem', zIndex: 20,
          border: `2px solid ${fg}`,
          background: bg, color: fg,
          fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.05em',
          padding: '0.4rem 0.8rem', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.3s, color 0.3s, border-color 0.3s',
        }}
      >
        {dark ? 'light' : 'dark'}
      </button>
    </div>
  )
}

export default App
