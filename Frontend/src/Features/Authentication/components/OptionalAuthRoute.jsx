import React, { useEffect } from 'react'
import useAuth from '../Hook/useAuth';

// Resolves the current login state (so logged-in users are recognised) but,
// unlike ProtectedRoute, never redirects guests to /login. Used for pages that
// work for both logged-in users and guests (e.g. the cart in guest-checkout mode).
const OptionalAuthRoute = ({ children }) => {
    const { getMeHandler } = useAuth();

    useEffect(() => {
        getMeHandler();
    }, []);

    return <div>{children}</div>;
}

export default OptionalAuthRoute
