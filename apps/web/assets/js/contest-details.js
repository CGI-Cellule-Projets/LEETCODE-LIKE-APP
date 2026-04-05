/**
 * Contest Details Logic
 * Extracts URL search params, fetches specifics, and handles Registration
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

    if (isNaN(parseInt(idParam))) {
        showErrorView();
        return;
    }

    currentContestId = parseInt(idParam);
    await fetchAndRenderContest(currentContestId);
    
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', handleRegistration);
    }
});

function showErrorView() {
    document.getElementById('loadingView').style.display = 'none';
    document.getElementById('contestDataView').style.display = 'none';
    document.getElementById('errorView').style.display = 'block';
}

async function fetchAndRenderContest(id) {
    try {
        const response = await apiGetContestById(id);
        
        if (response.success && response.data) {
            renderContestUI(response.data, false);
        } else {
            const tempContest = TEMP_CONTEST_DETAILS.find(c => c.contest_id === id);
            if (tempContest) {
                renderContestUI(tempContest, true);
            } else {
                showErrorView();
            }
        }
    } catch (err) {
        const tempContest = TEMP_CONTEST_DETAILS.find(c => c.contest_id === id);
        if (tempContest) {
            renderContestUI(tempContest, true);
        } else {
            showErrorView();
        }
        console.error(err);
    }
}

function renderContestUI(contest, isTemporary = false) {
    isTemporaryContest = isTemporary;
    document.getElementById('loadingView').style.display = 'none';
    document.getElementById('contestDataView').style.display = 'block';

    document.getElementById('cTitle').textContent = contest.title;
    document.getElementById('cDesc').textContent = isTemporary
        ? `${contest.description} (Données temporaires)`
        : contest.description;
    
    document.getElementById('cStart').textContent = new Date(contest.start_time).toLocaleString();
    document.getElementById('cEnd').textContent = new Date(contest.end_time).toLocaleString();

    const tbody = document.getElementById('problemsTbody');
    let html = '';

    if (!contest.problems || contest.problems.length === 0) {
        html = '<tr><td colspan="4" class="no-data">Aucun défi associé.</td></tr>';
    } else {
        contest.problems.forEach(p => {
            html += `
              <tr>
                  <td class="contest-problem-id">#${p.problem_id}</td>
                  <td class="contest-problem-name">${p.name}</td>
                  <td class="contest-problem-points">${p.points} XP</td>
                  <td>
                      <span class="difficulty ${p.difficulty_level}">${p.difficulty_level}</span>
                  </td>
              </tr>
            `;
        });
    }

    tbody.innerHTML = html;
}

async function handleRegistration() {
    const btn = document.getElementById('registerBtn');
    const msg = document.getElementById('registerMsg');

    if (isTemporaryContest) {
        msg.textContent = 'Mode démo: inscription non disponible sur les concours temporaires.';
        msg.style.color = '#854d0e';
        msg.style.display = 'block';
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Enregistrement...';
    msg.style.display = 'none';

    try {
        // Requires user to be logged in
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        if (!token) {
            msg.textContent = '❌ Vous devez être connecté (via Inscription) pour participer.';
            msg.style.color = '#d32f2f';
            msg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = "S'inscrire au Tournoi";
            return;
        }

        const res = await apiRegisterForContest(currentContestId);
        
        if (res.success) {
            msg.textContent = '✓ Vous êtes inscrit au concours avec succès !';
            msg.style.color = '#166534';
            msg.style.display = 'block';
            btn.style.display = 'none';
        } else {
            msg.textContent = `❌ Erreur : ${res.message || 'Impossible de s\'inscrire.'}`;
            msg.style.color = '#d32f2f';
            msg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = "S'inscrire au Tournoi";
        }
    } catch (err) {
        msg.textContent = '❌ Erreur de réseau';
        msg.style.color = '#d32f2f';
        msg.style.display = 'block';
        btn.disabled = false;
        btn.textContent = "S'inscrire au Tournoi";
    }
}
