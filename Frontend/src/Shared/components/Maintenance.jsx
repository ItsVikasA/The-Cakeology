import React from 'react';

const Maintenance = () => {
    return (
        <>
            {/* Google Fonts */}
            <link
                href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap"
                rel="stylesheet"
            />
            <div
                className="min-h-screen flex items-center justify-center selection:bg-[#C9A96E]/30"
                style={{ backgroundColor: '#fbf9f6', fontFamily: "'Inter', sans-serif" }}
            >
                <div className="max-w-3xl mx-auto px-8 lg:px-16 text-center">
                    {/* Icon/Logo Area */}
                    <div className="mb-12 flex justify-center">
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: '#FFF6F0' }}
                        >
                            <svg
                                className="w-12 h-12"
                                fill="none"
                                stroke="#C9A96E"
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
                            className="text-[10px] uppercase tracking-[0.24em] font-medium px-6 py-2.5 rounded-full"
                            style={{
                                color: '#C9A96E',
                                backgroundColor: '#FFF6F0',
                                border: '1px solid #F3D9CB',
                            }}
                        >
                            Under Maintenance
                        </span>
                    </div>

                    {/* Main Heading */}
                    <h1
                        className="text-5xl lg:text-7xl font-light leading-tight mb-8"
                        style={{ fontFamily: "'Cormorant Garamond', serif", color: '#5A1A2B' }}
                    >
                        We're Refining <br className="hidden sm:block" />
                        the Experience
                    </h1>

                    {/* Description */}
                    <p className="max-w-xl mx-auto text-base leading-relaxed mb-12" style={{ color: '#7A6E63' }}>
                        Our website is currently undergoing scheduled maintenance to bring you an enhanced shopping experience. We'll be back shortly with a fresh cake menu and improved features.
                    </p>

                    {/* Coming Soon Message */}
                    <div className="inline-block px-8 py-4 mb-16 rounded-sm" style={{ backgroundColor: '#FFF6F0' }}>
                        <p className="text-sm font-medium" style={{ color: '#5A1A2B' }}>
                            New enhanced version launching soon
                        </p>
                    </div>

                    {/* Optional: Contact Information */}
                    <div className="pt-12 border-t" style={{ borderColor: '#F3D9CB' }}>
                        <p className="text-xs leading-relaxed mb-4" style={{ color: '#7A6E63' }}>
                            For urgent inquiries, please reach out to us
                        </p>
                        <a
                            href="mailto:vikas.ambalazari@gmail.com"
                            className="text-sm font-medium transition-colors duration-300 hover:text-[#C9A96E]"
                            style={{ color: '#5A1A2B', fontFamily: "'Cormorant Garamond', serif" }}
                        >
                            vikas.ambalazari@gmail.com
                        </a>
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-12 border-t" style={{ borderColor: '#F3D9CB' }}>
                        <span
                            className="text-[10px] uppercase tracking-[0.35em]"
                            style={{ fontFamily: "'Cormorant Garamond', serif", color: '#C9A96E' }}
                        >
                            CAKEOLOGY © {new Date().getFullYear()}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Maintenance;
