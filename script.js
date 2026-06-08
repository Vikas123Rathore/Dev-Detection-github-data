const searchBtn = document.getElementById('searchBtn');
const usernameInput = document.getElementById('username');
const resultDiv = document.getElementById('result');
const historyDiv = document.getElementById('history');

searchBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (!username) {
    alert('Enter username');
    return;
  }
  result(username);
});

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

// PAGE REFRESH
window.addEventListener('DOMContentLoaded', () => {
  renderHistory();
  const savedUser = JSON.parse(localStorage.getItem('githubUser'));
  if (savedUser) {
    showUser(savedUser);
  }
});
