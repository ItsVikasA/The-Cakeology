// Attaches the stored auth token as a Bearer header on every request for the
// given axios instance. This keeps the user authenticated across page refreshes
// even when the API is on a different domain (where cross-site cookies aren't
// reliably sent). The httpOnly cookie still works for same-site/local setups.
export const withAuth = (api) => {
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
    return api;
};

export default withAuth;
