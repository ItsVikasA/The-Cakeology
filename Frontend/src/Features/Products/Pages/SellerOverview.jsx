import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useOrder from '../../Orders/Hooks/useOrder';
import RefundAlertBanner from '../../../Shared/components/RefundAlertBanner';
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const PIE_COLORS = ['#F37966', '#5A1A2B', '#D05D4E', '#6B7280', '#d9c7a8', '#6b4a2b', '#3a7d44', '#2f6fb0'];

const fmtDay = (d) => {
    try {
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    } catch { return d; }
};

const STATUS_BADGE = {
    placed: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-teal-50 text-teal-700 border-teal-200',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const MetricCard = ({ label, value, accent }) => (
    <div className="bg-white border border-[#F3D9CB] rounded-sm p-6">
        <span className={`font-baloo block text-[32px] font-semibold leading-none mb-2 ${accent || 'text-[#5A1A2B]'}`}>
            {value}
        </span>
        <span className="block text-[10px] uppercase tracking-[0.14em] font-medium text-[#6B7280]">{label}</span>
    </div>
);

const SellerOverview = () => {
    const { getSellerMetricsHandler, getSellerOrdersHandler, getSellerNotificationsHandler } = useOrder();
    const sellerOrders = useSelector((state) => state.order.sellerOrders);
    const navigate = useNavigate();

    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingRefunds, setPendingRefunds] = useState(0);

    const loadNotifications = () =>
        getSellerNotificationsHandler()
            .then((res) => setPendingRefunds(res?.unresolvedCount || 0))
            .catch(console.error);

    useEffect(() => {
        (async () => {
            try {
                const [m] = await Promise.all([
                    getSellerMetricsHandler(),
                    getSellerOrdersHandler(),
                ]);
                setMetrics(m);
            } catch (e) {
                console.error('Failed to load overview:', e);
            } finally {
                setLoading(false);
            }
        })();
        loadNotifications();
        // Poll so new refund requests surface without a manual refresh.
        const interval = setInterval(loadNotifications, 20000);
        return () => clearInterval(interval);
    }, []);

    const recentOrders = (Array.isArray(sellerOrders) ? sellerOrders : []).slice(0, 6);

    return (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-10">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] font-medium uppercase tracking-[0.16em] text-[#F37966] border border-[rgba(138,110,82,0.25)] bg-[rgba(138,110,82,0.06)]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#F37966]" />
                    Dashboard
                </span>
                <h1 className="font-baloo text-[clamp(34px,4vw,48px)] font-light text-[#5A1A2B] leading-[1.1] mt-4">
                    Overview
                </h1>
                <p className="font-poppins text-[13.5px] font-light text-[#6B7280] mt-2">
                    A snapshot of your store's performance.
                </p>
            </div>

            {/* Refund requests live in the dedicated Notifications section. */}
            <RefundAlertBanner count={pendingRefunds} to="/product/notifications" />

            {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="bg-white border border-[#F3D9CB] rounded-sm p-6">
                            <div className="h-8 w-1/2 bg-[#F9E0D6] rounded animate-pulse mb-3" />
                            <div className="h-3 w-2/3 bg-[#F9E0D6] rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Metric cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        <MetricCard label="Revenue" value={`₹${(metrics?.revenue || 0).toLocaleString('en-IN')}`} />
                        <MetricCard label="Units Sold" value={metrics?.unitsSold ?? 0} />
                        <MetricCard label="Orders" value={metrics?.orderCount ?? 0} />
                        <MetricCard
                            label="Low Stock Items"
                            value={metrics?.lowStock?.length ?? 0}
                            accent={metrics?.lowStock?.length ? 'text-[#c0392b]' : 'text-[#5A1A2B]'}
                        />
                    </div>

                    {/* Sales Analytics — Recharts */}
                    <div className="mb-10">
                        <h2 className="font-baloo text-2xl font-light text-[#5A1A2B] mb-4">Sales Analytics</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Revenue over time (area) */}
                            <div className="bg-white border border-[#F3D9CB] rounded-sm p-6 lg:col-span-2">
                                <h3 className="font-poppins text-[11px] uppercase tracking-[0.14em] text-[#F37966] font-medium mb-4">Revenue · Last 30 Days</h3>
                                <ResponsiveContainer width="100%" height={240}>
                                    <AreaChart data={metrics?.salesSeries || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#F37966" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#F37966" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F9E0D6" />
                                        <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 10, fill: '#6B7280' }} interval="preserveStartEnd" />
                                        <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                                        <Tooltip
                                            labelFormatter={fmtDay}
                                            formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                                            contentStyle={{ fontSize: 12, borderRadius: 2, border: '1px solid #F3D9CB' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#F37966" strokeWidth={2} fill="url(#revGradient)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Revenue by category (pie) */}
                            <div className="bg-white border border-[#F3D9CB] rounded-sm p-6">
                                <h3 className="font-poppins text-[11px] uppercase tracking-[0.14em] text-[#F37966] font-medium mb-4">Revenue by Category</h3>
                                {metrics?.categoryBreakdown?.length ? (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <PieChart>
                                            <Pie
                                                data={metrics.categoryBreakdown}
                                                dataKey="revenue"
                                                nameKey="category"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                innerRadius={45}
                                            >
                                                {metrics.categoryBreakdown.map((_, i) => (
                                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v, n) => [`₹${Number(v).toLocaleString('en-IN')}`, n]} contentStyle={{ fontSize: 12, borderRadius: 2, border: '1px solid #F3D9CB' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-[13px] text-[#6B7280]">No sales data yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Orders per day (bar) */}
                        <div className="bg-white border border-[#F3D9CB] rounded-sm p-6 mt-6">
                            <h3 className="font-poppins text-[11px] uppercase tracking-[0.14em] text-[#F37966] font-medium mb-4">Orders · Last 30 Days</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={metrics?.salesSeries || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F9E0D6" />
                                    <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 10, fill: '#6B7280' }} interval="preserveStartEnd" />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#6B7280' }} />
                                    <Tooltip labelFormatter={fmtDay} contentStyle={{ fontSize: 12, borderRadius: 2, border: '1px solid #F3D9CB' }} />
                                    <Bar dataKey="orders" fill="#5A1A2B" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                        {/* Best sellers */}
                        <div className="bg-white border border-[#F3D9CB] rounded-sm p-6">
                            <h3 className="font-baloo text-xl font-light text-[#5A1A2B] mb-4">Best Sellers</h3>
                            {metrics?.bestSellers?.length ? (
                                <div className="space-y-3">
                                    {metrics.bestSellers.map((b, i) => (
                                        <div key={i} className="flex items-center justify-between text-[13px]">
                                            <span className="text-[#5A1A2B] truncate max-w-[220px]">{i + 1}. {b.title}</span>
                                            <span className="text-[#F37966] font-medium whitespace-nowrap">{b.units} sold · ₹{b.revenue.toLocaleString('en-IN')}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[13px] text-[#6B7280]">No sales yet.</p>
                            )}
                        </div>

                        {/* Low stock */}
                        <div className="bg-white border border-[#F3D9CB] rounded-sm p-6">
                            <h3 className="font-baloo text-xl font-light text-[#5A1A2B] mb-4">Low / Out of Stock</h3>
                            {metrics?.lowStock?.length ? (
                                <div className="space-y-3">
                                    {metrics.lowStock.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between text-[13px]">
                                            <span className="text-[#5A1A2B] truncate max-w-[220px]">{p.title}</span>
                                            <span className={`font-medium whitespace-nowrap ${p.stock === 0 ? 'text-[#c0392b]' : 'text-[#6B7280]'}`}>
                                                {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[13px] text-[#6B7280]">All products are well stocked.</p>
                            )}
                        </div>
                    </div>

                    {/* Recent orders */}
                    <div className="bg-white border border-[#F3D9CB] rounded-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-baloo text-xl font-light text-[#5A1A2B]">Recent Orders</h3>
                            <button
                                onClick={() => navigate('/product/orders')}
                                className="text-[11px] uppercase tracking-[0.12em] text-[#F37966] hover:text-[#5A1A2B] transition-colors"
                            >
                                View all →
                            </button>
                        </div>
                        {recentOrders.length ? (
                            <div className="divide-y divide-[#F9E0D6]">
                                {recentOrders.map((o) => {
                                    const status = o.sellerStatus || o.status || 'placed';
                                    return (
                                        <div key={o._id} className="flex items-center justify-between py-3 text-[13px]">
                                            <div className="min-w-0">
                                                <p className="text-[#5A1A2B] font-medium">#{o._id.slice(-8).toUpperCase()}</p>
                                                <p className="text-[#6B7280] text-[12px] truncate max-w-[260px]">
                                                    {o.userId?.fullname || 'Customer'} · {o.items?.length || 0} item(s)
                                                </p>
                                            </div>
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider border ${STATUS_BADGE[status] || STATUS_BADGE.placed}`}>
                                                {status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-[13px] text-[#6B7280]">No orders yet.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default SellerOverview;
