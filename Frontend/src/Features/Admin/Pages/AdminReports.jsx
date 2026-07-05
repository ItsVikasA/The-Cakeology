import React, { useEffect, useState } from 'react';
import useAdmin from '../Hook/useAdmin';
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const RANGES = [{ label: '7 Days', value: 7 }, { label: '30 Days', value: 30 }, { label: '90 Days', value: 90 }];
const PIE_COLORS = ['#F37966', '#5A1A2B', '#D05D4E', '#6B7280', '#d9c7a8', '#6b4a2b', '#3a7d44', '#2f6fb0'];

const fmtDay = (d) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch { return d; } };

// Generate + download a CSV from an array of objects.
const downloadCSV = (filename, rows) => {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(','),
        ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
};

const Card = ({ label, value }) => (
    <div className="bg-white border border-[#F3D9CB] rounded-sm p-5">
        <span className="font-baloo block text-[26px] font-semibold leading-none mb-1.5 text-[#5A1A2B]">{value}</span>
        <span className="block text-[10px] uppercase tracking-[0.14em] font-medium text-[#6B7280]">{label}</span>
    </div>
);

const Panel = ({ title, onExport, children }) => (
    <div className="bg-white border border-[#F3D9CB] rounded-sm p-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-poppins text-[11px] uppercase tracking-[0.14em] text-[#F37966] font-medium">{title}</h3>
            {onExport && (
                <button onClick={onExport} className="text-[10px] uppercase tracking-[0.12em] text-[#F37966] hover:text-[#5A1A2B] border border-[#F3D9CB] rounded-sm px-2.5 py-1">
                    Export CSV
                </button>
            )}
        </div>
        {children}
    </div>
);

const AdminReports = () => {
    const { getReportsHandler } = useAdmin();
    const [range, setRange] = useState(30);
    const [r, setR] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getReportsHandler(range).then(setR).catch(console.error).finally(() => setLoading(false));
    }, [range]);

    return (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-baloo text-[clamp(30px,4vw,44px)] font-light text-[#5A1A2B] leading-[1.1]">Reports</h1>
                    <p className="font-poppins text-[13px] font-light text-[#6B7280] mt-2">Sales, revenue, customer and product performance.</p>
                </div>
                <div className="flex gap-2">
                    {RANGES.map((rg) => (
                        <button key={rg.value} onClick={() => setRange(rg.value)}
                            className={`px-4 py-2 rounded-full font-poppins text-[11px] uppercase tracking-[0.12em] transition-all
                                ${range === rg.value ? 'bg-[#5A1A2B] text-white' : 'bg-white border border-[#F3D9CB] text-[#6B7280] hover:border-[#F37966] hover:text-[#5A1A2B]'}`}>
                            {rg.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="h-64 bg-white border border-[#F3D9CB] rounded-sm animate-pulse" />
            ) : (
                <div className="space-y-6">
                    {/* KPIs */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                        <Card label="Revenue" value={`₹${(r?.totalRevenue || 0).toLocaleString('en-IN')}`} />
                        <Card label="Orders" value={r?.totalOrders ?? 0} />
                        <Card label="Units Sold" value={r?.totalUnits ?? 0} />
                        <Card label="Avg Order Value" value={`₹${(r?.avgOrderValue || 0).toLocaleString('en-IN')}`} />
                        <Card label="New Customers" value={r?.newCustomers ?? 0} />
                    </div>

                    {/* Sales report */}
                    <Panel title={`Sales · Last ${range} Days`} onExport={() => downloadCSV(`sales-${range}d.csv`, r?.salesSeries)}>
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={r?.salesSeries || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="repRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F37966" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#F37966" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F9E0D6" />
                                <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 10, fill: '#6B7280' }} interval="preserveStartEnd" />
                                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} />
                                <Tooltip labelFormatter={fmtDay} formatter={(v, n) => [n === 'revenue' ? `₹${Number(v).toLocaleString('en-IN')}` : v, n]} contentStyle={{ fontSize: 12, borderRadius: 2, border: '1px solid #F3D9CB' }} />
                                <Area type="monotone" dataKey="revenue" stroke="#F37966" strokeWidth={2} fill="url(#repRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Panel>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Revenue by category */}
                        <Panel title="Revenue by Category" onExport={() => downloadCSV('category-revenue.csv', r?.categoryRevenue)}>
                            {r?.categoryRevenue?.length ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <Pie data={r.categoryRevenue} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                                            {r.categoryRevenue.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip formatter={(v, n) => [`₹${Number(v).toLocaleString('en-IN')}`, n]} contentStyle={{ fontSize: 12, borderRadius: 2, border: '1px solid #F3D9CB' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : <p className="text-[13px] text-[#6B7280]">No data.</p>}
                        </Panel>

                        {/* Product performance */}
                        <Panel title="Top Products" onExport={() => downloadCSV('top-products.csv', r?.topProducts)}>
                            {r?.topProducts?.length ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={r.topProducts} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#F9E0D6" />
                                        <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} />
                                        <YAxis type="category" dataKey="title" width={90} tick={{ fontSize: 9, fill: '#6B7280' }} />
                                        <Tooltip formatter={(v, n) => [n === 'revenue' ? `₹${Number(v).toLocaleString('en-IN')}` : v, n]} contentStyle={{ fontSize: 12, borderRadius: 2, border: '1px solid #F3D9CB' }} />
                                        <Bar dataKey="revenue" fill="#5A1A2B" radius={[0, 2, 2, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p className="text-[13px] text-[#6B7280]">No data.</p>}
                        </Panel>
                    </div>

                    {/* Customer report */}
                    <Panel title="Top Customers" onExport={() => downloadCSV('top-customers.csv', r?.topCustomers)}>
                        {r?.topCustomers?.length ? (
                            <div className="divide-y divide-[#F9E0D6]">
                                {r.topCustomers.map((c, i) => (
                                    <div key={i} className="flex items-center justify-between py-2.5 text-[13px]">
                                        <div className="min-w-0">
                                            <span className="text-[#5A1A2B]">{i + 1}. {c.name}</span>
                                            <span className="text-[#6B7280] text-[12px] ml-2">{c.email}</span>
                                        </div>
                                        <span className="text-[#F37966] font-medium whitespace-nowrap">₹{c.spent.toLocaleString('en-IN')} · {c.orders} order(s)</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-[13px] text-[#6B7280]">No customer activity in this period.</p>}
                    </Panel>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
