import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import useProduct from '../Hook/useProduct';
import ProductCard from '../components/ProductCard';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../../Authentication/Hook/useAuth';
import useCatalog from '../../Catalog/Hook/useCatalog';
import useBanner from '../../Admin/Hook/useBanner';

const SORT_OPTIONS = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low → High', value: 'price_asc' },
    { label: 'Price: High → Low', value: 'price_desc' },
    { label: 'A – Z', value: 'az' },
];

const PAGE_SIZE = 8;

const Dashboard = () => {
    const products = useSelector((state) => state.products.AllProducts);
    const User = useSelector((state) => state.auth.User);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { ProductsHandler } = useProduct();
    const { getCategoriesHandler } = useCatalog();
    const { getActiveBannersHandler } = useBanner();

    const [categoryList, setCategoryList] = useState([]);
    const [banners, setBanners] = useState([]);
    const [heroIdx, setHeroIdx] = useState(0);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [sortOpen, setSortOpen] = useState(false);
    const [hasImages, setHasImages] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All Cakes');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const sentinelRef = useRef(null);

    const categoryTabs = [
        { value: 'All Cakes', label: 'All Cakes' },
        { value: 'New Arrivals', label: 'New Arrivals' },
        ...categoryList.filter((c) => !c?.parent).map((c) => ({ value: c.slug, label: c.name })),
    ];

    // Initial load (self-contained so skeletons show on a cold open).
    useEffect(() => {
        (async () => {
            try {
                await ProductsHandler();
            } catch (e) {
                console.error('Failed to load products:', e);
            } finally {
                setLoading(false);
            }
        })();
        getCategoriesHandler().then((c) => setCategoryList(Array.isArray(c) ? c : [])).catch(() => {});
        getActiveBannersHandler().then((b) => setBanners(b || [])).catch(() => {});
    }, []);

    // Seed the search box from a ?search= query param (set by the navbar search).
    useEffect(() => {
        const q = searchParams.get('search');
        if (q !== null) setSearch(q);
    }, [searchParams]);

    // Auto-rotate the hero banners.
    useEffect(() => {
        if (banners.length <= 1) return;
        const id = setInterval(() => setHeroIdx((i) => (i + 1) % banners.length), 5000);
        return () => clearInterval(id);
    }, [banners.length]);

    const activeBanner = banners[heroIdx] || null;




    // ── Derived: filter + sort ──
    const filtered = useMemo(() => {
        let list = [...(products || [])];

        // search
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (p) =>
                    p?.title?.toLowerCase().includes(q) ||
                    p?.description?.toLowerCase().includes(q)
            );
        }

        // has images filter
        if (hasImages) {
            list = list.filter((p) => p?.images?.length > 0);
        }

        // price range
        if (minPrice !== '') {
            list = list.filter((p) => (p?.price?.amount || 0) >= Number(minPrice));
        }
        if (maxPrice !== '') {
            list = list.filter((p) => (p?.price?.amount || 0) <= Number(maxPrice));
        }

        // category filter (uses the real product.category field)
        if (selectedCategory && selectedCategory !== 'All Cakes') {
            if (selectedCategory === 'New Arrivals') {
                const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
                const now = Date.now();
                list = list.filter((p) => {
                    try {
                        const ts = parseInt(p._id?.substring(0, 8), 16) * 1000;
                        return now - ts <= THIRTY_DAYS;
                    } catch (e) {
                        return false;
                    }
                });
            } else {
                list = list.filter((p) => p?.category === selectedCategory);
            }
        }

        // sort
        switch (sortBy) {
            case 'price_asc':
                list.sort((a, b) => (a?.price?.amount || 0) - (b?.price?.amount || 0));
                break;
            case 'price_desc':
                list.sort((a, b) => (b?.price?.amount || 0) - (a?.price?.amount || 0));
                break;
            case 'az':
                list.sort((a, b) => (a?.title || '').localeCompare(b?.title || ''));
                break;
            default:
                break; // newest = server order
        }

        return list;
    }, [products, search, sortBy, hasImages, selectedCategory, minPrice, maxPrice]);

    // Reset how many cards are shown whenever the filter set changes.
    useEffect(() => {
        setVisibleCount(PAGE_SIZE);
    }, [search, sortBy, hasImages, selectedCategory, minPrice, maxPrice]);

    const visibleProducts = filtered.slice(0, visibleCount);
    const hasMore = visibleCount < filtered.length;

    // Infinite scroll: grow the visible slice as the sentinel comes into view.
    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
                }
            },
            { rootMargin: '300px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, filtered.length]);



    return (
        <div className="font-poppins min-h-screen mt-10 bg-[#F9E0D6] antialiased">


            <main className="max-w-7xl mx-auto px-6 pt-110 py-12 lg:pt-130 lg:py-16">

                {/* ── HERO BANNER ── */}
                <div className="absolute left-5 right-5 top-16.5 lg:left-0 lg:right-0 h-[400px] lg:h-[500px] mb-16 overflow-hidden group">
                    <img
                        src={activeBanner ? activeBanner.image : "/1.jpeg"}
                        alt={activeBanner?.title || "Featured Cakes"}
                        onClick={() => { if (activeBanner?.link) navigate(activeBanner.link); }}
                        className={`w-full h-full object-cover transition-transform duration-[2s] scale-105 group-hover:scale-100 ${activeBanner?.link ? 'cursor-pointer' : ''}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#5A1A2B]/60 via-[#5A1A2B]/20 to-transparent flex flex-col justify-center px-12 lg:px-20 pointer-events-none">
                        <span className="font-poppins text-[11px] uppercase tracking-[0.3em] text-[#F9E0D6] mb-4 animate-fade-in">
                            {activeBanner ? (activeBanner.subtitle || 'Featured') : 'Limited Edition'}
                        </span>
                        <h2 className="font-baloo text-[clamp(40px,6vw,72px)] font-light text-white leading-[1] mb-8 max-w-xl">
                            {activeBanner ? (
                                activeBanner.title || 'Discover Our Cakes'
                            ) : (
                                <>Freshly Baked <em className="not-italic italic">Cakes</em> <br /> for Every Celebration</>
                            )}
                        </h2>
                        {activeBanner?.link ? (
                            <button
                                onClick={() => navigate(activeBanner.link)}
                                className="pointer-events-auto w-fit px-8 py-4 bg-[#F9E0D6] text-[#5A1A2B] font-poppins text-[12px] font-medium uppercase tracking-[0.2em] rounded-sm hover:bg-white transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 shadow-lg"
                            >
                                Shop Now
                            </button>
                        ) : (
                            <button className="w-fit px-8 py-4 bg-[#F9E0D6] text-[#5A1A2B] font-poppins text-[12px] font-medium uppercase tracking-[0.2em] rounded-sm hover:bg-white transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 shadow-lg">
                                Shop Our Cakes
                            </button>
                        )}
                    </div>

                    {/* Slider dots */}
                    {banners.length > 1 && (
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {banners.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setHeroIdx(i)}
                                    className={`h-1.5 rounded-full transition-all ${i === heroIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
                                    aria-label={`Banner ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>



                {/* ── CATEGORY BAR ── */}
                <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-4 no-scrollbar">
                    {categoryTabs.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-poppins text-[11px] uppercase tracking-[0.12em] transition-all duration-300
                                       ${selectedCategory === cat.value
                                    ? 'bg-[#5A1A2B] text-white shadow-md'
                                    : 'bg-white border border-[#F3D9CB] text-[#6B7280] hover:border-[#F37966] hover:text-[#5A1A2B]'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* ── FILTER & SORT BAR ── */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
                    {/* Filter chips */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Mobile search */}
                        <div className="relative flex md:hidden items-center">
                            <svg className="absolute left-3 w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="font-poppins pl-9 pr-4 py-2 bg-white border border-[#F3D9CB] rounded-sm
                                           text-[12px] text-[#5A1A2B] placeholder-[#C9B5A8]
                                           focus:outline-none focus:border-[#F37966] transition-colors w-44"
                            />
                        </div>

                        {/* Has images chip */}
                        <button
                            onClick={() => setHasImages(!hasImages)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm cursor-pointer
                                        font-poppins text-[10px] uppercase tracking-[0.12em] transition-all duration-200
                                        ${hasImages
                                    ? 'bg-[#5A1A2B] text-[#F9E0D6]'
                                    : 'bg-white border border-[#F3D9CB] text-[#6B7280] hover:border-[#C9B5A8] hover:text-[#5A1A2B]'
                                }`}
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                            </svg>
                            With Images
                        </button>

                        {/* Price range */}
                        <div className="inline-flex items-center gap-1.5">
                            <input
                                type="number"
                                placeholder="Min ₹"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-20 px-3 py-2 bg-white border border-[#F3D9CB] rounded-sm font-poppins text-[11px] text-[#5A1A2B] placeholder-[#C9B5A8] focus:outline-none focus:border-[#F37966] transition-colors"
                            />
                            <span className="text-[#C9B5A8] text-[11px]">–</span>
                            <input
                                type="number"
                                placeholder="Max ₹"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-20 px-3 py-2 bg-white border border-[#F3D9CB] rounded-sm font-poppins text-[11px] text-[#5A1A2B] placeholder-[#C9B5A8] focus:outline-none focus:border-[#F37966] transition-colors"
                            />
                        </div>

                        {/* Clear filters */}
                        {(search || hasImages || minPrice !== '' || maxPrice !== '' || (selectedCategory && selectedCategory !== 'All Cakes')) && (
                            <button
                                onClick={() => { setSearch(''); setHasImages(false); setSelectedCategory('All Cakes'); setMinPrice(''); setMaxPrice(''); }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm cursor-pointer
                                           font-poppins text-[10px] uppercase tracking-[0.12em]
                                           text-[#F37966] border border-[rgba(138,110,82,0.3)]
                                           hover:bg-[rgba(138,110,82,0.06)] transition-all duration-200"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setSortOpen(!sortOpen)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#F3D9CB] rounded-sm
                                       font-poppins text-[10px] uppercase tracking-[0.12em] text-[#6B7280]
                                       hover:border-[#C9B5A8] hover:text-[#5A1A2B] transition-all duration-200 cursor-pointer"
                        >
                            Sort By
                            <svg className={`w-3 h-3 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {sortOpen && (
                            <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-[#F3D9CB] rounded-sm
                                            shadow-[0_8px_24px_rgba(90, 26, 43,0.08)] z-20 py-1">
                                {SORT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 font-poppins text-[11px] tracking-[0.04em] cursor-pointer
                                                    transition-colors duration-150
                                                    ${sortBy === opt.value
                                                ? 'text-[#F37966] bg-[rgba(138,110,82,0.06)]'
                                                : 'text-[#6B7280] hover:text-[#5A1A2B] hover:bg-[#F9E0D6]'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── PRODUCT GRID ── */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-sm border border-[#F3D9CB] overflow-hidden">
                                <div className="aspect-[4/5] bg-[#F9E0D6] animate-pulse" />
                                <div className="p-5 space-y-3">
                                    <div className="h-5 w-2/3 bg-[#F9E0D6] rounded animate-pulse" />
                                    <div className="h-3 w-full bg-[#F9E0D6] rounded animate-pulse" />
                                    <div className="h-3 w-1/2 bg-[#F9E0D6] rounded animate-pulse" />
                                    <div className="h-5 w-1/4 bg-[#F9E0D6] rounded animate-pulse mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {visibleProducts.map((product, idx) => (
                                <ProductCard key={product._id || idx} product={product} />
                            ))}
                        </div>

                        {/* Infinite-scroll sentinel + spinner */}
                        {hasMore && (
                            <div ref={sentinelRef} className="flex justify-center py-10">
                                <div className="w-6 h-6 border-2 border-[#5A1A2B] border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </>
                ) : (
                    /* ── EMPTY STATE ── */
                    <div className="flex flex-col items-center justify-center py-28 text-center">
                        <div className="w-20 h-20 rounded-full bg-[#F9E0D6] border border-[#F3D9CB]
                                        flex items-center justify-center mb-8">
                            {search ? (
                                <svg className="w-8 h-8 text-[#C9B5A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-[#C9B5A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            )}
                        </div>
                        <h2 className="font-baloo text-[28px] font-light text-[#5A1A2B] mb-2">
                            {search
                                ? <>No results for <em className="not-italic italic text-[#F37966]">"{search}"</em></>
                                : <>No cakes <em className="not-italic italic text-[#F37966]">yet.</em></>
                            }
                        </h2>
                        <p className="font-poppins text-[13px] font-light text-[#6B7280] max-w-xs leading-relaxed">
                            {search
                                ? 'Try a different search term or clear your filters.'
                                : 'The catalogue is empty. Check back soon.'
                            }
                        </p>
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="mt-8 font-poppins px-6 py-3 bg-[#5A1A2B] text-[#F9E0D6] rounded-sm
                                           text-[11px] uppercase tracking-[0.18em] cursor-pointer
                                           transition-all duration-200 hover:bg-[#43121F] active:scale-[0.98]"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                )}
            </main>

            {/* ── FOOTER ── */}
            <footer className="border-t border-[#F3D9CB] mt-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex items-center justify-between">
                    <span className="font-poppins text-[11px] font-light text-[#C9B5A8] tracking-[0.04em]">
                        © 2026 Cakeology. All rights reserved.
                    </span>
                    <span className="font-poppins text-[11px] font-light text-[#C9B5A8] tracking-[0.04em]">
                        {filtered.length} of {products?.length || 0} products
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;
