import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../Features/Authentication/Hook/useAuth';
import useCart from '../../Features/Cart/Hook/useCart';
import useWishlist from '../../Features/Wishlist/Hook/useWishlist';
import ProfileSidebar from './ProfileSidebar';
import useHideOnScroll from '../hooks/useHideOnScroll';

const NavigationBar = () => {

    const hidden = useHideOnScroll();
    const User = useSelector((state) => state.auth.User);
    const cartItems = useSelector((state) => state.cart.cartItems);
    const [search, setSearch] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const { getMeHandler } = useAuth();
    const { getCartItemsHandler } = useCart();
    const { getWishlistHandler } = useWishlist();

    const cartCount = cartItems?.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

    // Buyer-only shopper links (My Cakes / Saved / Orders) don't apply to admins
    // or sellers — they have their own dashboards.
    const isBuyer = User && User.role !== 'admin' && User.role !== 'seller';
    // Admins/sellers don't shop — hide Cart and Custom Cake for them.
    const isStaff = User && (User.role === 'admin' || User.role === 'seller');

    useEffect(() => {
        if (isSidebarOpen && User) {
            getMeHandler();
        }
    }, [isSidebarOpen]);

    // Load the cart so the badge reflects the latest item count.
    // Works for guests too — the handler falls back to the localStorage cart.
    useEffect(() => {
        getCartItemsHandler();
    }, [User]);

    // Load wishlist ids so product hearts render in the correct state.
    useEffect(() => {
        if (User) getWishlistHandler().catch(() => {});
    }, [User]);

    return (
        <>
            <ProfileSidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                user={User} 
            />
            <nav className={`sticky top-0 z-30 bg-[#F9E0D6]/80 backdrop-blur-xl border-b border-[#F3D9CB] transition-transform duration-300 ease-out ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src="/logo.png"
                            alt="Cakeology"
                            onClick={() => navigate('/')}
                            className="h-12 md:h-14 w-auto object-contain cursor-pointer"
                        />
                    </div>
                    <div className="flex items-center gap-3 sm:gap-6">
                        {/* Search bar */}
                        <div className="relative hidden md:flex items-center">
                            <svg className="absolute left-3 w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search cakes…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        navigate(`/shop?search=${encodeURIComponent(search.trim())}`);
                                    }
                                }}
                                className="font-poppins pl-9 pr-4 py-2 bg-white border border-[#F3D9CB] rounded-sm
                                           text-[12px] text-[#5A1A2B] placeholder-[#C9B5A8]
                                           focus:outline-none focus:border-[#F37966] transition-colors duration-200 w-56"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 text-[#6B7280] hover:text-[#5A1A2B] transition-colors cursor-pointer"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Seller Dashboard Button */}
                        {/* Admin Panel Button */}
                        {User?.role === "admin" && (
                            <button
                                onClick={() => navigate("/admin")}
                                className="group flex items-center gap-2 text-[#c0392b] transition-colors hover:opacity-70"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] font-medium">Admin</span>
                            </button>
                        )}

                        {/* Seller Dashboard Button */}
                        {User?.role === "seller" && (
                            <button
                                onClick={() => navigate("/product/dashboard")}
                                className="group flex items-center gap-2 text-[#5A1A2B] transition-colors hover:opacity-70"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                                <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] font-medium">Seller</span>
                            </button>
                        )}

                        {/* Custom Cake & Cart — shoppers only (hidden for admin/seller). */}
                        {!isStaff && (
                          <>
                        <button
                            onClick={() => navigate("/customCake")}
                            className="group flex items-center gap-2 text-[#5A1A2B] transition-colors hover:opacity-70"
                            aria-label="Custom Cake"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.9 3.8 4.2.6-3 3 .7 4.2L12 14.8 8.2 14.6l.7-4.2-3-3 4.2-.6L12 3z" />
                            </svg>
                            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] font-medium">Custom Cake</span>
                        </button>

                        <button
                            onClick={() => navigate("/cart")}
                            className="group relative flex items-center gap-2 text-[#5A1A2B] transition-colors hover:opacity-70"
                            aria-label="Cart"
                        >
                            <div className="relative">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4l1-12z" />
                                </svg>
                                {cartCount > 0 && (
                                    <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#5A1A2B] text-[#FFF6F0] text-[9px] font-semibold leading-none">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </div>
                            <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] font-medium">Cart</span>
                        </button>
                          </>
                        )}

                        {User ? (
                            <>
                                {isBuyer && (
                                  <>
                                <button
                                    onClick={() => navigate("/myCustomCakes")}
                                    className="group flex items-center gap-2 text-[#5A1A2B] transition-colors hover:opacity-70"
                                    aria-label="My Custom Cakes"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14l-1 12H6L5 8zm2-3a2 2 0 012-2h6a2 2 0 012 2v3H7V5z" />
                                    </svg>
                                    <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] font-medium">My Cakes</span>
                                </button>
                                <button
                                    onClick={() => navigate("/wishlist")}
                                    className="group flex items-center gap-2 text-[#5A1A2B] transition-colors hover:opacity-70"
                                    aria-label="Wishlist"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] font-medium">Saved</span>
                                </button>
                                <button
                                    onClick={() => navigate("/myOrders")}
                                    className="group flex items-center gap-2 text-[#5A1A2B] transition-colors hover:opacity-70"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <span className="hidden sm:inline text-[11px] uppercase tracking-[0.2em] font-medium">Orders</span>
                                </button>
                                  </>
                                )}
                                <button
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F3D9CB] hover:bg-[#d1ccc6] transition-colors"
                                    aria-label="Open profile"
                                >
                                    <svg className="w-5 h-5 text-[#5A1A2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => navigate("/login")}
                                    className="text-[#5A1A2B] font-poppins text-[11px] uppercase tracking-[0.2em] font-medium hover:opacity-70 transition-colors"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => navigate("/register")}
                                    className="px-4 py-2 bg-[#5A1A2B] text-[#FFF6F0] font-poppins text-[11px] uppercase tracking-[0.2em] font-medium rounded-sm hover:bg-[#43121F] transition-colors"
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </nav>
        </>
    )
}

export default NavigationBar
