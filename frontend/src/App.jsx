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
  const cloneRef = useRef(null)
  const audioCtxRef = useRef(null)
  const lastItemRef = useRef(-1)
  const lastTickTimeRef = useRef(0)
  const [audioReady, setAudioReady] = useState(false)
  const [dark, setDark] = useState(false)
  const volumeStates = ['off', 'low', 'medium', 'normal']
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
  const selectedNRef = useRef(0)

  // measured after mount — used to position the indicator and clone
  const [indicatorH, setIndicatorH] = useState(0)
  const [cloneTopOffset, setCloneTopOffset] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    singleHeightRef.current = content.scrollHeight / 2

    const items = content.querySelectorAll('p')
    itemHRef.current = items[1].offsetTop - items[0].offsetTop
    item0CenterRef.current = items[0].offsetTop + items[0].offsetHeight / 2

    const iH = itemHRef.current
    const viewportH = container.clientHeight
    setIndicatorH(iH)
    setCloneTopOffset(-(viewportH / 2 - iH / 2))

    // initialise selectedN to whichever item is at centre on load
    selectedNRef.current = Math.round(
      (posRef.current + viewportH / 2 - item0CenterRef.current) / iH
    )

    const applyPos = () => {
      const H = singleHeightRef.current
      posRef.current = ((posRef.current % H) + H) % H
      const t = `translateY(${-posRef.current}px)`
      content.style.transform = t
      if (cloneRef.current) cloneRef.current.style.transform = t

      const itemH = H / sentences.length
      const item = Math.floor(posRef.current / itemH) % sentences.length
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

    const toPhase = (p) => {
      const viewportH = container.clientHeight
      return (p + viewportH / 2 - item0CenterRef.current) / itemHRef.current
    }

    const nToPos = (n) => {
      const H = singleHeightRef.current
      const viewportH = container.clientHeight
      return (((item0CenterRef.current + n * itemHRef.current - viewportH / 2) % H) + H) % H
    }

    const startMomentum = () => {
      const vel = velRef.current
      const H = singleHeightRef.current
      const BASE_FRICTION = 0.97

      // where would momentum naturally stop?
      const naturalStop = posRef.current + vel / (1 - BASE_FRICTION)
      const naturalN = Math.round(toPhase(naturalStop))

      // target: advance in scroll direction only if momentum carries past midpoint;
      // otherwise return to the currently selected item
      let targetN
      if (vel > 0) targetN = naturalN > selectedNRef.current ? naturalN : selectedNRef.current
      else         targetN = naturalN < selectedNRef.current ? naturalN : selectedNRef.current

      const target = nToPos(targetN)

      let dist = target - posRef.current
      if (dist >  H / 2) dist -= H
      if (dist < -H / 2) dist += H

      // adjust friction so vel/(1-f) = dist exactly
      let f = BASE_FRICTION
      if (Math.abs(dist) > Math.abs(vel) && Math.sign(dist) === Math.sign(vel)) {
        f = Math.max(0.88, Math.min(0.995, 1 - vel / dist))
      }

      const run = () => {
        velRef.current *= f
        posRef.current += velRef.current
        applyPos()
        if (Math.abs(velRef.current) < 0.08) {
          velRef.current = 0
          posRef.current = target
          selectedNRef.current = targetN
          applyPos()
          return
        }
        rafRef.current = requestAnimationFrame(run)
      }
      rafRef.current = requestAnimationFrame(run)
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
      if (Math.abs(velRef.current) < 0.5) {
        // barely moved — go back to selected item
        velRef.current = 0
        const target = nToPos(selectedNRef.current)
        let dist = target - posRef.current
        const H = singleHeightRef.current
        if (dist >  H / 2) dist -= H
        if (dist < -H / 2) dist += H
        velRef.current = dist * 0.18
      }
      startMomentum()
    }

    let wheelTimer = null
    const onWheel = (e) => {
      e.preventDefault()
      cancelAnimationFrame(rafRef.current)
      clearTimeout(wheelTimer)
      const delta = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY
      posRef.current += delta
      applyPos()
      wheelTimer = setTimeout(() => { velRef.current = 0; startMomentum() }, 80)
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

  const itemStyle = {
    fontSize: 'clamp(1rem, 5.5vw, 2.5rem)',
    fontWeight: '700',
    textAlign: 'center',
    margin: '1rem 0',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ position: 'relative', height: '100vh', background: bg, transition: 'background 0.3s' }}>
      {!audioReady && (
        <div onClick={unlockAudio} style={{
          position: 'absolute', inset: 0, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: dark ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(6px)',
          cursor: 'pointer', fontFamily: "'Courier New', Courier, monospace",
        }}>
          <p style={{ fontSize: '1.1rem', fontWeight: '700', letterSpacing: '0.05em', color: fg }}>
            tap to enable sound
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        style={{ position: 'relative', height: '100vh', overflow: 'hidden',
          fontFamily: "'Courier New', Courier, monospace", touchAction: 'none', userSelect: 'none' }}
      >
        {/* normal list */}
        <div ref={contentRef} style={{ padding: '3rem 1rem', willChange: 'transform' }}>
          {doubled.map((s, i) => (
            <p key={i} style={{ ...itemStyle, color: fg }}>{s}</p>
          ))}
        </div>

        {/* indicator: solid block clipping an inverted copy of the list */}
        {indicatorH > 0 && (
          <div style={{
            position: 'absolute', left: 0, right: 0,
            top: '50%', transform: 'translateY(-50%)',
            height: indicatorH,
            overflow: 'hidden',
            background: fg,
            pointerEvents: 'none',
            transition: 'background 0.3s',
          }}>
            <div ref={cloneRef} style={{
              position: 'absolute', top: cloneTopOffset, left: 0, right: 0,
              padding: '3rem 1rem', willChange: 'transform',
            }}>
              {doubled.map((s, i) => (
                <p key={i} style={{ ...itemStyle, color: bg }}>{s}</p>
              ))}
            </div>
          </div>
        )}
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
