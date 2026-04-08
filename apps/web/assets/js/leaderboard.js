let leaderboardContestId = null;
let leaderboardTimerId = null;
let leaderboardAllowDevFallback = false;

const TEMP_CONTEST_DETAILS = (window.CONTEST_MOCK_DATA && Array.isArray(window.CONTEST_MOCK_DATA.details))
  ? window.CONTEST_MOCK_DATA.details
  : [];

const FALLBACK_USERS = ['nina', 'omar', 'yasmine', 'karim', 'sara', 'ilyas', 'amal', 'younes'];

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

function scoreSeed(baseId, rank) {
  return (baseId * 41 + rank * 113) % 170;
}

function buildFallbackEntries(contest) {
  const baseId = Number(contest.contest_id || 1000);
  const generated = FALLBACK_USERS.map((username, idx) => {
    const rank = idx + 1;
    const score = 920 - idx * 55 + scoreSeed(baseId, rank);
    const minutes = 18 + idx * 2;
    const seconds = (scoreSeed(baseId + rank, idx + 3) % 60);

    return {
      username,
      rank,
      score_total: Math.max(60, score),
      temps_de_resolution: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    };
  });

  return generated.sort((a, b) => Number(b.score_total) - Number(a.score_total));
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
  const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
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
        <td>#${entry.rank}</td>
        <td>${entry.username}${suffix}</td>
        <td>${entry.score_total}</td>
        <td>${entry.temps_de_resolution}</td>
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

function showLoaded(contest, entries, temporaryMode = false) {
  document.getElementById('leaderboardLoading').hidden = true;
  document.getElementById('leaderboardError').hidden = true;
  document.getElementById('leaderboardView').hidden = false;

  const title = document.getElementById('leaderboardTitle');
  const subtitle = document.getElementById('leaderboardSubtitle');
  const startNode = document.getElementById('lbStart');
  const endNode = document.getElementById('lbEnd');
  const backLink = document.getElementById('backToContestLink');

  title.textContent = `Leaderboard - ${contest.title || 'Concours'}`;
  subtitle.textContent = temporaryMode
    ? 'Mode demo local actif: classement genere automatiquement.'
    : 'Classement live de la session en cours.';
  startNode.textContent = toDateLabel(contest.start_time);
  endNode.textContent = toDateLabel(contest.end_time);
  if (leaderboardContestId && backLink) {
    backLink.href = `contest-details.html?id=${leaderboardContestId}`;
  }

  renderRows(entries);
  renderTimer(contest);
}

async function fetchContestWithFallback(contestId) {
  const apiResult = await apiGetContestById(contestId);
  if (apiResult.success && apiResult.data) {
    return { contest: apiResult.data, temporaryMode: false };
  }

  if (leaderboardAllowDevFallback) {
    const tempContest = TEMP_CONTEST_DETAILS.find((item) => Number(item.contest_id) === Number(contestId));
    if (tempContest) {
      return { contest: tempContest, temporaryMode: true };
    }
  }

  return null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const idParam = urlParams.get('id');
  const contestId = Number(idParam);

  const flags = await apiGetRuntimeFlags();
  leaderboardAllowDevFallback = Boolean(flags && flags.success && flags.dev_demo_mode);

  if (!idParam || Number.isNaN(contestId)) {
    showError();
    return;
  }

  leaderboardContestId = contestId;

  try {
    const payload = await fetchContestWithFallback(contestId);
    if (!payload || !payload.contest) {
      showError();
      return;
    }

    const entries = buildFallbackEntries(payload.contest);
    showLoaded(payload.contest, entries, payload.temporaryMode);
  } catch (error) {
    console.error(error);
    showError();
  }
});

window.addEventListener('beforeunload', stopTimer);
