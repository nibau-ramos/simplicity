import { useEffect, useRef } from 'react'

const sentences = Array.from({ length: 50 }, (_, i) => `Hello World ${i + 1}`)
const tripled = [...sentences, ...sentences, ...sentences]

function App() {
  const containerRef = useRef(null)

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
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{ height: '100vh', overflowY: 'scroll', fontFamily: 'sans-serif', padding: '3rem 1rem' }}
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
