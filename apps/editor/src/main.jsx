import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ContestDetails from './components/contests/ContestDetails.jsx'

const params = new URLSearchParams(window.location.search)
const isContestView = params.get('view') === 'contest'
const RootComponent = isContestView ? ContestDetails : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
)

