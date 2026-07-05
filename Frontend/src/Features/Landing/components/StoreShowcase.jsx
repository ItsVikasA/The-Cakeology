// Ornate gold corner flourish — mirrored into all four corners of the royal frame.
const Corner = ({ className }) => (
    <svg
        viewBox="0 0 48 48"
        className={`absolute w-9 h-9 md:w-11 md:h-11 pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] ${className}`}
        fill="none"
    >
        <path
            d="M2 2 H30 M2 2 V30 M2 12 Q12 12 12 2 M18 2 Q18 18 2 18"
            stroke="url(#goldStroke)"
            strokeWidth="2.4"
            strokeLinecap="round"
        />
        <circle cx="16" cy="16" r="2.6" fill="url(#goldStroke)" />
        <defs>
            <linearGradient id="goldStroke" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0" stopColor="#f4d97b" />
                <stop offset="0.5" stopColor="#fff6cf" />
                <stop offset="1" stopColor="#a9772c" />
            </linearGradient>
        </defs>
    </svg>
);

const StoreShowcase = () => (
    <div className="relative w-full max-w-2xl mx-auto">
        {/* Royal outer frame — velvet burgundy with a gold inner rule */}
        <div className="relative rounded-[28px] p-[10px] md:p-[13px]
                        bg-[linear-gradient(135deg,#5A1A2B_0%,#7a2338_45%,#43121F_100%)]
                        shadow-[0_22px_60px_rgba(0,0,0,0.5)]
                        ring-1 ring-[#f4d97b]/40">
            {/* Gold shimmering trim */}
            <div className="shine-frame rounded-[19px] p-[3px] shadow-[0_0_26px_rgba(244,217,123,0.45)]">
                <img
                    src="/store-interior.jpg"
                    alt="Inside The Cakeology BGK"
                    className="w-full h-64 md:h-80 object-cover rounded-[16px]"
                />
            </div>

            {/* Gold corner flourishes */}
            <Corner className="top-1.5 left-1.5" />
            <Corner className="top-1.5 right-1.5 rotate-90" />
            <Corner className="bottom-1.5 right-1.5 rotate-180" />
            <Corner className="bottom-1.5 left-1.5 -rotate-90" />

            {/* Royal plaque */}
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap
                             px-5 py-1.5 rounded-full font-poppins text-[10px] md:text-[11px]
                             uppercase tracking-[0.25em] text-[#5A1A2B]
                             bg-[linear-gradient(135deg,#f4d97b,#fff6cf,#e6b23c)]
                             shadow-[0_4px_14px_rgba(0,0,0,0.35)] ring-1 ring-white/40">
                The Cakeology · Bagalkot
            </span>
        </div>
    </div>
);

export default StoreShowcase;
