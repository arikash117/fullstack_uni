import { useState } from 'react'
import Header from './layout/Header/Header'
import Footer from './layout/Footer/Footer'
import './App.css'

import Goal from "./assets/goal.svg";
import Training from "./assets/main-training.svg";
import Tracking from "./assets/tracking.svg";

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <Header />
      <main className="main">

        <h1 className="heading">Попробуйте этот веб-сервис для отслеживания прогресса вашего трейни!</h1>
        
        <div className="content-wrapper">
          <div className="features">
          <div className="feature-card">
            <img src={Training} alt="goal-icon" className="feature-icon"/>
            <p>Ведите дневник ежедневных тренировок</p>
          </div>
          <div className="feature-card">
            <img src={Tracking} alt="goal-icon" className="feature-icon"/>
            <p>Фиксируйте данные о здоровье: КБЖУ, травмы и другое</p>
          </div>
          <div className="feature-card">
            <img src={Goal} alt="goal-icon" className="feature-icon"/>
            <p>Отслеживайте прогресс и изменение целей</p>
          </div>
        </div>

        <button className="start-button">Начать работу</button>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
