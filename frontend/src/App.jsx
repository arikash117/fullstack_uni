import { Routes, Route } from 'react-router-dom'
import Header from './layout/Header/Header'
import Footer from './layout/Footer/Footer'

import Register from './pages/Register/Register';
import Dashboard from './pages/DashBoard/DashBoard';
import Home from './pages/Home/Home' 

import './App.css'

function App() {
  return (
    <div className="app">
      <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      <Footer />
    </div>
  )
}

export default App
