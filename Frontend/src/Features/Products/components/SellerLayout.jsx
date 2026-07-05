import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../../Authentication/Hook/useAuth';

const navItems = [
    {
        to: '/product/dashboard',
        label: 'Overview',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    },
    {
        to: '/product/sellerProducts',
        label: 'Products',
        icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    },
    {
        to: '/product/inventory',
        label: 'Inventory',
        icon: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M9 11h6',
    },
    {
        to: '/product/orders',
        label: 'Orders',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
    {
        to: '/product/notifications',
        label: 'Notifications',
        icon: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.66V5a2 2 0 10-4 0v.34A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    },
    {
        to: '/product/customRequests',
        label: 'Custom Cakes',
        icon: 'M12 3l1.9 3.8 4.2.6-3 3 .7 4.2L12 14.8 8.2 14.6l.7-4.2-3-3 4.2-.6L12 3z',
    },
    {
        to: '/product/coupons',
        label: 'Coupons',
        icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
    },
    {
        to: '/product/catalog',
        label: 'Categories',
        icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    },
    {
        to: '/product/createProduct',
        label: 'Add Product',
        icon: 'M12 4v16m8-8H4',
    },
];

const SellerLayout = () => {
    const navigate = useNavigate();
    const { logoutHandler } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const SidebarContent = () => (
        <>
            <div className="px-6 py-6 border-b border-[#F3D9CB]">
                <span
                    onClick={() => navigate('/')}
                    className="font-baloo text-[15px] font-semibold tracking-[0.3em] text-[#5A1A2B] uppercase cursor-pointer"
                >
                    Cakeology
                </span>
                <p className="font-poppins text-[10px] uppercase tracking-[0.18em] text-[#F37966] mt-1">Seller Console</p>
            </div>

            <nav className="flex-1 px-3 py-6 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/product/dashboard'}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-sm font-poppins text-[12px] uppercase tracking-[0.12em] transition-colors duration-200
                            ${isActive
                                ? 'bg-[#5A1A2B] text-[#FFF6F0]'
                                : 'text-[#6B7280] hover:bg-[#F9E0D6] hover:text-[#5A1A2B]'}`
                        }
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                        </svg>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="px-3 py-6 border-t border-[#F3D9CB] space-y-1">
                <button
                    onClick={() => { setMobileOpen(false); navigate('/shop'); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-sm font-poppins text-[12px] uppercase tracking-[0.12em] text-[#6B7280] hover:bg-[#F9E0D6] hover:text-[#5A1A2B] transition-colors"
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    View Store
                </button>
                <button
                    onClick={logoutHandler}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-sm font-poppins text-[12px] uppercase tracking-[0.12em] text-[#c0392b] hover:bg-[#fce8e8] transition-colors"
                >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </>
    );

    return (
        <div className="font-poppins min-h-screen bg-[#F9E0D6] flex">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex w-60 shrink-0 sticky top-0 h-screen flex-col bg-white border-r border-[#F3D9CB]">
                <SidebarContent />
            </aside>

            {/* Mobile top bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#F3D9CB] h-14 flex items-center justify-between px-4">
                <button onClick={() => setMobileOpen(true)} className="p-2 text-[#5A1A2B]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span className="font-baloo text-[13px] font-semibold tracking-[0.3em] text-[#5A1A2B] uppercase">Cakeology</span>
                <span className="w-9" />
            </div>

            {/* Mobile drawer */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-[#5A1A2B]/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <aside className="relative w-64 h-full bg-white border-r border-[#F3D9CB] flex flex-col">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main content */}
            <main className="flex-1 min-w-0 pt-14 md:pt-0">
                <Outlet />
            </main>
        </div>
    );
};

export default SellerLayout;
