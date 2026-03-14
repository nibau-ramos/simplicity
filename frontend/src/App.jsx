import { useEffect, useRef, useState } from 'react'

const sentences = Array.from({ length: 50 }, (_, i) => `Hello World ${String(i + 1).padStart(2, '0')}`)
const tripled = [...sentences, ...sentences, ...sentences]

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
  const audioCtxRef = useRef(null)
  const lastItemRef = useRef(-1)
  const lastTickTimeRef = useRef(0)
  const [audioReady, setAudioReady] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    const oneThird = el.scrollHeight / 3
    el.scrollTop = oneThird

    const handleScroll = () => {
      const { scrollTop, scrollHeight } = el
      const third = scrollHeight / 3

      if (scrollTop >= third * 2) {
        el.scrollTop = scrollTop - third
      } else if (scrollTop < third) {
        el.scrollTop = scrollTop + third
      }

      // play tick when crossing into a new item
      const itemHeight = scrollHeight / tripled.length
      const currentItem = Math.round(el.scrollTop / itemHeight)
      if (currentItem !== lastItemRef.current) {
        lastItemRef.current = currentItem
        const now = performance.now()
        if (audioCtxRef.current && now - lastTickTimeRef.current >= 30) {
          lastTickTimeRef.current = now
          playTick(audioCtxRef.current)
        }
      }
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  const unlockAudio = async () => {
    const ctx = new AudioContext()
    await ctx.resume()
    audioCtxRef.current = ctx
    setAudioReady(true)
  }

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      {!audioReady && (
        <div
          onClick={unlockAudio}
          style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)',
            cursor: 'pointer', fontFamily: "'Courier New', Courier, monospace",
          }}
        >
          <span style={{ fontSize: '3rem' }}>🔊</span>
          <p style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '1rem', letterSpacing: '0.05em' }}>
            tap to enable sound
          </p>
        </div>
      )}
    <div
      ref={containerRef}
      style={{ height: '100vh', overflowY: 'scroll', fontFamily: "'Courier New', Courier, monospace", padding: '3rem 1rem' }}
    >
      {tripled.map((s, i) => (
        <p key={i} style={{
          fontSize: 'clamp(1rem, 5.5vw, 2.5rem)',
          whiteSpace: 'nowrap',
          fontWeight: '700',
          textAlign: 'center',
          margin: '1rem 0',
          letterSpacing: '0.05em',
          color: '#111',
        }}>
          {s}
        </p>
      ))}
    </div>
    </div>
  )
}

export default App
