import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useOrder from '../Hooks/useOrder';
import useCustomCake from '../../CustomCake/Hook/useCustomCake';
import RefundAlertBanner from '../../../Shared/components/RefundAlertBanner';

const STATUS_FLOW = ['placed', 'confirmed', 'ready'];
const STATUS_FILTERS = ['All', 'Placed', 'Confirmed', 'Ready', 'Cancelled'];

const STATUS_CONFIG = {
    placed: { label: 'New', dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    confirmed: { label: 'Preparing', dot: 'bg-teal-500', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    ready: { label: 'Ready', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    cancelled: { label: 'Cancelled', dot: 'bg-red-500', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const orderTimestamp = (order) => {
    const raw = order.createdAt || (order._id && parseInt(order._id.substring(0, 8), 16) * 1000);
    return raw ? new Date(raw).getTime() : 0;
};

const formatDate = (order) => {
    const ts = orderTimestamp(order);
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
    });
};

const formatOrderId = (id) => (id ? `#${id.slice(-8).toUpperCase()}` : '');

// Local YYYY-MM-DD key for grouping orders on the calendar by delivery date.
const dayKey = (date) => {
    const d = new Date(date);
    if (isNaN(d)) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Build the cells for a month grid (leading blanks + each day).
const buildMonthCells = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const startWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
};

const getItemImage = (item) => {
    const product = item.productId;
    if (!product) return null;
    const variant = product.variants?.find((v) => v._id?.toString() === item.variantId?.toString());
    if (variant?.images?.length > 0) return variant.images[0];
    if (product.images?.length > 0) return product.images[0];
    return null;
};

const getVariantAttributes = (item) => {
    const product = item.productId;
    const variant = product?.variants?.find((v) => v._id?.toString() === item.variantId?.toString());
    const attr = variant?.attribute || variant?.attributes;
    if (!attr) return [];
    return Object.entries(attr).map(([k, v]) => `${k}: ${v}`);
};

const SellerOrders = () => {
    const { getSellerOrdersHandler, updateOrderStatusHandler, getSellerNotificationsHandler } = useOrder();
    const { getSellerRequestsHandler } = useCustomCake();
    const sellerOrders = useSelector((state) => state.order.sellerOrders);
    const customRequests = useSelector((state) => state.customCake.sellerRequests);
    const navigate = useNavigate();

    const [activeFilter, setActiveFilter] = useState('All');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
    const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [selectedDay, setSelectedDay] = useState(null); // 'YYYY-MM-DD'
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [pendingRefunds, setPendingRefunds] = useState(0);

    // Custom-cake orders shown alongside catalog orders (managed in the Custom
    // Cakes section). Exclude finished/void ones so this stays an "active" view.
    const CUSTOM_LABEL = { pending: 'New request', quoted: 'Quoted', awaiting_payment: 'Awaiting payment', paid: 'Confirmed', preparing: 'Preparing', ready: 'Ready', delivered: 'Delivered' };
    const activeCustom = useMemo(
        () => (customRequests || []).filter((r) => !['cancelled', 'rejected', 'delivered'].includes(r.status)),
        [customRequests]
    );

    const loadNotifications = () =>
        getSellerNotificationsHandler()
            .then((res) => setPendingRefunds(res?.unresolvedCount || 0))
            .catch(console.error);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try {
                await getSellerOrdersHandler();
                await getSellerRequestsHandler().catch(() => {});
                await loadNotifications();
            } catch (err) {
                console.error('Failed to fetch seller orders:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        load();

        // Poll every 15s so newly placed orders show up without a manual refresh.
        const interval = setInterval(load, 15000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const handleStatusChange = async (orderId, status) => {
        setUpdatingId(orderId);
        try {
            await updateOrderStatusHandler(orderId, status);
            // A cancel may have raised a refund request — refresh so it appears at once.
            await loadNotifications();
        } catch (err) {
            console.error('Failed to update status:', err);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredOrders = useMemo(() => {
        if (!Array.isArray(sellerOrders)) return [];
        const filtered = activeFilter === 'All'
            ? [...sellerOrders]
            : sellerOrders.filter((o) => (o.sellerStatus || o.status)?.toLowerCase() === activeFilter.toLowerCase());

        // Sort the incoming orders date/time-wise.
        const farFuture = Number.MAX_SAFE_INTEGER;
        filtered.sort((a, b) => {
            if (sortBy === 'oldest') return orderTimestamp(a) - orderTimestamp(b);
            if (sortBy === 'delivery') {
                const da = a.deliveryDate ? new Date(a.deliveryDate).getTime() : farFuture;
                const db = b.deliveryDate ? new Date(b.deliveryDate).getTime() : farFuture;
                return da - db; // soonest delivery first
            }
            return orderTimestamp(b) - orderTimestamp(a); // newest first (default)
        });
        return filtered;
    }, [sellerOrders, activeFilter, sortBy]);

    // Group the (status-filtered) orders by their delivery date for the calendar.
    const ordersByDay = useMemo(() => {
        const map = {};
        for (const o of filteredOrders) {
            if (!o.deliveryDate) continue;
            const key = dayKey(o.deliveryDate);
            if (!key) continue;
            (map[key] = map[key] || []).push(o);
        }
        return map;
    }, [filteredOrders]);

    // Orders with no delivery date set (so the seller can still see them in calendar mode).
    const undatedOrders = useMemo(
        () => filteredOrders.filter((o) => !o.deliveryDate),
        [filteredOrders]
    );

    const selectedDayOrders = selectedDay ? (ordersByDay[selectedDay] || []) : [];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9E0D6] flex items-center justify-center font-poppins antialiased">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#5A1A2B] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#6B7280] text-[13px] uppercase tracking-[0.2em]">Loading Orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="font-poppins">
            <main className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
                {/* Title */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] font-medium uppercase tracking-[0.16em] text-[#F37966] border border-[rgba(138,110,82,0.25)] bg-[rgba(138,110,82,0.06)]">
                            <span className="w-[5px] h-[5px] rounded-full bg-[#F37966]" />
                            Seller Dashboard
                        </span>
                    </div>
                    <h1 className="font-baloo text-[clamp(30px,4vw,44px)] font-light text-[#5A1A2B] leading-[1.1] tracking-[-0.01em] mb-3">
                        Incoming <em className="not-italic italic font-light text-[#F37966]">Orders</em>
                    </h1>
                    <p className="font-poppins text-[13.5px] font-light text-[#6B7280] leading-relaxed max-w-md">
                        Track and fulfil customer orders. Status updates are reflected in the customer's account.
                    </p>
                </div>

                {/* Refund requests live in the dedicated Notifications section. */}
                <RefundAlertBanner count={pendingRefunds} to="/product/notifications" />

                {/* Custom cake orders — surfaced here for visibility, with a distinct
                    violet accent to set them apart from catalog orders. Full actions
                    (quote / confirm payment / fulfil) live in the Custom Cakes section. */}
                {activeCustom.length > 0 && (
                    <div className="mb-8 rounded-lg border border-[#d9c9f0] bg-[#f7f2fd] overflow-hidden">
                        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[#e5d9f7] bg-[#efe6fb]">
                            <div className="flex items-center gap-2.5">
                                <span className="w-2 h-2 rounded-full bg-[#7c3aed]" />
                                <h2 className="font-poppins text-[12px] font-semibold uppercase tracking-[0.14em] text-[#5b21b6]">Custom Cake Orders</h2>
                                <span className="text-[11px] text-[#7c3aed] bg-white/70 rounded-full px-2 py-0.5">{activeCustom.length}</span>
                            </div>
                            <button onClick={() => navigate('/product/customRequests')} className="text-[11px] uppercase tracking-[0.12em] font-semibold text-[#7c3aed] hover:underline cursor-pointer">
                                Manage &rarr;
                            </button>
                        </div>
                        <div className="divide-y divide-[#eee3fb]">
                            {activeCustom.map((r) => (
                                <div
                                    key={r._id}
                                    onClick={() => navigate('/product/customRequests')}
                                    className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-[#f2ebfb] transition-colors"
                                >
                                    <img src={r.designImage} alt="" className="w-11 h-11 rounded object-cover flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-poppins text-[13px] text-[#5A1A2B] truncate">
                                            {r.title || 'Custom Cake'} <span className="text-[#6B7280]">· #{r._id.slice(-6).toUpperCase()}</span>
                                        </p>
                                        <p className="text-[11.5px] text-[#6B7280] truncate">
                                            {r.userId?.fullname || 'Customer'}
                                            {r.requiredDate ? ` · needs ${new Date(r.requiredDate).toLocaleDateString()}` : ''}
                                            {r.quotedPrice?.amount ? ` · ₹${r.quotedPrice.amount.toLocaleString()}` : ''}
                                        </p>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#5b21b6] bg-[#efe6fb] rounded-full px-2.5 py-1 whitespace-nowrap">
                                        {CUSTOM_LABEL[r.status] || r.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex flex-wrap items-center gap-2">
                        {STATUS_FILTERS.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`whitespace-nowrap px-5 py-2.5 rounded-full font-poppins text-[11px] uppercase tracking-[0.12em] transition-all duration-300 cursor-pointer
                                    ${activeFilter === filter
                                        ? 'bg-[#5A1A2B] text-white shadow-md'
                                        : 'bg-white border border-[#F3D9CB] text-[#6B7280] hover:border-[#F37966] hover:text-[#5A1A2B]'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* List / Calendar view toggle */}
                        <div className="flex items-center bg-white border border-[#F3D9CB] rounded-full p-0.5">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.1em] transition-colors ${viewMode === 'list' ? 'bg-[#5A1A2B] text-white' : 'text-[#6B7280] hover:text-[#5A1A2B]'}`}
                            >
                                List
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`px-4 py-2 rounded-full text-[11px] uppercase tracking-[0.1em] transition-colors ${viewMode === 'calendar' ? 'bg-[#5A1A2B] text-white' : 'text-[#6B7280] hover:text-[#5A1A2B]'}`}
                            >
                                Calendar
                            </button>
                        </div>
                        {viewMode === 'list' && (
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-white border border-[#F3D9CB] rounded-full px-4 py-2.5 text-[11px] uppercase tracking-[0.1em] text-[#5A1A2B] focus:outline-none focus:border-[#F37966] cursor-pointer"
                            >
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                                <option value="delivery">By delivery date</option>
                            </select>
                        )}
                        <span className="font-poppins text-[11px] text-[#6B7280] uppercase tracking-[0.1em] whitespace-nowrap">
                            {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
                        </span>
                    </div>
                </div>

                {/* List */}
                {!Array.isArray(sellerOrders) || sellerOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-28 text-center">
                        <div className="w-20 h-20 rounded-full bg-[#F9E0D6] border border-[#F3D9CB] flex items-center justify-center mb-8">
                            <svg className="w-8 h-8 text-[#C9B5A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h2 className="font-baloo text-[28px] font-light text-[#5A1A2B] mb-2">
                            No orders <em className="not-italic italic text-[#F37966]">yet.</em>
                        </h2>
                        <p className="font-poppins text-[13px] font-light text-[#6B7280] max-w-xs leading-relaxed">
                            Orders for your products will appear here as customers purchase them.
                        </p>
                    </div>
                ) : viewMode === 'calendar' ? (
                    <div className="space-y-6">
                        {/* Month calendar (orders bucketed by delivery date) */}
                        <div className="bg-white border border-[#F3D9CB] rounded-lg p-5 w-full max-w-xl">
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={() => { setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1)); setSelectedDay(null); }}
                                    className="p-2 rounded-full hover:bg-[#F9E0D6] text-[#5A1A2B]"
                                    aria-label="Previous month"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <h3 className="font-baloo text-2xl font-light text-[#5A1A2B]">
                                    {MONTHS[calMonth.getMonth()]} {calMonth.getFullYear()}
                                </h3>
                                <button
                                    onClick={() => { setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1)); setSelectedDay(null); }}
                                    className="p-2 rounded-full hover:bg-[#F9E0D6] text-[#5A1A2B]"
                                    aria-label="Next month"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {WEEKDAYS.map((w) => (
                                    <div key={w} className="text-center text-[10px] uppercase tracking-wide text-[#6B7280] py-1">{w}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {buildMonthCells(calMonth).map((cell, i) => {
                                    if (!cell) return <div key={`b-${i}`} />;
                                    const key = dayKey(cell);
                                    const count = ordersByDay[key]?.length || 0;
                                    const isSelected = selectedDay === key;
                                    const isToday = key === dayKey(new Date());
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedDay(isSelected ? null : key)}
                                            className={`aspect-square rounded-md flex flex-col items-center justify-center text-[13px] transition-colors
                                                ${isSelected ? 'bg-[#5A1A2B] text-white' : count > 0 ? 'bg-[#fbf0e2] text-[#5A1A2B] hover:bg-[#f3e2c9]' : 'text-[#5A1A2B] hover:bg-[#F9E0D6]'}
                                                ${isToday && !isSelected ? 'ring-1 ring-[#F37966]' : ''}`}
                                        >
                                            <span>{cell.getDate()}</span>
                                            {count > 0 && (
                                                <span className={`mt-0.5 text-[9px] font-semibold ${isSelected ? 'text-white' : 'text-[#a06a2c]'}`}>
                                                    {count} order{count > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Orders due on the selected day */}
                        {selectedDay ? (
                            selectedDayOrders.length > 0 ? (
                                <div className="space-y-5">
                                    <h4 className="font-poppins text-[13px] uppercase tracking-[0.1em] text-[#F37966]">
                                        Due on {new Date(selectedDay).toDateString()} · {selectedDayOrders.length}
                                    </h4>
                                    {selectedDayOrders.map((order) => (
                                        <SellerOrderCard key={order._id} order={order} onStatusChange={handleStatusChange} isUpdating={updatingId === order._id} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-[#6B7280] text-[13px] py-8">No orders due on this day.</p>
                            )
                        ) : (
                            <p className="text-center text-[#6B7280] text-[13px] py-6">Select a highlighted day to see the orders due then.</p>
                        )}

                        {/* Orders with no delivery date set */}
                        {undatedOrders.length > 0 && (
                            <div className="space-y-5 pt-5 border-t border-[#F3D9CB]">
                                <h4 className="font-poppins text-[12px] uppercase tracking-[0.1em] text-[#6B7280]">
                                    No delivery date set · {undatedOrders.length}
                                </h4>
                                {undatedOrders.map((order) => (
                                    <SellerOrderCard key={order._id} order={order} onStatusChange={handleStatusChange} isUpdating={updatingId === order._id} />
                                ))}
                            </div>
                        )}
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <h2 className="font-baloo text-[24px] font-light text-[#5A1A2B] mb-2">
                            No <em className="not-italic italic text-[#F37966]">{activeFilter.toLowerCase()}</em> orders
                        </h2>
                        <p className="font-poppins text-[13px] font-light text-[#6B7280]">Try a different filter.</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {filteredOrders.map((order) => (
                            <SellerOrderCard
                                key={order._id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                isUpdating={updatingId === order._id}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

const SellerOrderCard = ({ order, onStatusChange, isUpdating }) => {
    const status = order.sellerStatus || order.status;
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.placed;
    // Razorpay orders are paid + auto-confirmed on placement, so the seller only
    // moves them to Ready or Cancelled. WhatsApp orders still need manual confirm.
    const isRazorpay = order.paymentMethod === 'razorpay';
    const buyer = order.userId || {};
    const addr = order.address || {};
    // Guest orders have no account — fall back to the address details they entered.
    const buyerName = buyer.fullname || addr.fullName || 'Customer';
    const buyerContact = buyer.contact || addr.phone || '';
    const items = order.items || [];

    const isCancelled = status === 'cancelled';
    const currentStepIdx = STATUS_FLOW.indexOf(status);

    return (
        <div className="bg-white border border-[#F3D9CB] rounded-lg p-5 md:p-6">
            {/* Top row: order meta + status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F9E0D6]">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.08em] font-medium border ${config.bg} ${config.text} ${config.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                            {config.label}
                        </span>
                        <span className="text-[11px] text-[#6B7280] tracking-wide">{formatDate(order)}</span>
                        {/* Payment method — Razorpay orders arrive already paid. */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.08em] font-medium border ${isRazorpay ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#F9E0D6] text-[#F37966] border-[rgba(138,110,82,0.25)]'}`}>
                            {isRazorpay ? 'Paid · Razorpay' : 'WhatsApp / Manual'}
                        </span>
                    </div>
                    <p className="font-poppins text-[13px] font-medium text-[#F37966]">Order ID: {formatOrderId(order._id)}</p>
                </div>

                {/* Buyer info */}
                <div className="text-[12px] text-[#5A1A2B] md:text-right">
                    <p className="font-medium">
                        {buyerName}
                        {order.isGuest && <span className="ml-2 px-1.5 py-0.5 rounded-sm bg-[#F9E0D6] text-[9px] uppercase tracking-[0.1em] text-[#F37966] align-middle">Guest</span>}
                    </p>
                    <p className="text-[#6B7280]">{buyer.email || order.contactEmail || ''}</p>
                    {buyerContact && <p className="text-[#6B7280]">{buyerContact}</p>}
                </div>
            </div>

            {/* Items */}
            <div className="py-4 space-y-3">
                {items.map((item, idx) => {
                    const img = getItemImage(item);
                    const attrs = getVariantAttributes(item);
                    return (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-14 h-14 flex-shrink-0 bg-[#F9E0D6] rounded-md overflow-hidden">
                                {img ? (
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#C9B5A8]">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-poppins text-[13px] text-[#5A1A2B] truncate">{item.productId?.title || 'Product'}</p>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {attrs.map((a, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-[#F9E0D6] text-[10px] uppercase tracking-wider text-[#F37966] rounded-full">{a}</span>
                                    ))}
                                </div>
                            </div>
                            <span className="text-[12px] text-[#6B7280] whitespace-nowrap">Qty: {item.quantity || 1}</span>
                        </div>
                    );
                })}
            </div>

            {/* Shipping address */}
            {order.address && (
                <div className="py-4 border-t border-[#F9E0D6]">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#F37966] font-medium mb-1.5">Ship To</p>
                    <p className="text-[13px] text-[#5A1A2B] font-medium">{order.address.fullName} · {order.address.phone}</p>
                    <p className="text-[12px] text-[#6B7280] leading-relaxed">
                        {order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ''}, {order.address.city}, {order.address.state} - {order.address.pincode}
                    </p>
                    {order.deliveryDate && (
                        <p className="text-[12px] text-[#a06a2c] mt-1.5 font-medium">
                            Deliver by: {new Date(order.deliveryDate).toDateString()}
                        </p>
                    )}
                </div>
            )}

            {/* Status controls */}
            <div className="pt-4 border-t border-[#F9E0D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Progress stepper */}
                <div className="flex items-center gap-2">
                    {STATUS_FLOW.map((step, idx) => {
                        const reached = !isCancelled && currentStepIdx >= idx;
                        return (
                            <React.Fragment key={step}>
                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-2.5 h-2.5 rounded-full ${reached ? 'bg-[#5A1A2B]' : 'bg-[#F3D9CB]'}`} />
                                    <span className={`text-[9px] uppercase tracking-wide ${reached ? 'text-[#5A1A2B]' : 'text-[#C9B5A8]'}`}>
                                        {STATUS_CONFIG[step].label}
                                    </span>
                                </div>
                                {idx < STATUS_FLOW.length - 1 && (
                                    <div className={`w-6 h-px ${!isCancelled && currentStepIdx > idx ? 'bg-[#5A1A2B]' : 'bg-[#F3D9CB]'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Update dropdown */}
                <div className="flex items-center gap-3">
                    <label className="text-[10px] uppercase tracking-[0.12em] text-[#6B7280]">Update Status</label>
                    <select
                        value={status}
                        disabled={isUpdating}
                        onChange={(e) => onStatusChange(order._id, e.target.value)}
                        className="bg-transparent border border-[#F3D9CB] rounded-sm px-3 py-2 text-[12px] text-[#5A1A2B] focus:outline-none focus:border-[#5A1A2B] cursor-pointer disabled:opacity-50"
                    >
                        {/* New/unactioned orders show a disabled placeholder until the seller picks. */}
                        {status === 'placed' && <option value="placed" disabled>New — choose an action</option>}
                        {/* Razorpay orders are auto-confirmed; surface the current state, not a re-confirm action. */}
                        {isRazorpay && status === 'confirmed' && <option value="confirmed" disabled>Preparing — choose next</option>}
                        {!isRazorpay && <option value="confirmed">Confirmed &amp; Preparing</option>}
                        <option value="ready">Ready for Delivery / Pickup</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    {isUpdating && (
                        <div className="w-4 h-4 border-2 border-[#5A1A2B] border-t-transparent rounded-full animate-spin" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerOrders;
