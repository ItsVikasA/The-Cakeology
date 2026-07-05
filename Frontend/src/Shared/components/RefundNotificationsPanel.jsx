import React from 'react';

// Full refund-notification list used by the dedicated Admin/Seller Notifications
// pages. Unresolved items are actionable; resolved items show who handled them.
// `onResolve(n)` receives the whole notification so the caller can confirm/branch
// on paymentMethod; `resolvingId` is the id currently being processed.
const RefundNotificationsPanel = ({ notifications = [], onResolve, resolvingId }) => {
    const open = notifications.filter((n) => !n.resolved);
    const done = notifications.filter((n) => n.resolved);

    if (open.length === 0 && done.length === 0) {
        return (
            <div className="bg-white border border-[#F3D9CB] rounded-sm p-10 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#F9E0D6] flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#C9B5A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.66V5a2 2 0 10-4 0v.34A6 6 0 006 11v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </div>
                <p className="font-baloo text-[22px] font-light text-[#5A1A2B]">No refund requests.</p>
                <p className="font-poppins text-[13px] text-[#6B7280] mt-1">Refund alerts appear here when a paid order is cancelled.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Pending — actionable */}
            <div>
                <h3 className="font-poppins text-[11px] uppercase tracking-[0.14em] text-[#c0392b] font-semibold mb-3">
                    To Process · {open.length}
                </h3>
                {open.length === 0 ? (
                    <p className="font-poppins text-[13px] text-[#6B7280]">Nothing pending — you're all caught up.</p>
                ) : (
                    <div className="space-y-2">
                        {open.map((n) => (
                            <div key={n._id} className="flex items-center justify-between gap-4 bg-white border border-[rgba(192,57,43,0.25)] rounded-sm px-4 py-3">
                                <p className="font-poppins text-[12.5px] text-[#5A1A2B] leading-relaxed">{n.message}</p>
                                <button
                                    onClick={() => onResolve(n)}
                                    disabled={resolvingId === n._id}
                                    className="shrink-0 px-3 py-1.5 rounded-sm border border-[#5A1A2B] text-[#5A1A2B] text-[10px] uppercase tracking-[0.14em] font-medium hover:bg-[#5A1A2B] hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {resolvingId === n._id ? 'Processing…' : (n.paymentMethod === 'razorpay' ? 'Refund via Razorpay' : 'Mark Refunded')}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Resolved history */}
            {done.length > 0 && (
                <div>
                    <h3 className="font-poppins text-[11px] uppercase tracking-[0.14em] text-[#F37966] font-semibold mb-3">
                        Resolved · {done.length}
                    </h3>
                    <div className="space-y-2">
                        {done.map((n) => (
                            <div key={n._id} className="flex items-center justify-between gap-4 bg-white/60 border border-[#F3D9CB] rounded-sm px-4 py-3">
                                <p className="font-poppins text-[12.5px] text-[#6B7280] leading-relaxed line-through decoration-[#C9B5A8]">{n.message}</p>
                                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.1em] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    ✓ Refunded by {n.resolvedBy || 'staff'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RefundNotificationsPanel;
