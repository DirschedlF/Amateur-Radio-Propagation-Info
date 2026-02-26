import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import PropagationDashboard from './PropagationDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PropagationDashboard />
  </StrictMode>,
)
