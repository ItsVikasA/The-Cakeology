import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdmin from '../Hook/useAdmin';
import RefundAlertBanner from '../../../Shared/components/RefundAlertBanner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const fmtDay = (d) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch { return d; }
};

const Card = ({ label, value, accent }) => (
    <div className="bg-white border border-[#F3D9CB] rounded-sm p-6">
        <span className={`font-baloo block text-[32px] font-semibold leading-none mb-2 ${accent || 'text-[#5A1A2B]'}`}>{value}</span>
        <span className="block text-[10px] uppercase tracking-[0.14em] font-medium text-[#6B7280]">{label}</span>
    </div>
);

const AdminOverview = () => {
    const { getAdminMetricsHandler, getNotificationsHandler } = useAdmin();
    const navigate = useNavigate();
    const [m, setM] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingRefunds, setPendingRefunds] = useState(0);

    const loadNotifications = () =>
        getNotificationsHandler()
            .then((res) => setPendingRefunds(res?.unresolvedCount || 0))
            .catch(console.error);

    useEffect(() => {
        getAdminMetricsHandler().then(setM).catch(console.error).finally(() => setLoading(false));
        loadNotifications();
        // Poll so new refund requests surface without a manual refresh.
        const interval = setInterval(loadNotifications, 20000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-10">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] font-medium uppercase tracking-[0.16em] text-[#c0392b] border border-[rgba(192,57,43,0.25)] bg-[rgba(192,57,43,0.06)]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#c0392b]" />
                    Admin
                </span>
                <h1 className="font-baloo text-[clamp(34px,4vw,48px)] font-light text-[#5A1A2B] leading-[1.1] mt-4">Platform Overview</h1>
                <p className="font-poppins text-[13.5px] font-light text-[#6B7280] mt-2">Store-wide performance across all sellers and customers.</p>
            </div>

            {/* Refund requests live in the dedicated Notifications section. */}
            <RefundAlertBanner count={pendingRefunds} to="/admin/notifications" />

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 bg-white border border-[#F3D9CB] rounded-sm animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Card label="Total Revenue" value={`₹${(m?.revenue || 0).toLocaleString('en-IN')}`} />
                        <Card label="Orders" value={m?.orderCount ?? 0} />
                        <Card label="Customers" value={m?.buyerCount ?? 0} />
                        <Card label="Products" value={m?.productCount ?? 0} />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        <Card label="Total Users" value={m?.userCount ?? 0} />
                        <Card label="Sellers" value={m?.sellerCount ?? 0} />
                        <Card label="Units Sold" value={m?.unitsSold ?? 0} />
                        <Card label="Blocked Users" value={m?.blockedCount ?? 0} accent={m?.blockedCount ? 'text-[#c0392b]' : 'text-[#5A1A2B]'} />
                    </div>

                    {/* Live order status breakdown */}
                    <div className="bg-white border border-[#F3D9CB] rounded-sm p-6 mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-poppins text-[11px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Orders by Status</h3>
                            <button onClick={() => navigate('/admin/orders')} className="text-[11px] uppercase tracking-[0.12em] text-[#F37966] hover:text-[#5A1A2B] transition-colors">
                                View all →
                            </button>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { key: 'placed', label: 'New', accent: 'text-amber-600' },
                                { key: 'confirmed', label: 'Preparing', accent: 'text-teal-600' },
                                { key: 'ready', label: 'Ready', accent: 'text-emerald-600' },
                                { key: 'cancelled', label: 'Cancelled', accent: 'text-red-600' },
                            ].map((s) => {
                                const found = (m?.statusBreakdown || []).find((b) => b.status === s.key);
                                return (
                                    <div key={s.key} className="border border-[#F3D9CB] rounded-sm p-4">
                                        <span className={`font-baloo block text-[26px] font-semibold leading-none mb-1 ${s.accent}`}>{found?.count ?? 0}</span>
                                        <span className="block text-[10px] uppercase tracking-[0.14em] font-medium text-[#6B7280]">{s.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white border border-[#F3D9CB] rounded-sm p-6">
                        <h3 className="font-poppins text-[11px] uppercase tracking-[0.14em] text-[#F37966] font-medium mb-4">Revenue · Last 30 Days</h3>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={m?.revenueSeries || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#5A1A2B" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#5A1A2B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F9E0D6" />
                                <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 10, fill: '#6B7280' }} interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                                <Tooltip labelFormatter={fmtDay} formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} contentStyle={{ fontSize: 12, borderRadius: 2, border: '1px solid #F3D9CB' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#5A1A2B" strokeWidth={2} fill="url(#adminRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminOverview;
