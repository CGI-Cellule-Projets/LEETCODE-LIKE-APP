import './AppStatusScreen.css';

export default function AppStatusScreen({
  title,
  message,
  actionHref = '../index.html',
  actionLabel = 'Retour a l accueil',
}) {
  return (
    <main className="app-status-screen" role="status">
      <div className="app-status-card">
        <p className="app-status-eyebrow">LLA Workspace</p>
        <h1>{title}</h1>
        <p>{message}</p>
        <a href={actionHref} className="app-status-link">
          {actionLabel}
        </a>
      </div>
    </main>
  );
}
