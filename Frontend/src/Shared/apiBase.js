const LOCAL_API_URL = 'http://localhost:6060/api';
const PROD_API_URL = 'https://the-cakeology.onrender.com/api';

const normalizeBaseUrl = (value) => value.replace(/\/$/, '');

export const getApiBaseUrl = () => {
    if (typeof window === 'undefined') {
        return PROD_API_URL;
    }

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (isLocalhost) {
        return LOCAL_API_URL;
    }

    const configured = import.meta.env.VITE_API_URL?.trim();
    if (configured && !/^(localhost|127\.0\.0\.1)/.test(configured)) {
        return normalizeBaseUrl(configured);
    }

    return PROD_API_URL;
};