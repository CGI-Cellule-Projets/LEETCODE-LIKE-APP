import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'
import AppStatusScreen from './components/AppStatusScreen.jsx'

const App = lazy(() => import('./App.jsx'))
const ContestDetails = lazy(() => import('./components/contests/ContestDetails.jsx'))

const params = new URLSearchParams(window.location.search)
const isContestView = params.get('view') === 'contest'
const RootComponent = isContestView ? ContestDetails : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary
      actionHref="../problems.html"
      actionLabel="Retour aux problemes"
      message="Recharge la page ou reviens au catalogue pour reprendre la session."
      title="Une erreur a interrompu l interface"
    >
      <Suspense
        fallback={(
          <AppStatusScreen
            title="Chargement de l espace de code"
            message="Preparation de l editeur, des tests et des donnees du probleme."
            actionHref="../problems.html"
            actionLabel="Retour aux problemes"
          />
        )}
      >
        <RootComponent />
      </Suspense>
    </AppErrorBoundary>
  </StrictMode>,
)

