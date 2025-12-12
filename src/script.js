const hero = document.querySelector('.hero');
const yearTarget = document.getElementById('copyright-year');
const newsList = document.getElementById('news-list');
const siteTitle = document.querySelector('.site-title');
const siteTitleText = siteTitle?.querySelector('span');
const siteTagline = document.getElementById('site-tagline');

// keeps the footer year up to date so the page never looks stale
function updateYear() {
  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }
}

updateYear();

// fetches the JSON configuration from the config directory
async function loadConfig() {
  try {
    const response = await fetch('../config/config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('[config] failed to load', error);
    return null;
  }
}

// determines what size/layout class an article should get based on content
function classifyArticle(article = {}) {
  const summaryLength = (article.summary || '').split(/\s+/).filter(Boolean).length;
  const priority = Number(article.priority) || 1;

  if (priority >= 5 || summaryLength >= 40) return 'feature';
  if (priority >= 4 || summaryLength >= 25) return 'headline';
  if (priority >= 3 || summaryLength >= 12) return 'column';
  return 'blurb';
}

function collectArticles(sources = []) {
  const collected = [];
  sources.forEach(source => {
    const feeds = source.feeds || [];
    feeds.forEach(feed => {
      (feed.articles || []).forEach(article => {
        collected.push({
          ...article,
          source: source.name || 'Unknown source',
          topic: feed.topic || 'General'
        });
      });
    });
  });
  return collected;
}

function formatRelativeTime(publishedAt) {
  if (!publishedAt) return '';
  const timestamp = new Date(publishedAt).getTime();
  if (Number.isNaN(timestamp)) return '';
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// empties the list and rebuilds every story with size classes + sorted order
function renderArticles(articles = []) {
  if (!newsList) return;
  newsList.innerHTML = '';

  if (!Array.isArray(articles) || !articles.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No articles available.';
    newsList.appendChild(empty);
    return;
  }

  const sorted = [...articles].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  sorted.forEach(article => {
    const card = document.createElement('article');
    const title = document.createElement('h2');
    const meta = document.createElement('p');
    const summary = document.createElement('p');
    const time = document.createElement('p');

    title.textContent = article.title || 'Untitled';
    meta.className = 'news-piece__meta';
    meta.textContent = `${article.source || 'Unknown source'} • ${article.topic || 'General'}`;
    summary.textContent = article.summary || '';
    time.className = 'news-piece__ago';
    time.textContent = article.uploadedAgo || formatRelativeTime(article.publishedAt);

    const sizeClass = classifyArticle(article);
    card.classList.add('news-piece', `news-piece--${sizeClass}`);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(summary);
    card.appendChild(time);
    newsList.appendChild(card);
  });
}

// entry point: loads config, updates hero text, and renders the article list
async function hydrateFromConfig() {
  const config = await loadConfig();
  if (!config) return;

  if (config.siteTitle && siteTitle) {
    siteTitle.setAttribute('aria-label', config.siteTitle);
    siteTitle.dataset.title = config.siteTitle;
    if (siteTitleText) {
      siteTitleText.textContent = `${config.siteTitle} • ${config.siteTitle} • ${config.siteTitle}`;
    }
  }

  if (config.tagline && siteTagline) {
    siteTagline.textContent = config.tagline;
  }

  const articles = collectArticles(config.sources || []);
  renderArticles(articles);
}

hydrateFromConfig();
