import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../../Authentication/Hook/useAuth';

const navItems = [
    { to: '/admin', label: 'Overview', end: true, icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { to: '/admin/orders', label: 'Orders', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { to: '/admin/notifications', label: 'Notifications', icon: 'M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.66V5a2 2 0 10-4 0v.34A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { to: '/admin/users', label: 'Users', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z' },
    { to: '/admin/banners', label: 'Banners', icon: 'M4 5a2 2 0 012-2h12a2 2 0 012 2v14l-4-3-4 3-4-3-4 3V5z' },
    { to: '/admin/payments', label: 'Payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { to: '/admin/reports', label: 'Reports', icon: 'M9 17v-6m4 6V7m4 10v-3M4 19h16' },
    { to: '/admin/settings', label: 'Settings', icon: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-2.82 1.17V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.17-2.82H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9c.2.66.78 1.13 1.51 1.17H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z' },
];

const AdminLayout = () => {
    const navigate = useNavigate();
    const { logoutHandler } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const Sidebar = () => (
        <>
            <div className="px-6 py-6 border-b border-[#F3D9CB]">
                <span onClick={() => navigate('/')} className="font-baloo text-[15px] font-semibold tracking-[0.3em] text-[#5A1A2B] uppercase cursor-pointer">
                    Cakeology
                </span>
                <p className="font-poppins text-[10px] uppercase tracking-[0.18em] text-[#c0392b] mt-1">Admin Panel</p>
            </div>
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-sm font-poppins text-[12px] uppercase tracking-[0.12em] transition-colors duration-200
                            ${isActive ? 'bg-[#5A1A2B] text-[#FFF6F0]' : 'text-[#6B7280] hover:bg-[#F9E0D6] hover:text-[#5A1A2B]'}`
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
                <button onClick={() => navigate('/shop')} className="w-full flex items-center gap-3 px-4 py-3 rounded-sm font-poppins text-[12px] uppercase tracking-[0.12em] text-[#6B7280] hover:bg-[#F9E0D6] hover:text-[#5A1A2B] transition-colors">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    View Store
                </button>
                <button onClick={logoutHandler} className="w-full flex items-center gap-3 px-4 py-3 rounded-sm font-poppins text-[12px] uppercase tracking-[0.12em] text-[#c0392b] hover:bg-[#fce8e8] transition-colors">
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
            <aside className="hidden md:flex w-60 shrink-0 sticky top-0 h-screen flex-col bg-white border-r border-[#F3D9CB]">
                <Sidebar />
            </aside>

            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#F3D9CB] h-14 flex items-center justify-between px-4">
                <button onClick={() => setMobileOpen(true)} className="p-2 text-[#5A1A2B]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span className="font-baloo text-[13px] font-semibold tracking-[0.3em] text-[#5A1A2B] uppercase">Admin</span>
                <span className="w-9" />
            </div>

            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-[#5A1A2B]/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <aside className="relative w-64 h-full bg-white border-r border-[#F3D9CB] flex flex-col">
                        <Sidebar />
                    </aside>
                </div>
            )}

            <main className="flex-1 min-w-0 pt-14 md:pt-0">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
