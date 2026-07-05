import React from 'react'
import NavigationBar from './Shared/components/NavigationBar'
import { Outlet, useLocation } from 'react-router-dom'
import ScrollToTop from './Shared/components/ScrollToTop'

const AppLayout = () => {
    const location = useLocation()
    // The landing page ('/') ships its own themed header, so the shared
    // storefront navbar only shows up on the shop/cart/orders pages.
    const isLanding = location.pathname === '/'

    return (
        <div>
            <ScrollToTop />
            {!isLanding && <NavigationBar />}
            <Outlet />
        </div>
    )
}

export default AppLayout
