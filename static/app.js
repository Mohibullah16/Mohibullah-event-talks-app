// Application state
let releases = [];
let filteredReleases = [];
let currentCategory = 'all';
let searchQuery = '';

// DOM Elements
const feedContainer = document.getElementById('feed-container');
const refreshBtn = document.getElementById('refresh-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const searchInput = document.getElementById('search-input');
const tagFilters = document.querySelectorAll('.tag-filter');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const retryBtn = document.getElementById('retry-btn');
const themeToggle = document.getElementById('theme-toggle');

// Load stored theme or default to dark
const currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);
if (currentTheme === 'light') {
  themeToggle.checked = true;
}

// Toggle theme event handler
themeToggle.addEventListener('change', (e) => {
  if (e.target.checked) {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
});

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const tweetSubmitBtn = document.getElementById('tweet-submit-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

// Fetch and Load releases
async function fetchReleases() {
  setLoading(true);
  try {
    const response = await fetch('/api/releases');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.success) {
      releases = data.releases;
      applyFilters();
    } else {
      showError(data.error || 'Failed to fetch release notes.');
    }
  } catch (err) {
    showError(err.message || 'Could not connect to the server.');
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    if (releases.length === 0) {
      feedContainer.style.display = 'none';
      loadingState.style.display = 'flex';
      errorState.style.display = 'none';
      emptyState.style.display = 'none';
    }
  } else {
    refreshBtn.classList.remove('loading');
    refreshBtn.disabled = false;
    loadingState.style.display = 'none';
  }
}

function showError(msg) {
  errorMessage.textContent = msg;
  feedContainer.style.display = 'none';
  loadingState.style.display = 'none';
  emptyState.style.display = 'none';
  errorState.style.display = 'flex';
}

// Render cards into container
function renderReleases() {
  feedContainer.innerHTML = '';
  
  if (filteredReleases.length === 0) {
    feedContainer.style.display = 'none';
    emptyState.style.display = 'flex';
    errorState.style.display = 'none';
    return;
  }
  
  feedContainer.style.display = 'grid';
  emptyState.style.display = 'none';
  errorState.style.display = 'none';

  filteredReleases.forEach(item => {
    const card = document.createElement('div');
    card.className = 'release-card';
    
    // Assign CSS variable dynamic accent based on category
    let accentColor = '#a78bfa'; // General
    const cat = item.category.toLowerCase();
    if (cat === 'feature') accentColor = '#34d399';
    else if (cat === 'changed') accentColor = '#fbbf24';
    else if (cat === 'deprecated') accentColor = '#f87171';
    else if (cat === 'fixed') accentColor = '#60a5fa';
    
    card.style.setProperty('--accent-color', accentColor);

    card.innerHTML = `
      <div class="card-header">
        <div class="card-meta">
          <span class="badge ${cat}">${item.category}</span>
          <span class="release-date">${item.date}</span>
        </div>
        <div class="card-actions">
          <button class="icon-btn copy-btn" title="Copy plain text to clipboard">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
          <button class="icon-btn share-tweet" title="Tweet about this release">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/>
            </svg>
          </button>
          <a href="${item.link}" target="_blank" class="icon-btn" title="View Source Google Release Notes Page">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
      <h2 class="release-title">${item.title}</h2>
      <div class="release-body">${item.content}</div>
    `;

    // Attach clipboard copying logic
    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
      try {
        const plainText = item.tweet_text;
        await navigator.clipboard.writeText(plainText);
        
        // Brief visual feedback toast/change
        const originalSVG = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#34d399" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        `;
        setTimeout(() => {
          copyBtn.innerHTML = originalSVG;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    });

    // Attach tweet sharing logic
    const shareBtn = card.querySelector('.share-tweet');
    shareBtn.addEventListener('click', () => {
      openTweetComposer(item.tweet_text);
    });

    feedContainer.appendChild(card);
  });
}

// Filter releases based on search query & tags
function applyFilters() {
  filteredReleases = releases.filter(item => {
    const matchesCategory = currentCategory === 'all' || item.category.toLowerCase() === currentCategory.toLowerCase();
    
    const plainContent = item.content.replace(/<[^>]+>/g, '').toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(searchQuery);
    const contentMatch = plainContent.includes(searchQuery);
    const matchesSearch = titleMatch || contentMatch;
    
    return matchesCategory && matchesSearch;
  });
  
  renderReleases();
}

// Twitter Modal Logic
function openTweetComposer(text) {
  tweetTextarea.value = text;
  updateCharCounter();
  tweetModal.classList.add('active');
}

function closeTweetComposer() {
  tweetModal.classList.remove('active');
}

function updateCharCounter() {
  const remaining = 280 - tweetTextarea.value.length;
  charCounter.textContent = `${remaining} characters remaining`;
  if (remaining < 0) {
    charCounter.classList.add('limit-exceeded');
    tweetSubmitBtn.disabled = true;
  } else {
    charCounter.classList.remove('limit-exceeded');
    tweetSubmitBtn.disabled = false;
  }
}

// Handle tweet submission
function publishTweet() {
  const text = encodeURIComponent(tweetTextarea.value);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
  window.open(twitterUrl, '_blank');
  closeTweetComposer();
}

// Export filtered releases to CSV file
function exportToCSV() {
  if (filteredReleases.length === 0) {
    alert("No release notes found to export.");
    return;
  }

  // Helper to escape values containing commas, quotes or newlines
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    let stringVal = String(val);
    // Strip inner HTML tags for CSV readable body
    stringVal = stringVal.replace(/<[^>]+>/g, '');
    // Escape double quotes
    stringVal = stringVal.replace(/"/g, '""');
    // Wrap in quotes if it contains separator chars
    if (stringVal.search(/("|,|\n)/g) >= 0) {
      stringVal = `"${stringVal}"`;
    }
    return stringVal;
  };

  const headers = ["ID", "Title", "Date", "Category", "Link", "Details"];
  const rows = filteredReleases.map(item => [
    item.id,
    item.title,
    item.date,
    item.category,
    item.link,
    item.tweet_text
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.map(escapeCSV).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `bigquery_releases_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Event Listeners
refreshBtn.addEventListener('click', fetchReleases);
retryBtn.addEventListener('click', fetchReleases);
exportCsvBtn.addEventListener('click', exportToCSV);

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase();
  applyFilters();
});

tagFilters.forEach(tag => {
  tag.addEventListener('click', () => {
    tagFilters.forEach(t => t.classList.remove('active'));
    tag.classList.add('active');
    currentCategory = tag.dataset.category;
    applyFilters();
  });
});

closeModalBtn.addEventListener('click', closeTweetComposer);
tweetModal.addEventListener('click', (e) => {
  if (e.target === tweetModal) closeTweetComposer();
});

tweetTextarea.addEventListener('input', updateCharCounter);
tweetSubmitBtn.addEventListener('click', publishTweet);

// Initial Load
document.addEventListener('DOMContentLoaded', fetchReleases);
