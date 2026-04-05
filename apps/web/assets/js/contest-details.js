/**
 * Contest Details Logic
 * Extracts URL search params, fetches specifics, and handles registration.
 */

let currentContestId = null;
let isTemporaryContest = false;
const TEMP_CONTEST_DETAILS = (window.CONTEST_MOCK_DATA && Array.isArray(window.CONTEST_MOCK_DATA.details))
    ? window.CONTEST_MOCK_DATA.details
    : [];

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');

    if (!idParam) {
        renderContestUI(TEMP_CONTEST_DETAILS[0], true);
        return;
    }

    if (isNaN(parseInt(idParam, 10))) {
        showErrorView();
        return;
    }

    currentContestId = parseInt(idParam, 10);
    await fetchAndRenderContest(currentContestId);

    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegistration);
    }
});

function showErrorView() {
    document.getElementById('loadingView').hidden = true;
    document.getElementById('contestDataView').hidden = true;
    document.getElementById('errorView').hidden = false;
}

async function fetchAndRenderContest(id) {
    try {
        const response = await apiGetContestById(id);

        if (response.success && response.data) {
            renderContestUI(response.data, false);
        } else {
            const tempContest = TEMP_CONTEST_DETAILS.find((contest) => contest.contest_id === id);
            if (tempContest) {
                renderContestUI(tempContest, true);
            } else {
                showErrorView();
            }
        }
    } catch (error) {
        const tempContest = TEMP_CONTEST_DETAILS.find((contest) => contest.contest_id === id);
        if (tempContest) {
            renderContestUI(tempContest, true);
        } else {
            showErrorView();
        }
        console.error(error);
    }
}

function renderContestUI(contest, isTemporary = false) {
    isTemporaryContest = isTemporary;
    document.getElementById('loadingView').hidden = true;
    document.getElementById('contestDataView').hidden = false;
    document.getElementById('errorView').hidden = true;

    document.getElementById('cTitle').textContent = contest.title;
    document.getElementById('cDesc').textContent = isTemporary
        ? `${contest.description} (donnees temporaires)`
        : contest.description;

    document.getElementById('cStart').textContent = new Date(contest.start_time).toLocaleString('fr-FR');
    document.getElementById('cEnd').textContent = new Date(contest.end_time).toLocaleString('fr-FR');

    const tbody = document.getElementById('problemsTbody');

    if (!contest.problems || contest.problems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">Aucun defi associe.</td></tr>';
        return;
    }

    const rows = contest.problems.map((problem) => `
      <tr>
          <td class="contest-problem-id">#${problem.problem_id}</td>
          <td class="contest-problem-name">${problem.name}</td>
          <td class="contest-problem-points">${problem.points} XP</td>
          <td>
              <span class="difficulty ${problem.difficulty_level}">${problem.difficulty_level}</span>
          </td>
      </tr>
    `);

    tbody.innerHTML = rows.join('');
}

async function handleRegistration() {
    const btn = document.getElementById('registerBtn');
    const msg = document.getElementById('registerMsg');

    if (isTemporaryContest) {
        msg.textContent = 'Mode demo: inscription non disponible sur les concours temporaires.';
        msg.style.color = '#854d0e';
        msg.hidden = false;
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Enregistrement...';
    msg.hidden = true;

    try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
            msg.textContent = 'Vous devez etre connecte pour participer.';
            msg.style.color = '#d32f2f';
            msg.hidden = false;
            btn.disabled = false;
            btn.textContent = "S'inscrire au Concours";
            return;
        }

        const result = await apiRegisterForContest(currentContestId);

        if (result.success) {
            msg.textContent = 'Vous etes inscrit au concours avec succes.';
            msg.style.color = '#166534';
            msg.hidden = false;
            btn.hidden = true;
        } else {
            msg.textContent = `Erreur: ${result.message || "Impossible de s'inscrire."}`;
            msg.style.color = '#d32f2f';
            msg.hidden = false;
            btn.disabled = false;
            btn.textContent = "S'inscrire au Concours";
        }
    } catch (error) {
        msg.textContent = 'Erreur reseau.';
        msg.style.color = '#d32f2f';
        msg.hidden = false;
        btn.disabled = false;
        btn.textContent = "S'inscrire au Concours";
    }
}
