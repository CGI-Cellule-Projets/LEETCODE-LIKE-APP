import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import AppErrorBoundary from '../components/AppErrorBoundary.jsx';
import AppStatusScreen from '../components/AppStatusScreen.jsx';
import './styles.css';

const AdminContentApp = lazy(() => import('./AdminContentApp'));

createRoot(document.getElementById('admin-root')).render(
  <StrictMode>
    <AppErrorBoundary
      actionHref="../index.html"
      actionLabel="Retour a l accueil"
      message="Recharge la page ou reviens au tableau de bord principal."
      title="Une erreur a interrompu l espace admin"
    >
      <Suspense
        fallback={(
          <AppStatusScreen
            title="Chargement de l espace admin"
            message="Recuperation des donnees, formulaires et raccourcis de moderation."
            actionHref="../index.html"
            actionLabel="Retour a l accueil"
          />
        )}
      >
        <AdminContentApp />
      </Suspense>
    </AppErrorBoundary>
  </StrictMode>
);
