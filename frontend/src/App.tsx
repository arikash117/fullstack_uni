import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Header from './layout/Header/Header'
import Footer from './layout/Footer/Footer'

import Register from './pages/Register/Register'
import LogIn from './pages/LogIn/LogIn'
import Dashboard from './pages/DashBoard/DashBoard'
import Home from './pages/Home/Home'
import Trainee from './pages/Trainee/Trainee'
import Edit from './pages/Trainee/Edit';
import AddTrainee from './pages/AddTrainee/AddTrainee'
import Health from './pages/Health/Health'
import Schedule from './pages/Schedule/Schedule'
import Progress from './pages/Progress/Progress'

import AdminMain from './pages/AdminMain/AdminMain'

import './App.css'

function App() {
  const { loading, isLoggedIn } = useAuth();

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="app">
      <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<LogIn />} />

          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminMain />
              </AdminRoute>
            }
          />

          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/trainee/add" 
            element={
              <ProtectedRoute>
                <AddTrainee />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/trainee/:id" 
            element={
              <ProtectedRoute>
                <Trainee />
              </ProtectedRoute>
            }
          />
          
          <Route 
            path="/trainee/:id/edit" 
            element={
              <ProtectedRoute>
                <Edit />
              </ProtectedRoute>
            } 
          />


          <Route path="/trainee/:id/health" element={<Health />} />
          <Route path="/trainee/:id/schedule" element={<Schedule />} />
          <Route path="/trainee/:id/progress" element={<Progress />} />
        </Routes>
      <Footer />
    </div>
  )
}

export default App
