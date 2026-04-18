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

function getDifficultyMeta(value) {
  if (window.LLADifficulty?.getMeta) {
    return window.LLADifficulty.getMeta(value);
  }

  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'med' || normalized === 'medium' || normalized === 'moyen') {
    return { label: 'Moyen', className: 'medium' };
  }
  if (normalized === 'hard' || normalized === 'difficile') {
    return { label: 'Difficile', className: 'hard' };
  }
  return { label: 'Facile', className: 'easy' };
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
    loadRecentActivity(true);
  } catch (error) {
    console.error('Error loading dashboard:', error);
    const fallbackStats = window.LLADemoData?.adminStats;
    document.getElementById('totalProblems').textContent = String(fallbackStats?.totalProblems ?? '-');
    document.getElementById('totalUsers').textContent = String(fallbackStats?.totalUsers ?? '-');
    document.getElementById('totalSubmissions').textContent = String(fallbackStats?.totalSubmissions ?? '-');
    document.getElementById('systemStatus').textContent = fallbackStats?.systemStatus || 'DEMO';
    const activityNode = document.getElementById('activityList');
    if (activityNode) {
      activityNode.innerHTML = '<p class="loading-placeholder">Données de démonstration chargées. API indisponible.</p>';
    }
    loadRecentActivity(true);
  }
});

async function loadRecentActivity(useFallback = false) {
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
        const difficultyMeta = getDifficultyMeta(problem.difficulty_level);
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
            <span class="difficulty ${difficultyMeta.className}">${escapeHtml(difficultyMeta.label)}</span>
          </div>
        `;
      });
      
      html += '</div>';
      activityList.innerHTML = html;
    } else if (useFallback && Array.isArray(window.LLADemoData?.recentProblems)) {
      const recentProblems = window.LLADemoData.recentProblems.slice(0, 5);
      let html = '<div class="activity-items">';

      recentProblems.forEach(problem => {
        const difficultyMeta = getDifficultyMeta(problem.difficulty_level);
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
            <span class="difficulty ${difficultyMeta.className}">${escapeHtml(difficultyMeta.label)}</span>
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
    const activityList = document.getElementById('activityList');
    if (activityList) {
      if (Array.isArray(window.LLADemoData?.recentProblems)) {
        const recentProblems = window.LLADemoData.recentProblems.slice(0, 5);
        let html = '<div class="activity-items">';

        recentProblems.forEach(problem => {
          const difficultyMeta = getDifficultyMeta(problem.difficulty_level);
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
              <span class="difficulty ${difficultyMeta.className}">${escapeHtml(difficultyMeta.label)}</span>
            </div>
          `;
        });

        html += '</div>';
        activityList.innerHTML = html;
        return;
      }

      activityList.innerHTML = '<p class="error-message">Erreur de chargement</p>';
    }
  }
}


