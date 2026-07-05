const LOCAL_API_URL = 'http://localhost:6060/api';
const PROD_API_URL = 'https://the-cakeology.onrender.com/api';

const normalizeBaseUrl = (value) => value.replace(/\/$/, '');

// Returns true when the given URL (with or without a protocol) points at a
// local development host. Used to make sure a stale/local VITE_API_URL baked
// into a production build never breaks the deployed site.
const pointsToLocalhost = (value) => {
    if (!value) return false;
    try {
        const hostname = new URL(value).hostname;
        return hostname === 'localhost' || hostname === '127.0.0.1';
    } catch {
        // No protocol (e.g. "localhost:6060/api") — fall back to a prefix check.
        return /^(localhost|127\.0\.0\.1)(:|\/|$)/.test(value);
    }
};

export const getApiBaseUrl = () => {
    if (typeof window === 'undefined') {
        return PROD_API_URL;
    }

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalhost) {
        return LOCAL_API_URL;
    }

    // On a deployed (non-localhost) site, only honour VITE_API_URL when it
    // points at a real remote backend. A localhost value is ignored so we
    // don't emit blocked mixed-content requests to the user's own machine.
    const configured = import.meta.env.VITE_API_URL?.trim();
    if (configured && !pointsToLocalhost(configured)) {
        return normalizeBaseUrl(configured);
    }

    return PROD_API_URL;
};