let leaderboardContestId = null;
let leaderboardTimerId = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readUserInfo() {
  try {
    return JSON.parse(localStorage.getItem('user_info') || '{}');
  } catch {
    return {};
  }
}

function toDateLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }
  return date.toLocaleString('fr-FR');
}

function secondsBetween(nowMs, targetMs) {
  return Math.max(0, Math.ceil((targetMs - nowMs) / 1000));
}

function formatTimer(totalSeconds) {
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function stopTimer() {
  if (leaderboardTimerId) {
    window.clearInterval(leaderboardTimerId);
    leaderboardTimerId = null;
  }
}

function renderTimer(contest) {
  const timerBadge = document.getElementById('timerBadge');
  if (!timerBadge) return;

  const startMs = new Date(contest.start_time).getTime();
  const endMs = new Date(contest.end_time).getTime();

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    timerBadge.textContent = 'Timer: --:--:--';
    return;
  }

  const updateTimer = () => {
    const nowMs = Date.now();

    if (nowMs < startMs) {
      const left = secondsBetween(nowMs, startMs);
      timerBadge.textContent = `Debut dans ${formatTimer(left)}`;
      return;
    }

    if (nowMs <= endMs) {
      const left = secondsBetween(nowMs, endMs);
      timerBadge.textContent = `Temps restant ${formatTimer(left)}`;
      return;
    }

    timerBadge.textContent = 'Concours termine';
    stopTimer();
  };

  stopTimer();
  updateTimer();
  leaderboardTimerId = window.setInterval(updateTimer, 1000);
}

function renderRows(entries) {
  const tbody = document.getElementById('leaderboardTbody');
  const userInfo = readUserInfo();
  const currentName = String(userInfo.username || '').toLowerCase();

  if (!tbody) return;

  if (!entries || entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="no-data">Aucune donnee de classement.</td></tr>';
    return;
  }

  const normalized = [...entries]
    .map((entry, idx) => ({
      username: String(entry.username || 'participant'),
      score_total: Number(entry.score_total || 0),
      temps_de_resolution: String(entry.temps_de_resolution || '--'),
      rank: Number(entry.rank || idx + 1)
    }))
    .sort((a, b) => Number(a.rank) - Number(b.rank) || Number(b.score_total) - Number(a.score_total))
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  tbody.innerHTML = normalized.map((entry) => {
    const isCurrentUser = currentName && entry.username.toLowerCase() === currentName;
    const suffix = isCurrentUser ? ' (Vous)' : '';
    return `
      <tr>
        <td>#${escapeHtml(entry.rank)}</td>
        <td>${escapeHtml(entry.username)}${escapeHtml(suffix)}</td>
        <td>${escapeHtml(entry.score_total)}</td>
        <td>${escapeHtml(entry.temps_de_resolution)}</td>
      </tr>
    `;
  }).join('');
}

function showError() {
  stopTimer();
  document.getElementById('leaderboardLoading').hidden = true;
  document.getElementById('leaderboardView').hidden = true;
  document.getElementById('leaderboardError').hidden = false;
}

function showLoaded(contest, entries) {
  document.getElementById('leaderboardLoading').hidden = true;
  document.getElementById('leaderboardError').hidden = true;
  document.getElementById('leaderboardView').hidden = false;

  const title = document.getElementById('leaderboardTitle');
  const subtitle = document.getElementById('leaderboardSubtitle');
  const startNode = document.getElementById('lbStart');
  const endNode = document.getElementById('lbEnd');
  const backLink = document.getElementById('backToContestLink');

  title.textContent = `Leaderboard - ${contest.title || 'Concours'}`;
  subtitle.textContent = 'Classement live de la session en cours.';
  startNode.textContent = toDateLabel(contest.start_time);
  endNode.textContent = toDateLabel(contest.end_time);
  if (leaderboardContestId && backLink) {
    backLink.href = `contest-details.html?id=${leaderboardContestId}`;
  }

  renderRows(entries);
  renderTimer(contest);
}

async function fetchContest(contestId) {
  const apiResult = await apiGetContestById(contestId);
  if (apiResult.success && apiResult.data) {
    return apiResult.data;
  }
  return null;
}

async function fetchLeaderboardEntries(contestId) {
  const response = await apiGetContestLeaderboard(contestId);
  if (response && response.success && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const idParam = urlParams.get('id');
  const contestId = Number(idParam);

  if (!idParam || Number.isNaN(contestId)) {
    showError();
    return;
  }

  leaderboardContestId = contestId;

  try {
    const contest = await fetchContest(contestId);
    if (!contest) {
      showError();
      return;
    }

    const entries = await fetchLeaderboardEntries(contestId);
    showLoaded(contest, entries);
  } catch (error) {
    console.error(error);
    showError();
  }
});

window.addEventListener('beforeunload', stopTimer);
