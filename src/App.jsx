const sentences = Array.from({ length: 50 }, (_, i) => `Hello World ${i + 1}`)

function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      {sentences.map((s, i) => (
        <p key={i}>{s}</p>
      ))}
    </div>
  )
}

export default App
