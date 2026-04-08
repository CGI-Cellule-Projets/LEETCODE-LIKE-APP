let allUsers = [];

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('fr-FR');
}

function applyStats(stats) {
  document.getElementById('usersTotal').textContent = String(stats.totalUsers || 0);
  document.getElementById('usersAdmins').textContent = String(stats.totalAdmins || 0);
  document.getElementById('usersActive24h').textContent = String(stats.active24h || 0);
  document.getElementById('usersSuspended').textContent = String(stats.suspended || 0);
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (!Array.isArray(users) || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-data">Aucun utilisateur trouve.</td></tr>';
    return;
  }

  tbody.innerHTML = users.map((user) => {
    const role = user.is_admin ? 'Admin' : 'User';
    return `
      <tr>
        <td class="problem-name">${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${role}</td>
        <td>${escapeHtml(user.user_level || 'beginner')}</td>
        <td>${Number(user.submissions_count || 0)}</td>
        <td class="contest-date">${formatDate(user.last_activity)}</td>
      </tr>
    `;
  }).join('');
}

function applyFilters() {
  const query = (document.getElementById('userSearch')?.value || '').trim().toLowerCase();
  const roleFilter = document.getElementById('roleFilter')?.value || '';

  const filtered = allUsers.filter((user) => {
    const username = String(user.username || '').toLowerCase();
    const email = String(user.email || '').toLowerCase();
    const role = user.is_admin ? 'admin' : 'user';

    const matchesSearch = !query || username.includes(query) || email.includes(query);
    const matchesRole = !roleFilter || role === roleFilter;

    return matchesSearch && matchesRole;
  });

  renderUsers(filtered);
}

async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="6" class="loading-placeholder">Chargement des utilisateurs...</td></tr>';
  }

  const result = await apiAdminGetUsers();
  if (!result.success || !result.data) {
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" class="error-message">Impossible de charger les utilisateurs.</td></tr>';
    }
    return;
  }

  allUsers = Array.isArray(result.data.users) ? result.data.users : [];
  applyStats(result.data.stats || {});
  applyFilters();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('userSearch')?.addEventListener('input', applyFilters);
  document.getElementById('roleFilter')?.addEventListener('change', applyFilters);
  loadUsers();
});
