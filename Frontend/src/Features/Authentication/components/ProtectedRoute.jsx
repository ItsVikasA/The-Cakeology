import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../Hook/useAuth';

const ProtectedRoute = ({ children }) => {

    const navigate = useNavigate();
    const location = useLocation();
    const { getMeHandler } = useAuth();

    const User = useSelector(state => state.auth.User);
    const Loading = useSelector(state => state.auth.Loading);

    useEffect(() => {
        const getUser = async () => {
            await getMeHandler();
        }
        getUser();
    }, []);

    useEffect(() => {
        if (Loading === false && User === null) {
            // Only the custom-cake flow returns the guest to where they were after
            // they create an account; every other protected page just sends them
            // to the home (Landing) page post-login. (Survives the href-based
            // login↔register links via sessionStorage rather than router state.)
            if (location.pathname === '/customCake') {
                sessionStorage.setItem('postLoginRedirect', '/customCake');
            } else {
                sessionStorage.removeItem('postLoginRedirect');
            }
            navigate("/register");
            return;
        }

    }, [User, Loading]);

    // Never reveal the protected page to someone who isn't logged in: render
    // nothing while auth is still being verified and while a guest is being
    // redirected to login. Only a user with an account ever sees the page.
    if (!User) return null;

    return (
        <div>
            {children}
        </div>
    )
}

export default ProtectedRoute
