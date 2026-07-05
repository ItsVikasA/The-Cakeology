import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useRazorpay } from 'react-razorpay';
import useCustomCake from '../Hook/useCustomCake';
import useSettings from '../../Admin/Hook/useSettings';

const STATUS_STYLES = {
    pending: 'bg-[#F9E0D6] text-[#F37966]',
    quoted: 'bg-[#fbf0e2] text-[#a06a2c]',
    rejected: 'bg-[#fce8e8] text-[#c0392b]',
    awaiting_payment: 'bg-[#fbf0e2] text-[#a06a2c]',
    paid: 'bg-[#e6f0e8] text-[#3a7d44]',
    preparing: 'bg-[#e6f0e8] text-[#3a7d44]',
    ready: 'bg-[#e6f0e8] text-[#3a7d44]',
    delivered: 'bg-[#e6f0e8] text-[#3a7d44]',
    cancelled: 'bg-[#F9E0D6] text-[#6B7280]',
};

const STATUS_LABEL = {
    pending: 'Awaiting baker',
    quoted: 'Quote ready — pay to confirm',
    rejected: 'Declined',
    paid: 'Paid — in queue',
    preparing: 'Being prepared',
    ready: 'Ready',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const MyCustomCakes = () => {
    const navigate = useNavigate();
    const User = useSelector((state) => state.auth.User);
    const myRequests = useSelector((state) => state.customCake.myRequests);
    const { getMyRequestsHandler, cancelCustomRequestHandler, createCustomPaymentHandler, verifyCustomPaymentHandler, confirmWhatsappHandler } = useCustomCake();
    const { getPublicSettingsHandler } = useSettings();
    const { Razorpay } = useRazorpay();

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [settings, setSettings] = useState(null);

    // Store's active checkout method (admin-configurable): drives whether a
    // quoted request is paid online (Razorpay) or confirmed via WhatsApp.
    const activeMethod = settings?.activeMethod || 'razorpay';

    const load = async () => {
        try { await getMyRequestsHandler(); } catch { /* ignore */ } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);
    useEffect(() => { getPublicSettingsHandler().then(setSettings).catch(() => {}); }, []);

    // Badge label for a request — special-cased so a WhatsApp-confirmed (offline)
    // order isn't mislabelled as prepaid, and the CTA copy matches the method.
    const statusLabel = (r) => {
        if (r.status === 'quoted') return activeMethod === 'whatsapp' ? 'Quote ready — confirm to order' : 'Quote ready — pay to confirm';
        if (r.status === 'awaiting_payment') return 'Awaiting payment confirmation';
        if (r.status === 'paid') return r.paymentMethod === 'whatsapp' ? 'Confirmed — in queue' : 'Paid — in queue';
        return STATUS_LABEL[r.status] || r.status;
    };

    // WhatsApp confirm: commit the order server-side (offline payment), then open
    // WhatsApp pre-filled with the quote so the buyer can arrange payment.
    const handleWhatsappConfirm = async (request) => {
        try {
            await confirmWhatsappHandler(request._id);
            const idShort = request._id.slice(-8).toUpperCase();
            const price = request.quotedPrice?.amount?.toLocaleString();
            const lines = [
                `Hi! I'd like to confirm my custom cake order.`,
                `Order: #${idShort}`,
                request.title ? `Design: ${request.title}` : null,
                `Quoted price: ₹${price}`,
                request.requiredDate ? `Needed by: ${new Date(request.requiredDate).toDateString()}` : null,
                `I'll arrange the payment here on WhatsApp.`,
            ].filter(Boolean);
            let number = (settings?.whatsappNumber || '919900082208').replace(/\D/g, '');
            if (number.length === 10) number = `91${number}`;
            window.open(`https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
            setMessage('Order confirmed! Continue on WhatsApp to arrange payment.');
            await load();
        } catch (err) {
            setMessage(err?.response?.data?.message || 'Could not confirm the order.');
        }
    };

    const handlePay = async (request) => {
        try {
            const order = await createCustomPaymentHandler(request._id);
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: 'Cakeology',
                description: `Custom Cake #${request._id.slice(-8).toUpperCase()}`,
                order_id: order.id,
                handler: async (response) => {
                    const verified = await verifyCustomPaymentHandler(request._id, {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    });
                    if (verified.success) {
                        setMessage('Payment successful! Your custom cake is confirmed.');
                        await load();
                    }
                },
                prefill: { name: User?.fullname, email: User?.email, contact: User?.contact || '' },
                theme: { color: '#5A1A2B' },
            };
            const rzp = new Razorpay(options);
            rzp.open();
        } catch (err) {
            setMessage(err?.response?.data?.message || 'Could not start payment.');
        }
    };

    const handleCancel = async (id) => {
        try { await cancelCustomRequestHandler(id); } catch { setMessage('Could not cancel request.'); }
    };

    return (
        <div className="min-h-screen bg-[#F9E0D6] font-poppins antialiased py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="font-baloo text-4xl font-light text-[#5A1A2B]">My Custom Cakes</h1>
                        <p className="text-[#6B7280] text-[13px] mt-1 font-light">Track your bespoke cake requests</p>
                    </div>
                    <button
                        onClick={() => navigate('/customCake')}
                        className="px-5 py-3 bg-[#5A1A2B] text-[#FFF6F0] text-[11px] font-medium uppercase tracking-[0.15em] rounded-sm hover:bg-[#43121F] transition-colors"
                    >
                        + New Request
                    </button>
                </div>

                {message && (
                    <div className="mb-6 p-3 bg-[#e6f0e8] text-[#3a7d44] text-[13px] rounded-sm">{message}</div>
                )}

                {loading ? (
                    <p className="text-[#6B7280] text-[13px]">Loading…</p>
                ) : myRequests.length === 0 ? (
                    <div className="bg-white border border-[#F3D9CB] rounded-sm p-12 text-center">
                        <p className="text-[#6B7280] text-[14px] mb-4">You haven't requested any custom cakes yet.</p>
                        <button onClick={() => navigate('/customCake')} className="text-[#F37966] text-[12px] uppercase tracking-wider font-semibold hover:underline">Design your first cake</button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {myRequests.map((r) => (
                            <div key={r._id} className="bg-white border border-[#F3D9CB] rounded-sm p-5 flex gap-5">
                                <a href={r.designImage} target="_blank" rel="noreferrer" className="flex-shrink-0">
                                    <img src={r.designImage} alt="design" className="w-24 h-24 object-cover rounded-sm" />
                                </a>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-baloo text-xl font-semibold text-[#5A1A2B]">{r.title || 'Custom Cake'}</h3>
                                        <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-semibold whitespace-nowrap ${STATUS_STYLES[r.status] || ''}`}>
                                            {statusLabel(r)}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[12px] text-[#6B7280]">
                                        {r.flavor && <span><b className="text-[#F37966]">Flavour:</b> {r.flavor}</span>}
                                        {r.weight && <span><b className="text-[#F37966]">Weight:</b> {r.weight}</span>}
                                        {r.requiredDate && <span><b className="text-[#F37966]">Needed:</b> {new Date(r.requiredDate).toDateString()}</span>}
                                    </div>
                                    {r.description && <p className="text-[12px] text-[#6B7280] mt-2 leading-relaxed">{r.description}</p>}

                                    {r.status === 'quoted' && (
                                        <div className="mt-3 p-3 bg-[#fbf0e2] rounded-sm">
                                            <p className="text-[13px] text-[#5A1A2B]">
                                                Baker's quote: <b>₹{r.quotedPrice?.amount?.toLocaleString()}</b>
                                            </p>
                                            {r.sellerNote && <p className="text-[12px] text-[#F37966] mt-1">{r.sellerNote}</p>}
                                        </div>
                                    )}
                                    {r.status === 'awaiting_payment' && (
                                        <div className="mt-3 p-3 bg-[#fbf0e2] rounded-sm border border-[#F5C9BE]">
                                            <p className="text-[13px] text-[#5A1A2B] leading-relaxed">
                                                🕐 Your order will be <b>confirmed once we verify your payment</b> on WhatsApp.
                                                As soon as it's confirmed, you'll receive a <b>confirmation email</b> and we'll
                                                start baking.
                                            </p>
                                            {r.quotedPrice?.amount && (
                                                <p className="text-[12px] text-[#F37966] mt-1">Amount: ₹{r.quotedPrice.amount.toLocaleString()}</p>
                                            )}
                                        </div>
                                    )}
                                    {(r.status === 'rejected' || r.status === 'paid' || r.status === 'preparing' || r.status === 'ready' || r.status === 'delivered') && r.quotedPrice?.amount && (
                                        <p className="text-[12px] text-[#6B7280] mt-2">Price: ₹{r.quotedPrice.amount.toLocaleString()}</p>
                                    )}
                                    {r.status === 'cancelled' && r.refund?.status && (
                                        <div className="mt-3 p-3 bg-[#e6f0e8] rounded-sm">
                                            <p className="text-[13px] text-[#3a7d44]">
                                                {r.refund.status === 'refunded'
                                                    ? `Cancelled · ₹${r.refund.amount?.toLocaleString()} refunded to your original payment method (5–7 business days).`
                                                    : `Cancelled · ₹${r.refund.amount?.toLocaleString()} will be refunded to you directly.`}
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-4">
                                        {r.status === 'quoted' && (
                                            activeMethod === 'whatsapp' ? (
                                                <button
                                                    onClick={() => handleWhatsappConfirm(r)}
                                                    className="px-5 py-2.5 bg-[#1f8f4e] text-white text-[11px] font-medium uppercase tracking-[0.15em] rounded-sm hover:bg-[#187a41] transition-colors inline-flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                        <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.38a9.86 9.86 0 004.76 1.21h.01c5.46 0 9.9-4.44 9.9-9.9 0-2.64-1.03-5.13-2.9-7A9.82 9.82 0 0012.04 2zm5.8 14.16c-.24.68-1.4 1.3-1.94 1.35-.5.05-.97.23-3.27-.68-2.76-1.09-4.5-3.91-4.64-4.09-.14-.18-1.12-1.49-1.12-2.85 0-1.36.71-2.02.96-2.3.24-.27.53-.34.71-.34.18 0 .36 0 .51.01.16.01.38-.06.6.46.24.55.79 1.9.86 2.04.07.14.12.3.02.48-.09.18-.14.29-.27.45-.14.16-.29.36-.41.48-.14.14-.28.29-.12.57.16.27.72 1.19 1.55 1.92 1.06.95 1.96 1.24 2.24 1.38.27.14.43.12.59-.07.16-.18.68-.79.86-1.06.18-.27.36-.23.6-.14.24.09 1.55.73 1.81.86.27.14.45.2.51.32.07.11.07.64-.17 1.32z" />
                                                    </svg>
                                                    Confirm & Chat on WhatsApp
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePay(r)}
                                                    className="px-5 py-2.5 bg-[#5A1A2B] text-[#FFF6F0] text-[11px] font-medium uppercase tracking-[0.15em] rounded-sm hover:bg-[#43121F] transition-colors"
                                                >
                                                    Pay ₹{r.quotedPrice?.amount?.toLocaleString()}
                                                </button>
                                            )
                                        )}
                                        {['pending', 'quoted', 'rejected'].includes(r.status) && (
                                            <button
                                                onClick={() => handleCancel(r._id)}
                                                className="px-5 py-2.5 border border-[#F3D9CB] text-[#6B7280] text-[11px] font-medium uppercase tracking-[0.15em] rounded-sm hover:border-red-300 hover:text-red-500 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyCustomCakes;
