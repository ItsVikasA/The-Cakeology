const LOCAL_API_URL = 'http://localhost:6060/api';
const PROD_API_URL = 'https://the-cakeology.onrender.com/api';

const normalizeBaseUrl = (value) => value.replace(/\/$/, '');

export const getApiBaseUrl = () => {
    const configured = import.meta.env.VITE_API_URL?.trim();
    const isLocalhost = typeof window !== 'undefined'
        && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

    if (configured && /^(localhost|127\.0\.0\.1)/.test(configured) && !isLocalhost) {
        return PROD_API_URL;
    }

    if (configured) {
        return normalizeBaseUrl(configured);
    }

    if (typeof window !== 'undefined') {
        return isLocalhost ? LOCAL_API_URL : PROD_API_URL;
    }

    return PROD_API_URL;
};