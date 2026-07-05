import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useWishlist from '../Hook/useWishlist';
import ProductCard from '../../Products/components/ProductCard';

const Wishlist = () => {
    const { getWishlistHandler } = useWishlist();
    const items = useSelector((state) => state.wishlist.items);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                await getWishlistHandler();
            } catch (e) {
                console.error('Failed to load wishlist:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="min-h-screen bg-[#F9E0D6] font-poppins antialiased">
            <nav className="max-w-7xl mx-auto px-6 pt-8 pb-2 flex items-center">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-[#5A1A2B] hover:text-[#F37966] text-sm font-medium transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="mb-10">
                    <h1 className="font-baloo text-5xl font-light tracking-widest text-[#5A1A2B] uppercase">
                        Wishlist
                    </h1>
                    <p className="font-poppins text-[13px] text-[#6B7280] mt-3 tracking-wide">
                        Cakes you've saved for later
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-sm border border-[#F3D9CB] overflow-hidden">
                                <div className="aspect-[4/5] bg-[#F9E0D6] animate-pulse" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 w-2/3 bg-[#F9E0D6] rounded animate-pulse" />
                                    <div className="h-3 w-full bg-[#F9E0D6] rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-28 text-center">
                        <div className="w-20 h-20 rounded-full bg-[#F9E0D6] border border-[#F3D9CB] flex items-center justify-center mb-8">
                            <svg className="w-8 h-8 text-[#C9B5A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h2 className="font-baloo text-[28px] font-light text-[#5A1A2B] mb-2">
                            Your wishlist is <em className="not-italic italic text-[#F37966]">empty.</em>
                        </h2>
                        <p className="font-poppins text-[13px] font-light text-[#6B7280] max-w-xs leading-relaxed">
                            Tap the heart on any product to save it here.
                        </p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="mt-8 font-poppins px-8 py-3.5 bg-[#5A1A2B] text-[#F9E0D6] rounded-sm text-[11px] uppercase tracking-[0.18em] cursor-pointer transition-all duration-200 hover:bg-[#43121F] active:scale-[0.98]"
                        >
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {items.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Wishlist;
