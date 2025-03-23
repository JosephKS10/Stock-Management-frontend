import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CleanerAuthProvider } from './context/CleanerAuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CleanerAuthProvider>
      <App />
    </CleanerAuthProvider>
  </StrictMode>,
)
