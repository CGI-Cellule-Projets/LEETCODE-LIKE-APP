/**
 * Admin Dashboard
 * Loads and displays dashboard statistics and recent activity
 */
function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const statsResult = await apiAdminGetStats();
    if (statsResult.success && statsResult.data) {
      document.getElementById('totalProblems').textContent = String(statsResult.data.totalProblems ?? 0);
      document.getElementById('totalUsers').textContent = String(statsResult.data.totalUsers ?? 0);
      document.getElementById('totalSubmissions').textContent = String(statsResult.data.totalSubmissions ?? 0);
      document.getElementById('systemStatus').textContent = String(statsResult.data.systemStatus ?? 'ONLINE');
    }

    // Load recent activity
    loadRecentActivity();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    document.getElementById('totalProblems').textContent = '-';
    document.getElementById('totalUsers').textContent = '-';
    document.getElementById('totalSubmissions').textContent = '-';
    document.getElementById('systemStatus').textContent = 'OFFLINE';
    const activityNode = document.getElementById('activityList');
    if (activityNode) {
      activityNode.innerHTML = '<p class="error-message">Acces admin refuse ou API indisponible.</p>';
    }
  }
});

async function loadRecentActivity() {
  try {
    const activityList = document.getElementById('activityList');
    
    // Get recent problems (last 5)
    const problemsResult = await apiAdminGetProblems();
    
    if (problemsResult.success && problemsResult.data && problemsResult.data.length > 0) {
      const recentProblems = problemsResult.data
        .sort((a, b) => Number(b.problem_id || 0) - Number(a.problem_id || 0))
        .slice(0, 5);
      
      let html = '<div class="activity-items">';
      
      recentProblems.forEach(problem => {
        const createdDate = problem.created_at
          ? new Date(problem.created_at).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : `Problème #${problem.problem_id}`;
        
        html += `
          <div class="activity-item">
            <div class="activity-icon">PB</div>
            <div class="activity-content">
              <p><strong>${escapeHtml(problem.name)}</strong></p>
              <span class="activity-time">${createdDate}</span>
            </div>
            <span class="difficulty ${escapeHtml(problem.difficulty_level)}">${escapeHtml(problem.difficulty_level)}</span>
          </div>
        `;
      });
      
      html += '</div>';
      activityList.innerHTML = html;
    } else {
      activityList.innerHTML = '<p class="no-data">Aucune activité récente</p>';
    }
  } catch (error) {
    console.error('Error loading activity:', error);
    document.getElementById('activityList').innerHTML = '<p class="error-message">Erreur de chargement</p>';
  }
}


