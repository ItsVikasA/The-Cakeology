import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import useCustomCake from '../Hook/useCustomCake';

const STATUS_STYLES = {
    pending: 'bg-[#fbf0e2] text-[#a06a2c]',
    quoted: 'bg-[#F9E0D6] text-[#F37966]',
    rejected: 'bg-[#fce8e8] text-[#c0392b]',
    awaiting_payment: 'bg-[#fde7cf] text-[#b26a00]',
    paid: 'bg-[#e6f0e8] text-[#3a7d44]',
    preparing: 'bg-[#e6f0e8] text-[#3a7d44]',
    ready: 'bg-[#e6f0e8] text-[#3a7d44]',
    delivered: 'bg-[#e6f0e8] text-[#3a7d44]',
    cancelled: 'bg-[#F9E0D6] text-[#6B7280]',
};

const NEXT_STATUS = { paid: 'preparing', preparing: 'ready', ready: 'delivered' };
const NEXT_LABEL = { paid: 'Start preparing', preparing: 'Mark ready', ready: 'Mark delivered' };

const SellerCustomRequests = () => {
    const sellerRequests = useSelector((state) => state.customCake.sellerRequests);
    const { getSellerRequestsHandler, quoteCustomRequestHandler, rejectCustomRequestHandler, updateCustomStatusHandler, confirmCustomPaymentHandler, sellerCancelCustomHandler } = useCustomCake();
    const [notice, setNotice] = useState('');

    const [loading, setLoading] = useState(true);
    const [quoteInputs, setQuoteInputs] = useState({}); // { [id]: { amount, sellerNote } }
    const [busyId, setBusyId] = useState(null);

    const load = async () => {
        try { await getSellerRequestsHandler(); } catch { /* ignore */ } finally { setLoading(false); }
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 15000);
        return () => clearInterval(interval);
    }, []);

    const setInput = (id, field, value) =>
        setQuoteInputs((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

    const handleQuote = async (id) => {
        const input = quoteInputs[id] || {};
        if (!input.amount || Number(input.amount) <= 0) return;
        setBusyId(id);
        try {
            await quoteCustomRequestHandler(id, { amount: Number(input.amount), currency: 'INR', sellerNote: input.sellerNote || '' });
        } finally { setBusyId(null); }
    };

    const handleReject = async (id) => {
        setBusyId(id);
        try { await rejectCustomRequestHandler(id, ''); } finally { setBusyId(null); }
    };

    const handleAdvance = async (id, current) => {
        const next = NEXT_STATUS[current];
        if (!next) return;
        setBusyId(id);
        try { await updateCustomStatusHandler(id, next); } finally { setBusyId(null); }
    };

    const handleConfirmPayment = async (id) => {
        setBusyId(id);
        try { await confirmCustomPaymentHandler(id); } finally { setBusyId(null); }
    };

    const handleCancelRefund = async (r) => {
        const online = r.paymentMethod === 'razorpay';
        const ok = window.confirm(
            online
                ? `Cancel this order and issue a full Razorpay refund of ₹${r.quotedPrice?.amount?.toLocaleString()}?`
                : `Cancel this order? It was paid via WhatsApp, so you'll need to refund ₹${r.quotedPrice?.amount?.toLocaleString()} to the buyer manually.`
        );
        if (!ok) return;
        setBusyId(r._id);
        setNotice('');
        try {
            const res = await sellerCancelCustomHandler(r._id);
            setNotice(res?.message || 'Order cancelled.');
        } catch (err) {
            setNotice(err?.response?.data?.message || 'Could not cancel / refund this order.');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-8">
                <h1 className="font-baloo text-[clamp(28px,4vw,40px)] font-light text-[#5A1A2B]">Custom Cake Requests</h1>
                <p className="font-poppins text-[13px] font-light text-[#6B7280] mt-1">Review buyer designs, send a quote, and fulfil paid orders.</p>
            </div>

            {notice && (
                <div className="mb-6 p-3 bg-[#e6f0e8] text-[#3a7d44] text-[13px] rounded-sm">{notice}</div>
            )}

            {loading ? (
                <p className="text-[#6B7280] text-[13px]">Loading…</p>
            ) : sellerRequests.length === 0 ? (
                <div className="bg-white border border-[#F3D9CB] rounded-sm p-12 text-center text-[#6B7280] text-[14px]">
                    No custom cake requests yet.
                </div>
            ) : (
                <div className="space-y-5">
                    {sellerRequests.map((r) => (
                        <div key={r._id} className="bg-white border border-[#F3D9CB] rounded-sm p-5">
                            <div className="flex gap-5">
                                <a href={r.designImage} target="_blank" rel="noreferrer" className="flex-shrink-0">
                                    <img src={r.designImage} alt="design" className="w-28 h-28 object-cover rounded-sm" />
                                </a>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-baloo text-xl font-semibold text-[#5A1A2B]">{r.title || 'Custom Cake'}</h3>
                                            <p className="text-[12px] text-[#6B7280] mt-0.5">
                                                #{r._id.slice(-8).toUpperCase()} · {r.userId?.fullname || 'Customer'}
                                            </p>
                                        </div>
                                        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-semibold whitespace-nowrap ${STATUS_STYLES[r.status] || ''}`}>
                                            {r.status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-[#6B7280]">
                                        {r.flavor && <span><b className="text-[#F37966]">Flavour:</b> {r.flavor}</span>}
                                        {r.weight && <span><b className="text-[#F37966]">Weight:</b> {r.weight}</span>}
                                        {r.requiredDate && <span><b className="text-[#F37966]">Needed:</b> {new Date(r.requiredDate).toDateString()}</span>}
                                        {r.budget && <span><b className="text-[#F37966]">Budget:</b> ₹{r.budget}</span>}
                                    </div>
                                    {r.description && <p className="text-[12px] text-[#6B7280] mt-2 leading-relaxed">{r.description}</p>}
                                    {r.userId?.contact && <p className="text-[12px] text-[#6B7280] mt-1">Contact: {r.userId.contact}</p>}
                                </div>
                            </div>

                            {/* Actions */}
                            {r.status === 'pending' && (
                                <div className="mt-4 pt-4 border-t border-[#F9E0D6] space-y-3">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#6B7280]">₹</span>
                                            <input
                                                type="number"
                                                placeholder="Quote price"
                                                value={quoteInputs[r._id]?.amount || ''}
                                                onChange={(e) => setInput(r._id, 'amount', e.target.value)}
                                                className="w-32 bg-white border border-[#F3D9CB] rounded-sm px-3 py-2 text-[14px] focus:outline-none focus:border-[#F37966]"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Note to buyer (optional)"
                                            value={quoteInputs[r._id]?.sellerNote || ''}
                                            onChange={(e) => setInput(r._id, 'sellerNote', e.target.value)}
                                            className="flex-1 bg-white border border-[#F3D9CB] rounded-sm px-3 py-2 text-[14px] focus:outline-none focus:border-[#F37966]"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleQuote(r._id)}
                                            disabled={busyId === r._id}
                                            className="px-5 py-2.5 bg-[#5A1A2B] text-[#FFF6F0] text-[11px] font-medium uppercase tracking-[0.15em] rounded-sm hover:bg-[#43121F] transition-colors disabled:opacity-50"
                                        >
                                            Send Quote
                                        </button>
                                        <button
                                            onClick={() => handleReject(r._id)}
                                            disabled={busyId === r._id}
                                            className="px-5 py-2.5 border border-[#F3D9CB] text-[#6B7280] text-[11px] font-medium uppercase tracking-[0.15em] rounded-sm hover:border-red-300 hover:text-red-500 transition-colors disabled:opacity-50"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            )}

                            {r.status === 'quoted' && (
                                <div className="mt-4 pt-4 border-t border-[#F9E0D6] text-[13px] text-[#F37966]">
                                    Quoted ₹{r.quotedPrice?.amount?.toLocaleString()} — waiting for the buyer to confirm.
                                </div>
                            )}

                            {r.status === 'awaiting_payment' && (
                                <div className="mt-4 pt-4 border-t border-[#F9E0D6] flex items-center justify-between gap-3 flex-wrap">
                                    <span className="text-[13px] text-[#b26a00]">
                                        Buyer confirmed via WhatsApp · ₹{r.quotedPrice?.amount?.toLocaleString()} — confirm once you've received payment.
                                    </span>
                                    <button
                                        onClick={() => handleConfirmPayment(r._id)}
                                        disabled={busyId === r._id}
                                        className="px-5 py-2.5 bg-[#1f8f4e] text-white text-[11px] font-medium uppercase tracking-[0.15em] rounded-sm hover:bg-[#187a41] transition-colors disabled:opacity-50"
                                    >
                                        Confirm Payment
                                    </button>
                                </div>
                            )}

                            {NEXT_STATUS[r.status] && (
                                <div className="mt-4 pt-4 border-t border-[#F9E0D6] flex items-center justify-between gap-3 flex-wrap">
                                    <span className="text-[13px] text-[#3a7d44]">
                                        {r.paymentMethod === 'whatsapp'
                                            ? `Confirmed (WhatsApp) · ₹${r.quotedPrice?.amount?.toLocaleString()} — collect payment`
                                            : `Paid ₹${r.quotedPrice?.amount?.toLocaleString()}`}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleCancelRefund(r)}
                                            disabled={busyId === r._id}
                                            className="px-4 py-2.5 border border-[#e8b4b4] text-[#c0392b] text-[11px] font-medium uppercase tracking-[0.14em] rounded-sm hover:bg-[#fce8e8] transition-colors disabled:opacity-50"
                                        >
                                            Cancel &amp; Refund
                                        </button>
                                        <button
                                            onClick={() => handleAdvance(r._id, r.status)}
                                            disabled={busyId === r._id}
                                            className="px-5 py-2.5 bg-[#5A1A2B] text-[#FFF6F0] text-[11px] font-medium uppercase tracking-[0.15em] rounded-sm hover:bg-[#43121F] transition-colors disabled:opacity-50"
                                        >
                                            {NEXT_LABEL[r.status]}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {r.status === 'delivered' && (
                                <div className="mt-4 pt-4 border-t border-[#F9E0D6] text-[13px] text-[#3a7d44]">Completed · Delivered</div>
                            )}

                            {r.status === 'cancelled' && r.refund?.status && (
                                <div className="mt-4 pt-4 border-t border-[#F9E0D6] text-[13px] text-[#c0392b]">
                                    Cancelled · {r.refund.status === 'refunded'
                                        ? `₹${r.refund.amount?.toLocaleString()} refunded via Razorpay`
                                        : `₹${r.refund.amount?.toLocaleString()} to refund manually (WhatsApp)`}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SellerCustomRequests;
