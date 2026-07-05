import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import useProduct from "../Hook/useProduct";
import { useNavigate } from "react-router-dom";
import SellerProductCard from "../components/SellerProductCard";

const SellerProductsPage = () => {
    const { SellerProductsHandler } = useProduct();
    const sellerProducts = useSelector((state) => state.products.SellerProducts);
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                await SellerProductsHandler();
            } catch (e) {
                console.error('Failed to load products:', e);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = useMemo(() => {
        const list = Array.isArray(sellerProducts) ? sellerProducts : [];
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter((p) => p?.title?.toLowerCase().includes(q));
    }, [sellerProducts, search]);

    return (
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
            {/* Title + actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-baloo text-[clamp(30px,4vw,44px)] font-light text-[#5A1A2B] leading-[1.1]">
                        Products
                    </h1>
                    <p className="font-poppins text-[13px] font-light text-[#6B7280] mt-2">
                        {sellerProducts?.length || 0} item{(sellerProducts?.length || 0) === 1 ? '' : 's'} in your catalogue
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search cakes…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="font-poppins pl-9 pr-4 py-2.5 bg-white border border-[#F3D9CB] rounded-sm text-[12px] text-[#5A1A2B] placeholder-[#C9B5A8] focus:outline-none focus:border-[#F37966] transition-colors w-48"
                        />
                    </div>
                    <button
                        onClick={() => navigate("/product/createProduct")}
                        className="font-poppins flex items-center gap-2 px-5 py-2.5 bg-[#5A1A2B] text-[#F9E0D6] rounded-sm text-[11px] font-medium uppercase tracking-[0.18em] cursor-pointer transition-all duration-200 hover:bg-[#43121F] active:scale-[0.98] whitespace-nowrap"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Product
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-sm border border-[#F3D9CB] overflow-hidden">
                            <div className="aspect-[4/5] bg-[#F9E0D6] animate-pulse" />
                            <div className="p-5 space-y-3">
                                <div className="h-4 w-2/3 bg-[#F9E0D6] rounded animate-pulse" />
                                <div className="h-3 w-full bg-[#F9E0D6] rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map((product) => (
                        <SellerProductCard key={product._id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-20 h-20 rounded-full bg-[#F9E0D6] border border-[#F3D9CB] flex items-center justify-center mb-8">
                        <svg className="w-8 h-8 text-[#C9B5A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h2 className="font-baloo text-[28px] font-light text-[#5A1A2B] mb-2">
                        {search ? <>No matches for <em className="not-italic italic text-[#F37966]">"{search}"</em></> : <>No products <em className="not-italic italic text-[#F37966]">yet.</em></>}
                    </h2>
                    <p className="font-poppins text-[13px] font-light text-[#6B7280] mb-8 max-w-xs leading-relaxed">
                        {search ? 'Try a different search.' : 'Start building your menu by adding your first cake.'}
                    </p>
                    {!search && (
                        <button
                            onClick={() => navigate("/product/createProduct")}
                            className="font-poppins flex items-center gap-2.5 px-6 py-3.5 bg-[#5A1A2B] text-[#F9E0D6] rounded-sm text-[11px] font-medium uppercase tracking-[0.18em] cursor-pointer transition-all duration-200 hover:bg-[#43121F] active:scale-[0.98]"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Create First Product
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default SellerProductsPage;
