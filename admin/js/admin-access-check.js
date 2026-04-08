/**
 * Admin Access Protection
 * Checks if user is authenticated and has admin privileges
 * Redirects unauthorized users to centralized login page
 */

async function checkAdminAccess() {
  const USER_SPACE_HREF = '../apps/web/problems.html';
  const USER_SPACE_LABEL = 'Espace Utilisateur';
  const isLocalFile = window.location.protocol === 'file:';
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

  if (!isLocalFile && !isLocalHost) {
    alert('Admin pages are available only on the local development machine.');
    window.location.href = '../apps/web/index.html';
    return false;
  }

  const runtimeFlags = typeof apiGetRuntimeFlags === 'function'
    ? await apiGetRuntimeFlags()
    : { success: false, allow_local_admin_bypass: false };
  const allowLocalBypass = Boolean(runtimeFlags.success && runtimeFlags.allow_local_admin_bypass);

  console.log('Admin access limited to the local machine in development mode.');
  const token = localStorage.getItem('auth_token');
  if (!token && !allowLocalBypass) {
    alert('Admin token required. Please sign in with an admin account.');
    window.location.href = '../apps/web/login.html';
    return false;
  }

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
  const logoutBtn = adminActions ? adminActions.querySelector('#logoutBtn') : null;
  const existingUserSpaceBtn = document.getElementById('userSpaceBtn');
  if (existingUserSpaceBtn) {
    existingUserSpaceBtn.className = 'btn btn-ghost';
    existingUserSpaceBtn.href = USER_SPACE_HREF;
    existingUserSpaceBtn.textContent = USER_SPACE_LABEL;
    if (logoutBtn && existingUserSpaceBtn.previousElementSibling !== logoutBtn) {
      logoutBtn.insertAdjacentElement('afterend', existingUserSpaceBtn);
    }
  } else if (adminActions) {
    const userSpaceBtn = document.createElement('a');
    userSpaceBtn.id = 'userSpaceBtn';
    userSpaceBtn.className = 'btn btn-ghost';
    userSpaceBtn.href = USER_SPACE_HREF;
    userSpaceBtn.textContent = USER_SPACE_LABEL;
    if (logoutBtn) {
      logoutBtn.insertAdjacentElement('afterend', userSpaceBtn);
    } else {
      adminActions.append(userSpaceBtn);
    }
  }

  // Setup logout button
  const logoutBtns = document.querySelectorAll('#logoutBtn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      window.location.replace('../apps/web/index.html');
    });
  });

  return true;
}

function applyStoredPreferences() {
  const root = document.documentElement;
  const body = document.body;
  const SETTINGS_KEY = 'algoforge-settings';
  const defaultSettings = {
    accent: 'sunset',
    theme: 'light',
    motion: true,
  };
  const accentPalette = {
    sunset: { accent: '#ff6b3d', accent2: '#ff9f1c', soft: 'rgba(255, 107, 61, 0.18)' },
    ocean: { accent: '#1f7fff', accent2: '#00b4d8', soft: 'rgba(31, 127, 255, 0.2)' },
    mint: { accent: '#14b884', accent2: '#9ad84b', soft: 'rgba(20, 184, 132, 0.2)' },
  };

  let settings = defaultSettings;

  try {
    const storedSettings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    settings = { ...defaultSettings, ...storedSettings };
  } catch (error) {
    settings = defaultSettings;
  }

  const palette = accentPalette[settings.accent] || accentPalette.sunset;
  root.style.setProperty('--accent', palette.accent);
  root.style.setProperty('--accent-2', palette.accent2);
  root.style.setProperty('--accent-soft', palette.soft);

  const accentMatch = palette.accent.match(/\w\w/g) || [];
  if (accentMatch.length === 3) {
    root.style.setProperty('--accent-rgb', accentMatch.map((value) => parseInt(value, 16)).join(', '));
  }

  body.classList.toggle('theme-night', settings.theme === 'night');
  body.classList.toggle('motion-off', !settings.motion);
}

// Run check when page loads and every 5 minutes
document.addEventListener('DOMContentLoaded', () => {
  applyStoredPreferences();
  checkAdminAccess();
});
