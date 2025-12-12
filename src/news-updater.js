#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const parser = new (require('rss-parser'))();

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'config.json');

// Pulls and parses the RSS feed into a normalized list of items.
async function fetchRss(url) {
  const feed = await parser.parseURL(url);
  return feed.items || [];
}

// Caps summary length so config stays lightweight.
function truncate(text = '', max = 320) {
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

// Simple keyword detector that boosts stories containing trigger terms.
function keywordBonus(text = '', keywords = []) {
  if (!keywords || !keywords.length) return 0;
  const haystack = text.toLowerCase();
  return keywords.some(keyword => haystack.includes(keyword.toLowerCase())) ? 1 : 0;
}

// Combines feed weighting, keyword boosts, and summary length so critical
// stories (e.g., assassinations) outrank verbose fluff.
function computePriority(feed = {}, { summary = '', title = '' } = {}) {
  const base = Number(feed.basePriority) || 2;
  const wordCount = summary.split(/\s+/).filter(Boolean).length;
  let summaryScore = 0;
  if (wordCount > 80) summaryScore = 2;
  else if (wordCount > 40) summaryScore = 1;

  const keywordScore = keywordBonus(`${title} ${summary}`, feed.keywordBoost);
  return Math.min(5, base + summaryScore + keywordScore);
}

// Orchestrates RSS pulls for every source/topic and rewrites config.json.
async function updateConfig() {
  const existing = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  const updatedSources = await Promise.all(
    (existing.sources || []).map(async source => {
      const feeds = await Promise.all(
        (source.feeds || []).map(async feed => {
          try {
            const items = await fetchRss(feed.rssUrl);
            const articles = items.slice(0, 5).map(item => {
              const publishedAt = item.isoDate || item.pubDate || '';
              const uploadedAgo = publishedAt
                ? (() => {
                    const diffMs = Date.now() - new Date(publishedAt).getTime();
                    const minutes = Math.floor(diffMs / 60000);
                    if (minutes < 60) return `${minutes}m ago`;
                    const hours = Math.floor(minutes / 60);
                    if (hours < 24) return `${hours}h ago`;
                    const days = Math.floor(hours / 24);
                    return `${days}d ago`;
                  })()
                : '';
              return {
                title: item.title || 'Untitled',
                summary: truncate(item.contentSnippet || item.content || ''),
                link: item.link || '',
                publishedAt,
                uploadedAgo,
                priority: computePriority(feed, {
                  summary: item.contentSnippet || item.content || '',
                  title: item.title
                })
              };
            });
            return { ...feed, articles };
          } catch (error) {
            console.error(`[rss] failed for ${feed.rssUrl}`, error.message);
            return feed;
          }
        })
      );
      return { ...source, feeds };
    })
  );

  const next = { ...existing, sources: updatedSources, updatedAt: new Date().toISOString() };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2));
  console.log('[config] refreshed feeds at', next.updatedAt);
}

updateConfig().catch(err => {
  console.error(err);
  process.exit(1);
});
