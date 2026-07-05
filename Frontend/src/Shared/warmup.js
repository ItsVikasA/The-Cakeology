import { getApiBaseUrl } from './apiBase';

// Free hosting tiers (e.g. Render) spin the backend down when idle. Pinging it
// the instant the app loads gives the instance a head start on waking up, so
// it's ready by the time the user actually logs in / registers. Failures are
// ignored on purpose — this is a best-effort nudge, not a critical request.
export const warmUpBackend = () => {
    try {
        // getApiBaseUrl() returns ".../api"; strip it to hit the root health route.
        const base = getApiBaseUrl().replace(/\/api\/?$/, '');
        fetch(base, { method: 'GET', mode: 'cors', keepalive: true }).catch(() => {});
    } catch {
        // No-op: warming the backend must never break app startup.
    }
};

export default warmUpBackend;
