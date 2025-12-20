import { useState } from 'react'
import Header from './layout/Header/Header'
import Footer from './layout/Footer/Footer'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <Header />
      <main className="main">
        <a href="https://music.yandex.ru/playlists/lk.d51c8a0a-fba8-4960-ae3d-e5b5d97fe131"  target="_blank">ссыль</a>
      </main>
      <Footer />
    </div>
  )
}

export default App
