import React, { useEffect, useState, useMemo } from 'react';
import useAdmin from '../Hook/useAdmin';
import useCustomCake from '../../CustomCake/Hook/useCustomCake';
import RefundAlertBanner from '../../../Shared/components/RefundAlertBanner';

// Fulfillment status → display label + badge colors.
const STATUS_CONFIG = {
    placed: { label: 'New', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    confirmed: { label: 'Preparing', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
    ready: { label: 'Ready', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const STATUS_FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'placed', label: 'New' },
    { key: 'confirmed', label: 'Preparing' },
    { key: 'ready', label: 'Ready' },
    { key: 'cancelled', label: 'Cancelled' },
];

const formatDate = (d) => {
    if (!d) return '';
    try {
        return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
    } catch { return ''; }
};

const shortId = (id) => (id ? `#${id.slice(-8).toUpperCase()}` : '');

// Derives the payment badge from method + paid flag.
const paymentBadge = (o) => {
    if (o.paymentMethod === 'razorpay') return { label: 'Paid · Razorpay', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (o.paid) return { label: 'Paid · Manual', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    return { label: 'Awaiting payment', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
};

// Refund badge (only relevant on cancelled orders that had money collected).
const refundBadge = (o) => {
    if (!o.refund) return null;
    if (o.refund.resolved) return { label: `Refunded by ${o.refund.resolvedBy || 'staff'}`, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    return { label: 'Refund pending', cls: 'bg-red-50 text-red-700 border-red-200' };
};

const AdminOrders = () => {
    const { getAdminOrdersHandler } = useAdmin();
    const { adminCancelCustomHandler } = useCustomCake();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [busyId, setBusyId] = useState(null);
    const [notice, setNotice] = useState('');

    const load = () =>
        getAdminOrdersHandler()
            .then((res) => setOrders(Array.isArray(res) ? res : []))
            .catch(console.error)
            .finally(() => setLoading(false));

    const handleCustomRefund = async (o) => {
        const online = o.paymentMethod === 'razorpay';
        const ok = window.confirm(
            online
                ? `Cancel this custom order and issue a full Razorpay refund of ₹${(o.amount || 0).toLocaleString('en-IN')}?`
                : `Cancel this custom order? It was paid via WhatsApp — refund ₹${(o.amount || 0).toLocaleString('en-IN')} to the buyer manually.`
        );
        if (!ok) return;
        setBusyId(o._id);
        setNotice('');
        try {
            const res = await adminCancelCustomHandler(o._id);
            setNotice(res?.message || 'Order cancelled.');
            await load();
        } catch (err) {
            setNotice(err?.response?.data?.message || 'Could not cancel / refund this order.');
        } finally {
            setBusyId(null);
        }
    };

    useEffect(() => {
        load();
        // Poll so new/cancelled orders and refund states surface live.
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);

    const counts = useMemo(() => {
        const c = { all: orders.length, placed: 0, confirmed: 0, ready: 0, cancelled: 0 };
        for (const o of orders) if (c[o.status] !== undefined) c[o.status] += 1;
        return c;
    }, [orders]);

    const pendingRefunds = useMemo(
        () => orders.filter((o) => o.refund && !o.refund.resolved).length,
        [orders]
    );

    const filtered = useMemo(
        () => (activeFilter === 'all' ? orders : orders.filter((o) => o.status === activeFilter)),
        [orders, activeFilter]
    );

    return (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-8">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] font-medium uppercase tracking-[0.16em] text-[#c0392b] border border-[rgba(192,57,43,0.25)] bg-[rgba(192,57,43,0.06)]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#c0392b]" />
                    Admin
                </span>
                <h1 className="font-baloo text-[clamp(34px,4vw,48px)] font-light text-[#5A1A2B] leading-[1.1] mt-4">Orders</h1>
                <p className="font-poppins text-[13.5px] font-light text-[#6B7280] mt-2">Live view of every order — status, payment, and refunds.</p>
            </div>

            {/* Status count cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
                {[
                    { key: 'all', label: 'Total', accent: 'text-[#5A1A2B]' },
                    { key: 'placed', label: 'New', accent: 'text-amber-600' },
                    { key: 'confirmed', label: 'Preparing', accent: 'text-teal-600' },
                    { key: 'ready', label: 'Ready', accent: 'text-emerald-600' },
                    { key: 'cancelled', label: 'Cancelled', accent: 'text-red-600' },
                ].map((c) => (
                    <button
                        key={c.key}
                        onClick={() => setActiveFilter(c.key)}
                        className={`text-left bg-white border rounded-sm p-4 transition-colors ${activeFilter === c.key ? 'border-[#5A1A2B]' : 'border-[#F3D9CB] hover:border-[#C9B5A8]'}`}
                    >
                        <span className={`font-baloo block text-[28px] font-semibold leading-none mb-1 ${c.accent}`}>{counts[c.key] ?? 0}</span>
                        <span className="block text-[10px] uppercase tracking-[0.14em] font-medium text-[#6B7280]">{c.label}</span>
                    </button>
                ))}
            </div>

            <RefundAlertBanner count={pendingRefunds} to="/admin/notifications" />

            {notice && (
                <div className="mb-6 p-3 bg-[#e6f0e8] text-[#3a7d44] text-[13px] rounded-sm">{notice}</div>
            )}

            {/* Filter tabs */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
                {STATUS_FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setActiveFilter(f.key)}
                        className={`px-4 py-2 rounded-full font-poppins text-[11px] uppercase tracking-[0.12em] transition-all cursor-pointer
                            ${activeFilter === f.key ? 'bg-[#5A1A2B] text-white' : 'bg-white border border-[#F3D9CB] text-[#6B7280] hover:border-[#F37966] hover:text-[#5A1A2B]'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 bg-white border border-[#F3D9CB] rounded-sm animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <p className="font-baloo text-[24px] font-light text-[#5A1A2B]">No orders here.</p>
                    <p className="font-poppins text-[13px] text-[#6B7280] mt-1">Try a different filter.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((o) => {
                        const sc = STATUS_CONFIG[o.status] || STATUS_CONFIG.placed;
                        const pay = paymentBadge(o);
                        const refund = refundBadge(o);
                        return (
                            <div key={o._id} className="bg-white border border-[#F3D9CB] rounded-sm p-5">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                            {o.isCustom && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[9px] uppercase tracking-[0.1em] font-semibold border bg-violet-100 text-violet-700 border-violet-200">Custom Cake</span>
                                            )}
                                            {o.isCustom ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.08em] font-medium border bg-violet-50 text-violet-700 border-violet-200">{o.customStatusLabel}</span>
                                            ) : (
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.08em] font-medium border ${sc.cls}`}>{sc.label}</span>
                                            )}
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.08em] font-medium border ${pay.cls}`}>{pay.label}</span>
                                            {refund && (
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.08em] font-medium border ${refund.cls}`}>{refund.label}</span>
                                            )}
                                            {o.isGuest && <span className="px-1.5 py-0.5 rounded-sm bg-[#F9E0D6] text-[9px] uppercase tracking-[0.1em] text-[#F37966]">Guest</span>}
                                        </div>
                                        <p className="font-poppins text-[13px] font-medium text-[#F37966]">{shortId(o._id)} · {formatDate(o.createdAt)}</p>
                                        <p className="font-poppins text-[12.5px] text-[#5A1A2B] mt-0.5">
                                            {o.buyerName}{o.buyerEmail ? <span className="text-[#6B7280]"> · {o.buyerEmail}</span> : null}
                                        </p>
                                        <p className="font-poppins text-[12px] text-[#6B7280] mt-0.5 truncate max-w-lg">
                                            {o.items.map((it) => `${it.title} ×${it.quantity}`).join(' · ')}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-baloo text-xl font-semibold text-[#5A1A2B]">₹{(o.amount || 0).toLocaleString('en-IN')}</p>
                                        {o.deliveryDate && (
                                            <p className="text-[11px] text-[#a06a2c] mt-1">Deliver: {new Date(o.deliveryDate).toDateString()}</p>
                                        )}
                                        {o.isCustom && o.canRefund && (
                                            <button
                                                onClick={() => handleCustomRefund(o)}
                                                disabled={busyId === o._id}
                                                className="mt-2 px-4 py-2 border border-[#e8b4b4] text-[#c0392b] text-[10px] font-medium uppercase tracking-[0.12em] rounded-sm hover:bg-[#fce8e8] transition-colors disabled:opacity-50"
                                            >
                                                {busyId === o._id ? 'Processing…' : 'Cancel & Refund'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
