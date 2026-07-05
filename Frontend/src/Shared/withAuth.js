// Attaches the stored auth token as a Bearer header on every request for the
// given axios instance. This keeps the user authenticated across page refreshes
// even when the API is on a different domain (where cross-site cookies aren't
// reliably sent). The httpOnly cookie still works for same-site/local setups.
//
// It also adds cold-start resilience: on free hosting (e.g. Render) the backend
// spins down when idle and takes 30-60s to wake. The first requests then fail
// with a network error / timeout / 502-504. Instead of surfacing that as a
// broken login, we transparently retry a few times with a short backoff so the
// call succeeds once the server is awake.

const COLD_START_MAX_RETRIES = 4;
const COLD_START_RETRY_DELAY = 4000; // ms between attempts
// Long enough to let a sleeping instance wake and respond before we retry.
const DEFAULT_TIMEOUT = 60000; // ms

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isColdStartError = (error) => {
    // No response at all (network error) or a timeout — typical while waking.
    if (!error.response) return true;
    const status = error.response.status;
    return status === 502 || status === 503 || status === 504;
};

export const withAuth = (api) => {
    // Give sleeping servers time to respond instead of aborting too early.
    if (api.defaults && !api.defaults.timeout) {
        api.defaults.timeout = DEFAULT_TIMEOUT;
    }

    api.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const config = error.config;
            if (!config) return Promise.reject(error);

            config.__coldStartRetryCount = config.__coldStartRetryCount || 0;

            if (isColdStartError(error) && config.__coldStartRetryCount < COLD_START_MAX_RETRIES) {
                config.__coldStartRetryCount += 1;
                await sleep(COLD_START_RETRY_DELAY);
                return api(config);
            }

            return Promise.reject(error);
        }
    );

    return api;
};

export default withAuth;
