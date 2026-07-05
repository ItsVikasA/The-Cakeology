import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../Features/Authentication/Hook/useAuth';

const ProfileSidebar = ({ isOpen, onClose, user }) => {
    if (!isOpen) return null;
    const { logoutHandler } = useAuth();
    const navigate = useNavigate();

    const go = (path) => { onClose?.(); navigate(path); };

    const navLinks = [
        { label: 'Request Custom Cake', path: '/customCake', icon: 'M12 3l1.9 3.8 4.2.6-3 3 .7 4.2L12 14.8 8.2 14.6l.7-4.2-3-3 4.2-.6L12 3z' },
        { label: 'My Custom Cakes', path: '/myCustomCakes', icon: 'M5 8h14l-1 12H6L5 8zm2-3a2 2 0 012-2h6a2 2 0 012 2v3H7V5z' },
        { label: 'My Orders', path: '/myOrders', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { label: 'Wishlist', path: '/wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
        { label: 'Cart', path: '/cart', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4l1-12z' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex" id="profile-sidebar">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#0c0f10]/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>
            {/* Sidebar Panel */}
            <aside className="relative w-80 h-full bg-[#F9E0D6] shadow-2xl flex flex-col border-r border-[#abb3b7]/15 animate-[slideIn_0.3s_ease-out]">
                {/* Header with Close Button */}
                <div className="p-6 flex justify-between items-center border-b border-[#abb3b7]/15">
                    <span className="text-[13px] font-light text-[#1a1a1a] leading-relaxed uppercase tracking-widest">Profile</span>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#e3e9ec] transition-colors"
                    >
                        <svg className="w-5 h-5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {/* Profile Content */}
                <div className="p-8 flex-grow min-h-0 overflow-y-auto space-y-8">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-24 h-24 rounded-full bg-[#dbe4e7] border-2 border-[#525e7f]/20 flex items-center justify-center overflow-hidden">
                            <svg className="w-12 h-12 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-poppins text-xl font-extrabold text-[#2b3437]">{user?.fullname || 'Loading...'}</h2>
                            <p className="text-[#525e7f] font-poppins text-xs font-bold uppercase tracking-widest mt-1">
                                {user?.role === 'seller' ? 'Seller' : user?.role === 'buyer' ? 'Buyer' : user?.role || ''}
                            </p>
                        </div>
                    </div>
                    {/* Info List */}
                    <div className="space-y-6 pt-4">
                        <div className="space-y-1">
                            <label className="font-poppins text-[10px] font-bold uppercase tracking-widest text-[#6B7280] opacity-60">Email Address</label>
                            <p className="font-poppins text-sm font-medium text-[#2b3437]">{user?.email || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="font-poppins text-[10px] font-bold uppercase tracking-widest text-[#6B7280] opacity-60">Contact Number</label>
                            <p className="font-poppins text-sm font-medium text-[#2b3437]">{user?.contact || '-'}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="font-poppins text-[10px] font-bold uppercase tracking-widest text-[#6B7280] opacity-60">User ID</label>
                            <p className="font-poppins text-sm font-medium text-[#2b3437] font-mono">{user?._id || '-'}</p>
                        </div>
                    </div>

                    {/* Quick navigation (especially useful on mobile) */}
                    <nav className="pt-4 border-t border-[#abb3b7]/20 space-y-1">
                        {navLinks.map((link) => (
                            <button
                                key={link.path}
                                onClick={() => go(link.path)}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-sm text-left text-[13px] font-medium text-[#2b3437] hover:bg-[#F3D9CB] transition-colors"
                            >
                                <svg className="w-4 h-4 text-[#F37966] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                                </svg>
                                {link.label}
                            </button>
                        ))}
                    </nav>
                </div>
                {/* Footer Branding + Logout */}
                <div className="p-8 flex flex-col gap-4">
                    <button
                        type="button"
                        className="w-full py-3 px-4 bg-[#5A1A2B] text-[#FFF6F0] font-poppins text-[11px] uppercase tracking-[0.2em] font-medium rounded-sm hover:bg-[#43121F] transition-colors"
                        onClick={logoutHandler}
                    >
                        Logout
                    </button>
                    <div className="flex border-t border-[#abb3b7]/45 items-center gap-2 opacity-40">
                        <span className="not-italic italic text-[14px] tracking-widest font-light text-[#F37966]">Cakeology</span>
                    </div>
                </div>
            </aside>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};

export default ProfileSidebar;
