import React from 'react';

// Kept visually in sync with the rest of the storefront (Landing / NavigationBar):
// peach background, maroon + coral + gold palette, and the shared Poppins /
// Great Vibes / Cormorant fonts already loaded globally in index.css.
const GREEN = '#5A1A2B';   // brand maroon
const CORAL = '#F37966';   // brand coral accent
const PEACH = '#F9E0D6';   // page background (matches <body>)
const CREAM = '#FFF6F0';   // soft card / chip fill
const BORDER = '#F3D9CB';  // hairline borders (matches navbar)
const SLATE = '#6B7280';   // muted body copy

const Maintenance = () => {
    return (
        <div
            className="min-h-screen flex items-center justify-center font-poppins antialiased selection:bg-[#F37966]/25"
            style={{ backgroundColor: PEACH }}
        >
            <div className="max-w-3xl mx-auto px-8 lg:px-16 text-center">
                {/* Icon/Logo Area */}
                <div className="mb-10 flex justify-center">
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center ring-1"
                        style={{ backgroundColor: CREAM, ['--tw-ring-color']: `${CORAL}55` }}
                    >
                        <svg
                            className="w-12 h-12"
                            fill="none"
                            stroke={CORAL}
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Status Badge */}
                <div className="mb-8 flex justify-center">
                    <span
                        className="font-poppins text-[10px] uppercase tracking-[0.24em] font-medium px-6 py-2.5 rounded-full"
                        style={{ color: CORAL, backgroundColor: CREAM, border: `1px solid ${BORDER}` }}
                    >
                        Under Maintenance
                    </span>
                </div>

                {/* Main Heading */}
                <h1 className="font-script text-gold-deep text-[clamp(48px,9vw,88px)] leading-[1.05] mb-8">
                    We're Refining <br className="hidden sm:block" />
                    the Experience
                </h1>

                {/* Description */}
                <p className="font-poppins max-w-xl mx-auto text-[15px] leading-relaxed mb-12" style={{ color: SLATE }}>
                    Our website is currently undergoing scheduled maintenance to bring you an enhanced shopping experience. We'll be back shortly with a fresh cake menu and improved features.
                </p>

                {/* Coming Soon Message — gold gradient pill matching the landing CTA */}
                <div
                    className="inline-block px-8 py-4 mb-16 rounded-full shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#f4d97b,#fff6cf,#e6b23c)' }}
                >
                    <p className="font-poppins text-sm font-semibold uppercase tracking-[0.08em]" style={{ color: GREEN }}>
                        New enhanced version launching soon
                    </p>
                </div>

                {/* Contact Information */}
                <div className="pt-12 border-t" style={{ borderColor: BORDER }}>
                    <p className="font-poppins text-xs leading-relaxed mb-4" style={{ color: SLATE }}>
                        For urgent inquiries, please reach out to us
                    </p>
                    <a
                        href="mailto:vikas.ambalazari@gmail.com"
                        className="font-poppins text-sm font-medium transition-colors duration-300 hover:text-[#F37966]"
                        style={{ color: GREEN }}
                    >
                        vikas.ambalazari@gmail.com
                    </a>
                </div>

                {/* Footer */}
                <div className="mt-16 pt-12 border-t" style={{ borderColor: BORDER }}>
                    <span
                        className="font-poppins text-[10px] uppercase tracking-[0.35em]"
                        style={{ color: CORAL }}
                    >
                        CAKEOLOGY © {new Date().getFullYear()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Maintenance;
