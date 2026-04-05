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
    // Load all problems
    const problemsResult = await apiAdminGetProblems();
    
    if (problemsResult.success && problemsResult.data) {
      const totalProblems = problemsResult.data.length;
      document.getElementById('totalProblems').textContent = totalProblems;
      
      // Calculate difficulty breakdown
      const easyCount = problemsResult.data.filter(p => p.difficulty_level === 'easy').length;
      const mediumCount = problemsResult.data.filter(p => p.difficulty_level === 'med').length;
      const hardCount = problemsResult.data.filter(p => p.difficulty_level === 'hard').length;
      
      console.log(`Problems - Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount}`);
    }
    
    // Simulate user count (you might want to add a dedicated endpoint for this)
    document.getElementById('totalUsers').textContent = 'N/A';
    
    // Simulate submissions count (you might want to add a dedicated endpoint for this)
    document.getElementById('totalSubmissions').textContent = 'N/A';
    
    // System status
    const healthCheck = await apiHealthCheck();
    const systemStatus = healthCheck.success ? '✓' : '✗';
    document.getElementById('systemStatus').textContent = systemStatus;
    
    // Load recent activity
    loadRecentActivity();
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
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
            <div class="activity-icon">📚</div>
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

