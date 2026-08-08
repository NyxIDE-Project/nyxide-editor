const express = require('express');
const {
    GITHUB_REPO, GITHUB_TOKEN, GITHUB_COMMITS_CACHE_MS, DESKTOP_REPO, GITHUB_RELEASE_CACHE_MS
} = require('../config');

const router = express.Router();

const githubHeaders = () => {
    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'nyxide-server'
    };
    if (GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }
    return headers;
};

// Simple in-memory cache, shared across all visitors - this endpoint is fetched server-side
// specifically so many browsers hitting the homepage don't each burn through GitHub's
// unauthenticated 60-requests-per-hour limit on their own.
let cache = null;
let cacheExpiresAt = 0;

const fetchCommits = async () => {
    const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=50`,
        {headers: githubHeaders()}
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

// electron-builder's default naming: "NyxIDE-Setup-<version>-x64.exe", "NyxIDE-Setup-<version>-
// arm64.dmg" / "-x64.dmg", "NyxIDE-linux-x86_64-<version>.AppImage". Only the platform/arch
// combos the download page actually offers a direct button for are classified here - other
// assets (.deb, .tar.gz, etc.) are still on the release page, just not auto-picked.
const classifyAsset = name => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.exe')) return 'windows';
    if (lower.endsWith('.dmg') && lower.includes('arm64')) return 'macArm64';
    if (lower.endsWith('.dmg')) return 'macX64';
    if (lower.endsWith('.appimage')) return 'linux';
    return null;
};

let releaseCache = null;
let releaseCacheExpiresAt = 0;

const fetchDesktopRelease = async () => {
    const response = await fetch(
        `https://api.github.com/repos/${DESKTOP_REPO}/releases/latest`,
        {headers: githubHeaders()}
    );
    if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}`);
    }
    const data = await response.json();
    const assets = {};
    data.assets.forEach(asset => {
        const platform = classifyAsset(asset.name);
        if (platform && !assets[platform]) {
            assets[platform] = {name: asset.name, url: asset.browser_download_url, size: asset.size};
        }
    });
    return {version: data.tag_name, assets};
};

router.get('/desktop-release', async (req, res) => {
    try {
        if (!releaseCache || Date.now() > releaseCacheExpiresAt) {
            releaseCache = await fetchDesktopRelease();
            releaseCacheExpiresAt = Date.now() + GITHUB_RELEASE_CACHE_MS;
        }
        res.json(releaseCache);
    } catch (err) {
        res.status(502).json({error: `Could not load the latest desktop release: ${err.message}`});
    }
});

module.exports = router;
