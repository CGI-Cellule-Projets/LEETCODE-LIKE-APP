/**
 * Admin Access Protection
 * Checks if user is authenticated and has admin privileges
 * Redirects unauthorized users to centralized login page
 */

function checkAdminAccess() {
  const isLocalFile = window.location.protocol === 'file:';
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (!isLocalFile && !isLocalHost) {
    alert('Admin pages are available only on the local development machine.');
    window.location.href = '../index.html';
    return false;
  }

  console.log('Admin access limited to the local machine in development mode.');
  const token = localStorage.getItem('adminToken') || localStorage.getItem('token') || localStorage.getItem('auth_token');
  let adminLabel = token ? 'Authenticated Admin' : 'Local Admin';

  try {
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    if (userInfo && (userInfo.is_admin === true || userInfo.role === 'admin' || userInfo.level === 'admin')) {
      adminLabel = userInfo.username || userInfo.email || 'Admin';
    }
  } catch (error) {
    // Ignore invalid local user payloads
  }
  
  // Display admin username in navbar
  const adminUsernameElements = document.querySelectorAll('#adminUsername');
  adminUsernameElements.forEach(el => {
    el.textContent = adminLabel;
  });

  const adminActions = document.querySelector('.admin-actions');
  if (adminActions && !document.getElementById('userSpaceBtn')) {
    const userSpaceBtn = document.createElement('a');
    userSpaceBtn.id = 'userSpaceBtn';
    userSpaceBtn.className = 'btn btn-ghost';
    userSpaceBtn.href = '../apps/web/index.html';
    userSpaceBtn.textContent = 'Espace Utilisateur';
    adminActions.prepend(userSpaceBtn);
  }

  // Setup logout button
  const logoutBtns = document.querySelectorAll('#logoutBtn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('adminToken');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      window.location.href = '../index.html';
    });
  });

  return true;
}

// Run check when page loads and every 5 minutes
document.addEventListener('DOMContentLoaded', () => {
  checkAdminAccess();
});
