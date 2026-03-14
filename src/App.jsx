const sentences = Array.from({ length: 50 }, (_, i) => `Hello World ${i + 1}`)

function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '3rem 1rem' }}>
      {sentences.map((s, i) => (
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
