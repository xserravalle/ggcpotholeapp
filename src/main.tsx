import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AccessibilityProvider } from './context/AccessibilityContext'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AccessibilityProvider>
        <App />
      </AccessibilityProvider>
    </AuthProvider>
  </StrictMode>,
)
