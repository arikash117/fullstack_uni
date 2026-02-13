import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.js'
import './index.css'
import App from './App'

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found!');
}
createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
