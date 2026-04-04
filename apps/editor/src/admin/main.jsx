import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AdminContentApp from './AdminContentApp';
import './styles.css';

createRoot(document.getElementById('admin-root')).render(
  <StrictMode>
    <AdminContentApp />
  </StrictMode>
);
