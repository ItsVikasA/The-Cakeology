import React from 'react';
import { useNavigate } from 'react-router-dom';

// Compact pointer shown on Overview/Orders pages. The full actionable list lives
// in the dedicated Notifications section this links to. Renders nothing when
// there are no pending refunds.
const RefundAlertBanner = ({ count = 0, to }) => {
    const navigate = useNavigate();
    if (!count) return null;

    return (
        <button
            onClick={() => navigate(to)}
            className="w-full mb-8 flex items-center justify-between gap-3 text-left bg-[rgba(192,57,43,0.06)] border border-[rgba(192,57,43,0.25)] rounded-sm px-4 py-3 hover:bg-[rgba(192,57,43,0.1)] transition-colors cursor-pointer"
        >
            <span className="flex items-center gap-2 text-[12.5px] text-[#c0392b] font-medium">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {count} refund{count > 1 ? 's' : ''} pending
            </span>
            <span className="shrink-0 text-[11px] uppercase tracking-[0.12em] text-[#c0392b]">View →</span>
        </button>
    );
};

export default RefundAlertBanner;
