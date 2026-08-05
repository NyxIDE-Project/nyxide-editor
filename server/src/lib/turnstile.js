const {TURNSTILE_SECRET_KEY} = require('../config');

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Node's built-in global fetch (Node 18+) - no extra dependency needed for this.
const verifyTurnstileToken = async (token, remoteIp) => {
    if (!token || typeof token !== 'string') {
        return false;
    }
    const body = new URLSearchParams();
    body.set('secret', TURNSTILE_SECRET_KEY);
    body.set('response', token);
    if (remoteIp) {
        body.set('remoteip', remoteIp);
    }
    try {
        const response = await fetch(VERIFY_URL, {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body
        });
        const data = await response.json();
        if (!data.success) {
            // Surfaced here (not swallowed) because a widget that visibly succeeds in the
            // browser but fails this check is almost always a site key / secret key mismatch
            // (e.g. secret pasted from a different Turnstile widget) - the error-codes below
            // name the exact reason instead of leaving it to guess.
            // eslint-disable-next-line no-console
            console.warn('Turnstile verification failed:', data['error-codes']);
        }
        return Boolean(data.success);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Turnstile verification request errored:', err.message);
        return false;
    }
};

module.exports = {verifyTurnstileToken};
