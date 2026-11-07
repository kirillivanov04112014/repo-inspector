const form = document.querySelector('#search-form');
const input = document.querySelector('#repo-input');
const status = document.querySelector('#status');
const results = document.querySelector('#results');

const elements = {
  name: document.querySelector('#repo-name'),
  link: document.querySelector('#repo-link'),
  stars: document.querySelector('#stars'),
  forks: document.querySelector('#forks'),
  issues: document.querySelector('#issues'),
  watchers: document.querySelector('#watchers'),
  language: document.querySelector('#language'),
  license: document.querySelector('#license'),
  branch: document.querySelector('#branch'),
  updated: document.querySelector('#updated'),
  readme: document.querySelector('#readme')
};

function formatNumber(number) {
  return new Intl.NumberFormat('en-US').format(number);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function validateRepository(value) {
  const parts = value.trim().split('/');

  if (
    parts.length !== 2 ||
    !parts[0] ||
    !parts[1] ||
    parts.some(part => !/^[a-zA-Z0-9_.-]+$/.test(part))
  ) {
    return false;
  }

  return true;
}

async function analyzeRepository(owner, repository) {
  const baseUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;

  const response = await fetch(baseUrl, {
    headers: {
      Accept: 'application/vnd.github+json'
    }
  });

  if (response.status === 404) {
    throw new Error('Repository not found. Check the name and try again.');
  }

  if (response.status === 403 || response.status === 429) {
    throw new Error('GitHub API rate limit reached. Please try again later.');
  }

  if (!response.ok) {
    throw new Error('Unable to load repository information.');
  }

  const repo = await response.json();

  const readmeResponse = await fetch(`${baseUrl}/readme`, {
    headers: {
      Accept: 'application/vnd.github+json'
    }
  });

  const hasReadme = readmeResponse.ok;

  elements.name.textContent = repo.full_name;
  elements.link.href = repo.html_url;

  elements.stars.textContent = formatNumber(repo.stargazers_count);
  elements.forks.textContent = formatNumber(repo.forks_count);
  elements.issues.textContent = formatNumber(
    repo.open_issues_count - repo.open_issues_count
  );
  elements.watchers.textContent = formatNumber(repo.subscribers_count ?? 0);

  elements.language.textContent = repo.language || 'Not specified';
  elements.license.textContent = repo.license?.spdx_id || 'Not specified';
  elements.branch.textContent = repo.default_branch;
  elements.updated.textContent = formatDate(repo.updated_at);
  elements.readme.textContent = hasReadme ? 'Available' : 'Not found';

  results.hidden = false;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const value = input.value.trim();

  if (!validateRepository(value)) {
    results.hidden = true;
    setStatus('Enter a valid repository in owner/repository format.', true);
    return;
  }

  const [owner, repository] = value.split('/');

  results.hidden = true;
  setStatus('Analyzing repository...');

  const submitButton = form.querySelector('button');
  submitButton.disabled = true;
  submitButton.textContent = 'Analyzing...';

  try {
    await analyzeRepository(owner, repository);
    setStatus('Analysis completed successfully!');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Analyze repository';
  }
});