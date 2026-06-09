const searchBtn = document.getElementById('searchBtn');
const usernameInput = document.getElementById('username');
const resultDiv = document.getElementById('result');
const historyDiv = document.getElementById('history');
const searchModeBtn = document.getElementById('searchModeBtn');
const battleModeBtn = document.getElementById('battleModeBtn');
const searchSection = document.getElementById('searchSection');
const battleSection = document.getElementById('battleSection');
const player1Input = document.getElementById('player1');
const player2Input = document.getElementById('player2');
const battleBtn = document.getElementById('battleBtn');
const battleResultDiv = document.getElementById('battleResult');

searchBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (!username) {
    alert('Enter username');
    return;
  }
  result(username);
});

// Mode toggle handlers
if (searchModeBtn && battleModeBtn && searchSection && battleSection) {
  searchModeBtn.addEventListener('click', () => {
    searchSection.classList.remove('hidden');
    battleSection.classList.add('hidden');
  });

  battleModeBtn.addEventListener('click', () => {
    searchSection.classList.add('hidden');
    battleSection.classList.remove('hidden');
  });
}

// helper: compute developer score from user data and repos array
function computeDevScore(userData = {}, repos = []) {
  const totalStars = Array.isArray(repos) ? repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0) : 0;
  const followers = userData.followers || 0;
  const following = userData.following || 0;
  const public_repos = userData.public_repos || 0;
  return Math.max(0, Math.round(followers * 3 + public_repos * 2 + totalStars * 4 - following));
}

function copyProfile(link) {
  navigator.clipboard.writeText(link);
  alert('Profile link copied');
}

function renderHistory() {
  const history = JSON.parse(localStorage.getItem('history')) || [];
  historyDiv.innerHTML = history
    .map(
      (user) => `
      <button
        class="bg-slate-800 px-3 py-1 rounded hover:bg-slate-700"
        onclick="result('${user}')"
      >
        ${user}
      </button>
    `
    )
    .join('');
}

async function result(username) {
  try {
    resultDiv.innerHTML = '<p class="text-center text-green-400">Loading...</p>';
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) {
      throw new Error(`User ${username} not found`);
    }
    const data = await res.json();
    localStorage.setItem('githubUser', JSON.stringify(data));

    let history = JSON.parse(localStorage.getItem('history')) || [];
    history = history.filter((user) => user !== data.login);
    history.unshift(data.login);
    history = history.slice(0, 5);
    localStorage.setItem('history', JSON.stringify(history));
    renderHistory();
    showUser(data);
    showRepos(data.repos_url);
  } catch (error) {
    resultDiv.innerHTML = `
      <div class="bg-red-900 p-4 rounded">
        User Not Found
      </div>
    `;
    console.error(error);
  }
}

function showUser(data) {
  resultDiv.innerHTML = `
    <div class="bg-slate-900 p-6 rounded-xl shadow-lg border border-gray-700">
      <div class="flex flex-col items-center md:flex-row gap-4">
        <img
          src="${data.avatar_url}"
          alt="${data.login}"
          class="w-24 h-24 rounded-full mx-auto mb-4"
        />
        <div class="text-xl font-bold mb-2">
          <h1>${data.name || data.login}</h1>
          <h4>@${data.login}</h4>
          <p>${data.bio || 'No bio available'}</p>
          <p>Joined: ${new Date(data.created_at).toLocaleDateString()}</p>
          <p>Followers: ${data.followers} | Following: ${data.following} | Repos: ${data.public_repos}</p>
          <div class="flex gap-3 mt-3">
            <a href="${data.html_url}" target="_blank" class="bg-green-500 px-3 py-1 rounded">
              Profile
            </a>
            <button onclick="copyProfile('${data.html_url}')" class="bg-blue-500 px-3 py-1 rounded">
              Copy Link
            </button>
          </div>
        </div>
      </div>
      <div id="devScore" class="mt-4 text-center">
        <h3 class="text-xl font-semibold text-green-300">Developer Score: <span id="devScoreValue">Calculating...</span></h3>
      </div>
      <div class = "flex flex-col md:flex-row gap-4 mt-4">
         <div class="bg-slate-800 p-4 rounded flex-1 rouded-3xl text-center ">
           <h3>Repos:${data.public_repos}</h3>
           </div>
         <div class="bg-slate-800 p-4 rounded flex-1  rounded flex-1 rouded-3xl text-center">
           <h3>Followers:${data.followers}</h3>
            </div>
          <div class="bg-slate-800 p-4 rounded flex-1  rounded flex-1 rouded-3xl text-center">
            <h3>Following:${data.following}</h3>
            </div>
        </div>
    </div>
  `;
}

// SHOW LATEST 5 REPOSITORIES

async function showRepos(reposUrl) {
  try {
    const repoRes = await fetch(
      `${reposUrl}?sort=updated&per_page=5`
    );

    const repos = await repoRes.json();

    // calculate developer score using stored user data + repo stars
    const savedUser = JSON.parse(localStorage.getItem('githubUser')) || {};
    const score = computeDevScore(savedUser, repos);
    const scoreEl = document.getElementById('devScoreValue');
    if (scoreEl) scoreEl.textContent = score;

    const repoHTML = `
      <div class="bg-slate-900 p-6 rounded-xl shadow-lg border border-gray-700 mt-4">
        <h2 class="text-2xl font-bold mb-4 underline">
          Latest Repositories
        </h2>

        ${repos
        .map(
          (repo) => `
            <div class="bg-slate-800 p-4 rounded-lg mb-3">

              <a
                href="${repo.html_url}"
                target="_blank"
                class="text-green-400 text-lg font-bold hover:underline"
              >
                ${repo.name}
              </a>

              <p class="text-gray-300 mt-2">
                ${repo.description || 'No description'}
              </p>

              <div class="flex gap-4 mt-2 text-sm text-gray-400">
                <span>⭐ ${repo.stargazers_count}</span>
                <span>🍴 ${repo.forks_count}</span>
                <span>${repo.language || 'N/A'}</span>
              </div>

            </div>
          `
        )
        .join('')}
      </div>
    `;

    resultDiv.innerHTML += repoHTML;
  } catch (error) {
    console.log(error);
  }
}

// BATTLE MODE: fetch both users and their repos, compute scores and render result
async function startBattle() {
  const p1 = player1Input.value.trim();
  const p2 = player2Input.value.trim();
  if (!p1 || !p2) {
    alert('Enter both player usernames');
    return;
  }

  battleResultDiv.innerHTML = '<p class="text-center text-green-400">Battling...</p>';

  try {
    const [res1, res2] = await Promise.all([
      fetch(`https://api.github.com/users/${p1}`),
      fetch(`https://api.github.com/users/${p2}`),
    ]);

    if (!res1.ok || !res2.ok) {
      throw new Error('One or both users not found');
    }

    const [user1, user2] = await Promise.all([res1.json(), res2.json()]);

    // fetch repos (up to 100) to compute stars
    const [repos1Res, repos2Res] = await Promise.all([
      fetch(`${user1.repos_url}?per_page=100`),
      fetch(`${user2.repos_url}?per_page=100`),
    ]);

    const [repos1, repos2] = await Promise.all([repos1Res.json(), repos2Res.json()]);

    const score1 = computeDevScore(user1, repos1);
    const score2 = computeDevScore(user2, repos2);

    let winnerText = 'Tie';
    if (score1 > score2) winnerText = `${user1.login} wins`;
    else if (score2 > score1) winnerText = `${user2.login} wins`;

    battleResultDiv.innerHTML = `
      <div class="bg-slate-900 p-4 rounded">
        <div class="flex gap-4 items-center">
          <div class="text-center">
            <img src="${user1.avatar_url}" class="w-20 h-20 rounded-full mx-auto" />
            <div class="font-bold mt-2">${user1.login}</div>
            <div class="text-green-300">Score: ${score1}</div>
          </div>
          <div class="text-xl font-bold">VS</div>
          <div class="text-center">
            <img src="${user2.avatar_url}" class="w-20 h-20 rounded-full mx-auto" />
            <div class="font-bold mt-2">${user2.login}</div>
            <div class="text-green-300">Score: ${score2}</div>
          </div>
        </div>
        <div class="mt-4 text-center text-lg font-semibold text-yellow-300">${winnerText}</div>
      </div>
    `;
  } catch (err) {
    console.error(err);
    battleResultDiv.innerHTML = `<div class="bg-red-900 p-3 rounded">Battle failed: ${err.message}</div>`;
  }
}

if (battleBtn) battleBtn.addEventListener('click', startBattle);

// PAGE REFRESH
window.addEventListener('DOMContentLoaded', () => {
  renderHistory();
  const savedUser = JSON.parse(localStorage.getItem('githubUser'));
  if (savedUser) {
    showUser(savedUser);
    // also fetch repos to compute dev score
    if (savedUser.repos_url) showRepos(savedUser.repos_url);
  }
});
