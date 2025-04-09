import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CleanerAuthProvider } from './context/CleanerAuthContext.jsx'
import { AdminAuthProvider } from './context/AdminAuthContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
        <AdminAuthProvider>
    <CleanerAuthProvider>
      <App />
    </CleanerAuthProvider>
    </AdminAuthProvider>
  </StrictMode>,
)
