import { useEffect, useRef } from 'react'

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
        if (audioCtxRef.current) playTick(audioCtxRef.current)
      }
    }

    // init AudioContext on first user interaction
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
    }

    el.addEventListener('scroll', handleScroll)
    el.addEventListener('pointerdown', initAudio, { once: false })
    window.addEventListener('keydown', initAudio, { once: true })

    return () => {
      el.removeEventListener('scroll', handleScroll)
      el.removeEventListener('pointerdown', initAudio)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ height: '100vh', overflowY: 'scroll', fontFamily: "'Courier New', Courier, monospace", padding: '3rem 1rem' }}
    >
      {tripled.map((s, i) => (
        <p key={i} style={{
          fontSize: '2.5rem',
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
  )
}

export default App
