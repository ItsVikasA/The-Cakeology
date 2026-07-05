import React, { useEffect, useState } from 'react';
import useOrder from '../../Orders/Hooks/useOrder';
import RefundNotificationsPanel from '../../../Shared/components/RefundNotificationsPanel';

const SellerNotifications = () => {
    const { getSellerNotificationsHandler, resolveSellerNotificationHandler } = useOrder();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState(null);

    const load = () =>
        getSellerNotificationsHandler()
            .then((res) => setNotifications(res?.notifications || []))
            .catch(console.error)
            .finally(() => setLoading(false));

    useEffect(() => {
        load();
        const interval = setInterval(load, 20000);
        return () => clearInterval(interval);
    }, []);

    const handleResolve = async (n) => {
        // Razorpay refunds move real money — confirm first.
        if (n.paymentMethod === 'razorpay' &&
            !window.confirm(`Issue a live Razorpay refund of ₹${(n.amount || 0).toLocaleString('en-IN')} for this order?`)) return;
        setResolvingId(n._id);
        try {
            await resolveSellerNotificationHandler(n._id);
            await load();
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to process refund');
        } finally {
            setResolvingId(null);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-8">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm text-[9px] font-medium uppercase tracking-[0.16em] text-[#F37966] border border-[rgba(138,110,82,0.25)] bg-[rgba(138,110,82,0.06)]">
                    <span className="w-[5px] h-[5px] rounded-full bg-[#F37966]" />
                    Seller Console
                </span>
                <h1 className="font-baloo text-[clamp(34px,4vw,48px)] font-light text-[#5A1A2B] leading-[1.1] mt-4">Notifications</h1>
                <p className="font-poppins text-[13.5px] font-light text-[#6B7280] mt-2">Refund requests for your cancelled orders.</p>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-14 bg-white border border-[#F3D9CB] rounded-sm animate-pulse" />
                    ))}
                </div>
            ) : (
                <RefundNotificationsPanel notifications={notifications} onResolve={handleResolve} resolvingId={resolvingId} />
            )}
        </div>
    );
};

export default SellerNotifications;
