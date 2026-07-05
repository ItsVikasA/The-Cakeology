import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useProduct from '../Hook/useProduct';

const FILTERS = ['All', 'In Stock', 'Low Stock', 'Out of Stock'];
const LOW_THRESHOLD = 5;

const SellerInventory = () => {
    const { SellerProductsHandler, updateVariantStockHandler } = useProduct();
    const sellerProducts = useSelector((state) => state.products.SellerProducts);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [drafts, setDrafts] = useState({}); // variantId -> string value
    const [savingId, setSavingId] = useState(null);
    const [savedId, setSavedId] = useState(null);

    const load = async () => {
        try {
            await SellerProductsHandler();
        } catch (e) {
            console.error('Failed to load inventory:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // Flatten products -> variant rows.
    const rows = useMemo(() => {
        const list = [];
        (sellerProducts || []).forEach((p) => {
            (p.variants || []).forEach((v) => {
                const attr = v.attribute || v.attributes || {};
                const attrStr = Object.entries(attr).map(([k, val]) => `${k}: ${val}`).join(' · ');
                list.push({
                    productId: p._id,
                    productTitle: p.title,
                    image: v.images?.[0] || p.images?.[0] || null,
                    variantId: v._id,
                    attrStr,
                    stock: v.stock ?? 0,
                });
            });
        });
        return list;
    }, [sellerProducts]);

    const filteredRows = useMemo(() => {
        let list = rows;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((r) => r.productTitle.toLowerCase().includes(q) || r.attrStr.toLowerCase().includes(q));
        }
        if (filter === 'In Stock') list = list.filter((r) => r.stock > LOW_THRESHOLD);
        else if (filter === 'Low Stock') list = list.filter((r) => r.stock > 0 && r.stock <= LOW_THRESHOLD);
        else if (filter === 'Out of Stock') list = list.filter((r) => r.stock === 0);
        return list;
    }, [rows, search, filter]);

    const counts = useMemo(() => ({
        out: rows.filter((r) => r.stock === 0).length,
        low: rows.filter((r) => r.stock > 0 && r.stock <= LOW_THRESHOLD).length,
    }), [rows]);

    const draftValue = (r) => (drafts[r.variantId] !== undefined ? drafts[r.variantId] : String(r.stock));

    const setDraft = (variantId, value) => setDrafts((d) => ({ ...d, [variantId]: value }));

    const save = async (r) => {
        const value = Number(draftValue(r));
        if (Number.isNaN(value) || value < 0) return;
        setSavingId(r.variantId);
        try {
            await updateVariantStockHandler(r.productId, r.variantId, value);
            await SellerProductsHandler();
            setDrafts((d) => { const n = { ...d }; delete n[r.variantId]; return n; });
            setSavedId(r.variantId);
            setTimeout(() => setSavedId(null), 1500);
        } catch (e) {
            console.error('Failed to update stock:', e);
        } finally {
            setSavingId(null);
        }
    };

    const adjust = (r, delta) => {
        const current = Number(draftValue(r)) || 0;
        setDraft(r.variantId, String(Math.max(0, current + delta)));
    };

    const statusBadge = (stock) => {
        if (stock === 0) return <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-[#fce8e8] text-[#c0392b]">Out</span>;
        if (stock <= LOW_THRESHOLD) return <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-amber-50 text-amber-700">Low</span>;
        return <span className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider bg-emerald-50 text-emerald-700">In stock</span>;
    };

    return (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-6">
                <h1 className="font-baloo text-[clamp(30px,4vw,44px)] font-light text-[#5A1A2B] leading-[1.1]">Inventory</h1>
                <p className="font-poppins text-[13px] font-light text-[#6B7280] mt-2">
                    {rows.length} variant{rows.length === 1 ? '' : 's'} · {counts.low} low · {counts.out} out of stock
                </p>
            </div>

            {/* Filters + search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full font-poppins text-[11px] uppercase tracking-[0.12em] transition-all
                                ${filter === f ? 'bg-[#5A1A2B] text-white' : 'bg-white border border-[#F3D9CB] text-[#6B7280] hover:border-[#F37966] hover:text-[#5A1A2B]'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Search…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="font-poppins px-4 py-2.5 bg-white border border-[#F3D9CB] rounded-sm text-[12px] text-[#5A1A2B] placeholder-[#C9B5A8] focus:outline-none focus:border-[#F37966] transition-colors w-48"
                />
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-16 bg-white border border-[#F3D9CB] rounded-sm animate-pulse" />
                    ))}
                </div>
            ) : filteredRows.length === 0 ? (
                <div className="bg-white border border-[#F3D9CB] rounded-sm p-10 text-center">
                    <p className="font-baloo text-xl text-[#5A1A2B] mb-1">Nothing here</p>
                    <p className="text-[13px] text-[#6B7280]">No variants match this filter.</p>
                </div>
            ) : (
                <div className="bg-white border border-[#F3D9CB] rounded-sm overflow-hidden">
                    {filteredRows.map((r, idx) => (
                        <div key={r.variantId} className={`flex items-center gap-4 px-4 py-3 ${idx > 0 ? 'border-t border-[#F9E0D6]' : ''}`}>
                            <div className="w-12 h-12 shrink-0 bg-[#F9E0D6] rounded-sm overflow-hidden">
                                {r.image && <img src={r.image} alt="" className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <button onClick={() => navigate(`/product/sellerProducts/${r.productId}`)} className="font-poppins text-[13px] text-[#5A1A2B] hover:text-[#F37966] transition-colors truncate block text-left">
                                    {r.productTitle}
                                </button>
                                <p className="text-[11px] text-[#6B7280] truncate">{r.attrStr || '—'}</p>
                            </div>
                            <div className="shrink-0">{statusBadge(r.stock)}</div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => adjust(r, -1)} className="w-7 h-7 flex items-center justify-center border border-[#F3D9CB] rounded-sm text-[#5A1A2B] hover:bg-[#F9E0D6]">−</button>
                                <input
                                    type="number"
                                    value={draftValue(r)}
                                    onChange={(e) => setDraft(r.variantId, e.target.value)}
                                    className="w-16 text-center border border-[#F3D9CB] rounded-sm py-1.5 text-[13px] text-[#5A1A2B] focus:outline-none focus:border-[#F37966]"
                                />
                                <button onClick={() => adjust(r, 1)} className="w-7 h-7 flex items-center justify-center border border-[#F3D9CB] rounded-sm text-[#5A1A2B] hover:bg-[#F9E0D6]">+</button>
                                <button
                                    onClick={() => save(r)}
                                    disabled={savingId === r.variantId || Number(draftValue(r)) === r.stock}
                                    className="ml-1 px-3 py-1.5 bg-[#5A1A2B] text-white rounded-sm text-[10px] uppercase tracking-[0.1em] hover:bg-[#43121F] transition-colors disabled:opacity-40"
                                >
                                    {savingId === r.variantId ? '…' : savedId === r.variantId ? 'Saved' : 'Save'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SellerInventory;
