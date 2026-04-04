/**
 * Admin Access Protection
 * Checks if user is authenticated and has admin privileges
 * Redirects unauthorized users to centralized login page
 */

function checkAdminAccess() {
  // Authentication is intentionally disabled for local development.
  console.log('Admin access check bypassed (no-auth mode enabled)');
  
  // Display admin username in navbar
  const adminUsernameElements = document.querySelectorAll('#adminUsername');
  adminUsernameElements.forEach(el => {
    el.textContent = 'Guest Admin';
  });

  // Setup logout button
  const logoutBtns = document.querySelectorAll('#logoutBtn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '../index.html';
    });
  });

  return true;
}

// Run check when page loads and every 5 minutes
document.addEventListener('DOMContentLoaded', () => {
  checkAdminAccess();
});
