const express = require('express');
const {GITHUB_REPO, GITHUB_TOKEN, GITHUB_COMMITS_CACHE_MS} = require('../config');

const router = express.Router();

// Simple in-memory cache, shared across all visitors - this endpoint is fetched server-side
// specifically so many browsers hitting the homepage don't each burn through GitHub's
// unauthenticated 60-requests-per-hour limit on their own.
let cache = null;
let cacheExpiresAt = 0;

const fetchCommits = async () => {
    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'nyxide-server'
    };
    if (GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }
    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=50`,
        {headers}
    );
    if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
    }
    const data = await response.json();
    return data.map(commit => ({
        sha: commit.sha,
        url: commit.html_url,
        message: commit.commit && commit.commit.message ? commit.commit.message.split('\n')[0] : '',
        date: commit.commit && commit.commit.author ? commit.commit.author.date : null,
        author: commit.author ? {
            username: commit.author.login,
            avatarUrl: commit.author.avatar_url,
            profileUrl: commit.author.html_url
        } : {
            username: commit.commit && commit.commit.author ? commit.commit.author.name : 'Unknown',
            avatarUrl: null,
            profileUrl: null
        }
    }));
};

router.get('/commits', async (req, res) => {
    try {
        if (!cache || Date.now() > cacheExpiresAt) {
            cache = await fetchCommits();
            cacheExpiresAt = Date.now() + GITHUB_COMMITS_CACHE_MS;
        }
        res.json({items: cache});
    } catch (err) {
        // Expected while the repo is still private (404) - report a clean, specific error
        // instead of a bare 500 so the frontend can show a sensible message.
        res.status(502).json({error: `Could not load commits from GitHub: ${err.message}`});
    }
});

module.exports = router;
