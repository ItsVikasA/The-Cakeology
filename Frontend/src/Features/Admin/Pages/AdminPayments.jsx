import React, { useEffect, useState } from 'react';
import useAdmin from '../Hook/useAdmin';

const FILTERS = ['all', 'paid', 'pending', 'failed', 'refunded'];

const statusBadge = (p) => {
    if (p.refunded) return 'bg-purple-50 text-purple-700';
    return {
        paid: 'bg-emerald-50 text-emerald-700',
        pending: 'bg-amber-50 text-amber-700',
        failed: 'bg-red-50 text-red-700',
    }[p.status] || 'bg-[#F9E0D6] text-[#6B7280]';
};

const Card = ({ label, value, accent }) => (
    <div className="bg-white border border-[#F3D9CB] rounded-sm p-5">
        <span className={`font-baloo block text-[26px] font-semibold leading-none mb-1.5 ${accent || 'text-[#5A1A2B]'}`}>{value}</span>
        <span className="block text-[10px] uppercase tracking-[0.14em] font-medium text-[#6B7280]">{label}</span>
    </div>
);

const AdminPayments = () => {
    const { getTransactionsHandler, refundTransactionHandler } = useAdmin();

    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [busyId, setBusyId] = useState(null);
    const [confirmId, setConfirmId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await getTransactionsHandler({ status: filter });
            setPayments(res.payments || []);
            setSummary(res.summary || null);
        } catch (e) {
            console.error('Failed to load transactions:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

    const handleRefund = async (p) => {
        setBusyId(p._id);
        try { await refundTransactionHandler(p._id); setConfirmId(null); await load(); }
        catch (e) { alert(e?.response?.data?.message || 'Refund failed'); }
        finally { setBusyId(null); }
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-8">
                <h1 className="font-baloo text-[clamp(30px,4vw,44px)] font-light text-[#5A1A2B] leading-[1.1]">Payments & Transactions</h1>
                <p className="font-poppins text-[13px] font-light text-[#6B7280] mt-2">All payment activity across the store.</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card label="Net Collected" value={`₹${(summary?.collected || 0).toLocaleString('en-IN')}`} />
                <Card label="Refunded" value={`₹${(summary?.refundedTotal || 0).toLocaleString('en-IN')}`} accent={summary?.refundedTotal ? 'text-purple-700' : 'text-[#5A1A2B]'} />
                <Card label="Paid Orders" value={summary?.paidCount ?? 0} />
                <Card label="Failed / Pending" value={`${summary?.failedCount ?? 0} / ${summary?.pendingCount ?? 0}`} />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full font-poppins text-[11px] uppercase tracking-[0.12em] capitalize transition-all
                            ${filter === f ? 'bg-[#5A1A2B] text-white' : 'bg-white border border-[#F3D9CB] text-[#6B7280] hover:border-[#F37966] hover:text-[#5A1A2B]'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-white border border-[#F3D9CB] rounded-sm animate-pulse" />)}
                </div>
            ) : payments.length === 0 ? (
                <div className="bg-white border border-[#F3D9CB] rounded-sm p-10 text-center text-[13px] text-[#6B7280]">No transactions found.</div>
            ) : (
                <div className="bg-white border border-[#F3D9CB] rounded-sm overflow-hidden">
                    {payments.map((p, idx) => (
                        <div key={p._id} className={`flex items-center gap-4 px-4 py-3 ${idx > 0 ? 'border-t border-[#F9E0D6]' : ''}`}>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-poppins text-[13px] text-[#5A1A2B] font-medium">{p.userId?.fullname || 'Customer'}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider ${statusBadge(p)}`}>
                                        {p.refunded ? 'Refunded' : p.status}
                                    </span>
                                </div>
                                <p className="text-[11px] text-[#6B7280] truncate font-mono">{p.order?.razorpay_payment_id || p.order?.razorpay_order_id || '—'}</p>
                                <p className="text-[11px] text-[#6B7280]">{fmtDate(p.createdAt)}</p>
                            </div>
                            <span className="font-baloo text-xl font-semibold text-[#5A1A2B] whitespace-nowrap">
                                ₹{(p.price?.amount || 0).toLocaleString('en-IN')}
                            </span>
                            <div className="w-28 text-right shrink-0">
                                {p.status === 'paid' && !p.refunded ? (
                                    confirmId === p._id ? (
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <button onClick={() => setConfirmId(null)} disabled={busyId === p._id} className="px-2.5 py-1.5 border border-[#F3D9CB] text-[#6B7280] rounded-sm text-[10px] uppercase hover:text-[#5A1A2B] disabled:opacity-50">No</button>
                                            <button onClick={() => handleRefund(p)} disabled={busyId === p._id} className="px-2.5 py-1.5 bg-[#c0392b] text-white rounded-sm text-[10px] uppercase hover:bg-[#a93226] disabled:opacity-50">Refund</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setConfirmId(p._id)} className="px-3 py-1.5 border border-[#F3D9CB] text-[#c0392b] rounded-sm text-[10px] uppercase tracking-[0.1em] hover:bg-[#fce8e8]">Refund</button>
                                    )
                                ) : p.refunded ? (
                                    <span className="text-[11px] text-purple-700">Refunded</span>
                                ) : null}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminPayments;
