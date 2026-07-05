import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useHideOnScroll from '../../../Shared/hooks/useHideOnScroll';
import Wave from '../components/Wave';
import Sparkle from '../components/Sparkle';
import ScrollSequenceHero from '../components/ScrollSequenceHero';
import StoryGallery from '../components/StoryGallery';
import StoreShowcase from '../components/StoreShowcase';
import CakeGallery from '../components/CakeGallery';
import CustomCakeBanner from '../components/CustomCakeBanner';

const CREAM = '#F9E0D6';
const PEACH = '#F9E0D6';
const GREEN = '#5A1A2B';

// "Shop by occasion" — helps visitors jump straight to the cake for their moment.
const OCCASIONS = [
    { emoji: '🎂', title: 'Birthdays', desc: 'Make their day unforgettable', to: '/shop' },
    { emoji: '💍', title: 'Weddings', desc: 'Elegant tiers for the big day', to: '/shop' },
    { emoji: '❤️', title: 'Anniversaries', desc: 'Celebrate years of love', to: '/shop' },
    { emoji: '👶', title: 'Baby Showers', desc: 'Sweet welcomes for little ones', to: '/shop' },
    { emoji: '🧸', title: 'Kids & Cartoon', desc: 'Playful themes they’ll adore', to: '/shop' },
    { emoji: '🎨', title: 'Custom Creations', desc: 'Designed just the way you dream', to: '/customCake' },
];

// Gold / muted star row for a review's rating.
const Stars = ({ count }) => (
    <div className="flex gap-0.5 mb-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
            <svg key={i} viewBox="0 0 20 20" className="w-3.5 h-3.5"
                fill={i <= count ? '#f0b429' : '#e4d9d0'}>
                <path d="M10 1.5l2.6 5.3 5.9.85-4.25 4.14 1 5.86L10 15.9l-5.25 2.76 1-5.86L1.5 7.65l5.9-.85L10 1.5z" />
            </svg>
        ))}
    </div>
);

// Floating Google-style review card used around the store image.
const ReviewCard = ({ review, className, style }) => (
    <div className={`bg-white rounded-2xl shadow-[0_12px_34px_rgba(0,0,0,0.28)] ring-1 ring-[#f4d97b]/50 p-4 ${className || ''}`} style={style}>
        <Stars count={review.stars} />
        <p className="font-poppins text-[13px] text-[#5A1A2B] leading-relaxed mb-2.5">“{review.quote}”</p>
        <div className="flex items-baseline justify-between gap-2">
            <span className="font-poppins text-[12.5px] font-semibold" style={{ color: '#5A1A2B' }}>{review.name}</span>
            <span className="font-poppins text-[10px] text-[#9a8f88] shrink-0">{review.meta}</span>
        </div>
    </div>
);

const TAGS = ['QUALITY INGREDIENTS', 'PERSONALIZED DESIGNS', 'ON-TIME DELIVERY', 'AFFORDABLE PRICES'];

// Real Google reviews of The Cakeology, Bagalkot.
const TESTIMONIALS = [
    {
        name: 'Sourabh Hosur',
        meta: 'Local Guide · 14 reviews',
        stars: 5,
        quote: 'Took delivery of pineapple flavoured pastry. Great taste. It’s one of the best cake shops in and around Vidyagiri, Bagalkot.',
    },
    {
        name: 'Darshan Amadalli',
        meta: 'Local Guide · 11 reviews',
        stars: 5,
        quote: 'Best option for all the variety of cakes for different occasions. Good reasonable pricing and very friendly, courteous staff who guide you with the available options.',
    },
    {
        name: 'Pradeep M',
        meta: 'Local Guide · 43 reviews',
        stars: 3,
        quote: 'The cake wasn’t properly baked and prices were a bit high for the quality. They refunded for it though, which is nice.',
    },
    {
        name: 'Madan R S',
        meta: '1 review',
        stars: 5,
        quote: 'The cakes are designed like an artist — exactly like I expected them to be.',
    },
];

const Landing = () => {
    const navigate = useNavigate();
    const hidden = useHideOnScroll();
    const products = useSelector((state) => state.products.AllProducts) || [];
    const User = useSelector((state) => state.auth.User);
    // Admins/sellers don't shop — hide the Custom Cake link for them.
    const isStaff = User && (User.role === 'admin' || User.role === 'seller');

    const heroImage = products.find((p) => p?.images?.length)?.images?.[0] || '/1.jpeg';

    // Fast, smooth scroll to a section — fixed ~650ms with easing so it stays
    // quick no matter how long the page is (native smooth-scroll drags over tall pages).
    const smoothScrollTo = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const startY = window.scrollY;
        const header = 64; // sticky header height
        const targetY = el.getBoundingClientRect().top + startY - header;
        const distance = targetY - startY;
        const duration = 650;
        let startTime = null;
        const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
        const step = (ts) => {
            if (startTime === null) startTime = ts;
            const p = Math.min(1, (ts - startTime) / duration);
            window.scrollTo(0, startY + distance * easeInOutCubic(p));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    return (
        <div className="font-poppins antialiased" style={{ backgroundColor: CREAM }}>

            {/* ── HEADER ── */}
            <header className={`sticky top-0 z-30 backdrop-blur-md transition-transform duration-300 ease-out ${hidden ? '-translate-y-full' : 'translate-y-0'}`} style={{ backgroundColor: `${CREAM}cc` }}>
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div
                        onClick={() => navigate('/')}
                        className="cursor-pointer select-none flex items-center"
                    >
                        <img
                            src="/logo.png"
                            alt="Cakeology"
                            className="h-14 md:h-16 w-auto object-contain block"
                            onError={(e) => {
                                // Until the logo.png asset is added, fall back to the wordmark.
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'block';
                            }}
                        />
                        <span
                            className="font-script text-[34px] md:text-[42px] leading-none"
                            style={{ color: GREEN, display: 'none' }}
                        >
                            Cakeology
                        </span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 font-poppins text-[12px] uppercase tracking-[0.12em] text-[#5A1A2B]">
                        <button onClick={() => navigate('/shop')} className="hover:opacity-60 transition-opacity cursor-pointer">Shop</button>
                        {!isStaff && <button onClick={() => navigate('/customCake')} className="hover:opacity-60 transition-opacity cursor-pointer">Custom Cake</button>}
                        <button onClick={() => smoothScrollTo('contact')} className="uppercase tracking-[0.12em] hover:opacity-60 transition-opacity cursor-pointer">Contact</button>
                    </nav>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/shop')}
                            aria-label="Shop"
                            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full border-2 cursor-pointer"
                            style={{ borderColor: '#F37966', color: '#F37966' }}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        {User ? (
                            (User.role === 'admin' || User.role === 'seller') ? (
                                <button
                                    onClick={() => navigate(User.role === 'admin' ? '/admin' : '/product/dashboard')}
                                    aria-label={User.role === 'admin' ? 'Admin Account' : 'Seller Account'}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border-2 font-poppins text-[12px] font-semibold uppercase tracking-[0.1em] transition-colors cursor-pointer hover:bg-[#F37966]/10"
                                    style={{ borderColor: '#F37966', color: '#F37966' }}
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {User.role === 'admin' ? 'Admin Account' : 'Seller Account'}
                                </button>
                            ) : (
                                <button
                                    onClick={() => navigate('/myOrders')}
                                    className="px-5 py-2 rounded-full border-2 font-poppins text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors cursor-pointer"
                                    style={{ borderColor: '#F37966', color: '#F37966' }}
                                >
                                    My Orders
                                </button>
                            )
                        ) : (
                            <button
                                onClick={() => navigate('/register')}
                                className="px-5 py-2 rounded-full font-poppins text-[13px] font-semibold uppercase tracking-[0.1em] transition-transform shadow-lg relative overflow-hidden premium-silver-btn"
                                style={{ transform: 'translateZ(0)' }}
                                aria-label="Signup"
                            >
                                <span className="font-poppins font-semibold" style={{ color: '#2a2f36' }}>Signup</span>
                                <span className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* ── HERO (scroll-scrubbed image sequence) ── */}
            <ScrollSequenceHero>
                <div className="relative text-center max-w-3xl mx-auto">
                    <Sparkle className="-top-10 left-[-10%] hidden md:block" size={22} />
                    <Sparkle className="top-16 right-[-8%] hidden md:block" size={16} />

                    <h1 className="font-script text-gold-shine text-[clamp(40px,8vw,84px)] leading-[1.08] mb-10">
                        Celebrate your happiest<br /> moments with Cakeology
                    </h1>

                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <button
                            onClick={() => navigate('/shop')}
                            className="px-8 py-3.5 rounded-full font-poppins text-[14px] font-semibold uppercase tracking-[0.12em] border backdrop-blur-md shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                            style={{ background: 'rgba(244, 217, 123, 0.18)', borderColor: 'rgba(244, 217, 123, 0.75)' }}
                        >
                            <span className="text-gold-shine">Shop Now</span>
                        </button>
                        <button
                            onClick={() => navigate('/customCake')}
                            className="px-8 py-3.5 rounded-full font-poppins text-[14px] font-semibold uppercase tracking-[0.12em] border backdrop-blur-md shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                            style={{ background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(244, 217, 123, 0.55)' }}
                        >
                            <span className="text-gold-shine">Custom Cake</span>
                        </button>
                    </div>
                </div>
            </ScrollSequenceHero>

            {/* ── SHOP BY OCCASION (wine band; wavy top laps up over the hero) ── */}
            <div className="relative z-20 -mt-28 md:-mt-48">
                <Wave color={GREEN} />
                <section className="px-6 pb-14 md:pb-20 pt-2 md:pt-4 -mb-px" style={{ backgroundColor: GREEN }}>
                <div className="max-w-6xl mx-auto">
                    <p className="font-poppins text-[11px] uppercase tracking-[0.35em] text-center mb-2" style={{ color: '#f4d97b' }}>
                        Whatever you’re celebrating
                    </p>
                    <h2 className="font-script text-gold-shine text-[44px] md:text-[58px] text-center mb-8 md:mb-14">
                        Cakes for Every Occasion
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6">
                        {OCCASIONS.map((o) => (
                            <button
                                key={o.title}
                                onClick={() => navigate(o.to)}
                                className="group relative bg-white/95 backdrop-blur-sm rounded-2xl p-4 md:p-6 text-center
                                           ring-1 ring-[#5A1A2B]/10 shadow-sm hover:shadow-xl hover:-translate-y-1.5
                                           transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-center md:h-44"
                            >
                                {/* soft gold glow on hover */}
                                <span className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                                 bg-[radial-gradient(circle_at_top,rgba(244,217,123,0.18),transparent_60%)] rounded-2xl" />
                                <span className="relative mx-auto mb-3 flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full text-[26px]
                                                 bg-[linear-gradient(135deg,#F9E0D6,#F9E0D6)] ring-1 ring-[#f4d97b]/50
                                                 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    {o.emoji}
                                </span>
                                <h3 className="relative font-hand font-semibold text-[18px] md:text-[20px] leading-tight" style={{ color: GREEN }}>
                                    {o.title}
                                </h3>
                                <p className="relative font-poppins text-[11px] md:text-[12px] text-[var(--color-bakejoy-slate)] mt-1 leading-relaxed">
                                    {o.desc}
                                </p>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-center mt-8 md:mt-14">
                        <button
                            onClick={() => navigate('/shop')}
                            className="px-8 py-3.5 rounded-full font-poppins text-[14px] font-semibold uppercase tracking-[0.12em] shadow-lg hover:-translate-y-0.5 transition-transform cursor-pointer"
                            style={{ background: 'linear-gradient(135deg,#f4d97b,#fff6cf,#e6b23c)', color: GREEN }}
                        >
                            View All Cakes
                        </button>
                    </div>
                </div>
                </section>
            </div>

            <Wave color={CREAM} />

            <StoryGallery />

            <CustomCakeBanner />

            <Wave color={GREEN} />

            {/* ── TESTIMONIALS ── */}
            <section className="relative px-6 py-16 md:py-28 overflow-hidden" style={{ backgroundColor: GREEN }}>
                <div className="text-center mb-12 md:mb-16">
                    <p className="font-poppins text-[11px] uppercase tracking-[0.35em] text-[#f4d97b] mb-3">Loved in Bagalkot</p>
                    <h2 className="font-script text-[46px] md:text-[64px] leading-none text-gold-shine">What our guests say</h2>
                </div>

                <div className="max-w-2xl mx-auto relative">
                    <StoreShowcase />

                    {/* Floating real reviews — orbit the store image on desktop */}
                    <ReviewCard review={TESTIMONIALS[0]} className="hidden lg:block absolute w-[260px] float-slow"
                        style={{ left: '-190px', top: '-34px', animationDelay: '0s' }} />
                    <ReviewCard review={TESTIMONIALS[1]} className="hidden lg:block absolute w-[260px] float-slow"
                        style={{ right: '-190px', top: '10px', animationDelay: '1.2s' }} />
                    <ReviewCard review={TESTIMONIALS[2]} className="hidden lg:block absolute w-[260px] float-slow"
                        style={{ left: '-170px', bottom: '-46px', animationDelay: '0.6s' }} />
                    <ReviewCard review={TESTIMONIALS[3]} className="hidden lg:block absolute w-[260px] float-slow"
                        style={{ right: '-170px', bottom: '-30px', animationDelay: '1.8s' }} />

                    {/* Stacked reviews on smaller screens */}
                    <div className="lg:hidden mt-12 grid sm:grid-cols-2 gap-4">
                        {TESTIMONIALS.map((t) => (
                            <ReviewCard key={t.name} review={t} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BEST CHOICE ── cinematic cake-prep video watermark */}
            <section className="relative px-6 py-24 md:py-36 overflow-hidden" style={{ backgroundColor: GREEN }}>
                {/* Full-clarity cinematic background video — cropped into a wavy band */}
                <video
                    className="wave-mask absolute inset-0 w-full h-full object-cover pointer-events-none"
                    src="/chef-cake-prep.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-hidden="true"
                />
                {/* Light legibility scrim — masked to match the video band */}
                <div className="wave-mask absolute inset-0 pointer-events-none
                                bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.15)_45%,rgba(0,0,0,0.45)_100%)]" />

                <div className="relative z-10 max-w-3xl mx-auto text-center [text-shadow:0_2px_14px_rgba(0,0,0,0.55)]">
                    <p className="font-poppins text-[11px] md:text-[12px] uppercase tracking-[0.4em] text-[#f4d97b] mb-5">
                        Handcrafted Fresh · Every Single Day
                    </p>
                    <h2 className="font-script text-[52px] md:text-[76px] leading-[1.02] text-gold-shine mb-6">
                        Every Occasion Deserves Cake
                    </h2>
                    <p className="font-poppins text-[15px] md:text-[16px] text-white mb-9 max-w-xl mx-auto leading-relaxed">
                        At Cakeology, we turn simple ingredients into delectable works of edible art —
                        each cake baked fresh, finished by hand, and made to make your moment unforgettable.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {TAGS.map((tag) => (
                            <span
                                key={tag}
                                className="px-4 py-2 rounded-full font-poppins text-[12px] font-semibold uppercase tracking-[0.08em]
                                           text-[#5A1A2B] bg-[linear-gradient(135deg,#f4d97b,#fff6cf,#e6b23c)]
                                           ring-1 ring-white/40 shadow-[0_4px_14px_rgba(0,0,0,0.3)]"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <Wave color={CREAM} />

            {/* ── OUR CAKES GALLERY ── */}
            <section className="px-6 py-10 md:py-14 overflow-x-clip" style={{ backgroundColor: CREAM }}>
                <div className="max-w-6xl mx-auto">
                    <p className="font-poppins text-[11px] uppercase tracking-[0.35em] text-center mb-2" style={{ color: '#D05D4E' }}>
                        Freshly Baked · Handcrafted
                    </p>
                    <h2 className="font-script text-gold-deep text-[38px] md:text-[48px] text-center mb-6 md:mb-8">
                        Our Cake Gallery
                    </h2>
                    <CakeGallery />
                </div>
            </section>

            <Wave color={GREEN} />

            {/* ── READY TO ORDER CTA ── */}
            <section className="relative px-6 py-16 md:py-24 overflow-hidden" style={{ backgroundColor: GREEN }}>
                <div className="max-w-4xl mx-auto text-center">
                    <p className="font-poppins text-[11px] uppercase tracking-[0.35em] text-[#f4d97b] mb-3">
                        Craving Something Sweet?
                    </p>
                    <h2 className="font-script text-[42px] md:text-[60px] leading-none text-gold-shine mb-5">
                        Ready to Order?
                    </h2>
                    <p className="font-poppins text-[15px] md:text-[16px] text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
                        Browse our freshly baked cakes or pre-book a custom creation for your special day —
                        we’ll have it ready right on time.
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <button
                            onClick={() => navigate('/shop')}
                            className="px-8 py-3.5 rounded-full font-poppins text-[14px] font-semibold uppercase tracking-[0.12em] border backdrop-blur-md shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                            style={{ background: 'rgba(244, 217, 123, 0.18)', borderColor: 'rgba(244, 217, 123, 0.75)' }}
                        >
                            <span className="text-gold-shine">Shop Cakes</span>
                        </button>
                        <button
                            onClick={() => navigate('/customCake')}
                            className="px-8 py-3.5 rounded-full font-poppins text-[14px] font-semibold uppercase tracking-[0.12em] border backdrop-blur-md shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                            style={{ background: 'rgba(255, 255, 255, 0.08)', borderColor: 'rgba(244, 217, 123, 0.55)' }}
                        >
                            <span className="text-gold-shine">Pre-Book Order</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Wavy green underside so the band mirrors its wavy top edge */}
            <div style={{ backgroundColor: PEACH }}>
                <Wave color={GREEN} flip />
            </div>

            {/* ── VISIT & CONTACT ── */}
            <section id="contact" className="px-6 py-14 md:py-20" style={{ backgroundColor: PEACH }}>
                <div className="max-w-6xl mx-auto">
                    <p className="font-poppins text-[11px] uppercase tracking-[0.35em] text-center mb-2" style={{ color: '#D05D4E' }}>
                        Come Say Hello
                    </p>
                    <h2 className="font-script text-gold-deep text-[40px] md:text-[52px] text-center mb-8 md:mb-12">
                        Visit Us in Bagalkot
                    </h2>

                    <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-stretch">
                        {/* Map (with graceful fallback shown if the embed can't load) */}
                        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-lg ring-1 ring-[#5A1A2B]/10 min-h-[280px] md:min-h-[360px]">
                            <a
                                href="https://www.google.com/maps/search/?api=1&query=Cakeology+Vidyagiri+Bagalkot"
                                target="_blank"
                                rel="noreferrer"
                                className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6 text-[#F9E0D6]"
                                style={{ backgroundColor: GREEN }}
                            >
                                <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M12 21s-7-6.5-7-11a7 7 0 1114 0c0 4.5-7 11-7 11z" strokeLinejoin="round" />
                                    <circle cx="12" cy="10" r="2.5" />
                                </svg>
                                <span className="font-baloo text-[18px]">Vidyagiri, Bagalkot</span>
                                <span className="font-poppins text-[12px] uppercase tracking-[0.15em] underline">Open in Google Maps</span>
                            </a>
                            <iframe
                                title="The Cakeology location — Vidyagiri, Bagalkot"
                                src="https://maps.google.com/maps?q=Cakeology%20Vidyagiri%20Bagalkot&z=16&output=embed"
                                className="relative w-full h-full min-h-[280px] md:min-h-[360px] border-0"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                allowFullScreen
                            />
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-center gap-5">
                            <div className="flex gap-4">
                                <span className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[#F9E0D6]" style={{ backgroundColor: GREEN }}>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 21s-7-6.5-7-11a7 7 0 1114 0c0 4.5-7 11-7 11z" strokeLinejoin="round" />
                                        <circle cx="12" cy="10" r="2.5" />
                                    </svg>
                                </span>
                                <div>
                                    <h3 className="font-baloo font-semibold text-[16px] mb-0.5" style={{ color: GREEN }}>Our Store</h3>
                                    <p className="font-poppins text-[14px] text-[var(--color-bakejoy-slate)] leading-relaxed">
                                        Shop No. 5, Shri Siddeshwar (Jangi) Complex,<br />
                                        Opposite Vasavi Medical, College Circle,<br />
                                        Vidyagiri, Bagalkot, Karnataka 587102
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <span className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[#F9E0D6]" style={{ backgroundColor: GREEN }}>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8 11.6a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <div>
                                    <h3 className="font-baloo font-semibold text-[16px] mb-0.5" style={{ color: GREEN }}>Call / WhatsApp</h3>
                                    <a href="tel:+919900082208" className="font-poppins text-[14px] text-[var(--color-bakejoy-slate)] hover:text-[#D05D4E] transition-colors">
                                        +91 99000 82208
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <span className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[#F9E0D6]" style={{ backgroundColor: GREEN }}>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                                <div>
                                    <h3 className="font-baloo font-semibold text-[16px] mb-0.5" style={{ color: GREEN }}>Opening Hours</h3>
                                    <p className="font-poppins text-[14px] text-[var(--color-bakejoy-slate)]">Open Daily · 9:00 AM – 10:00 PM</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-2">
                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=Cakeology+Vidyagiri+Bagalkot"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-6 py-3 rounded-full text-[#F9E0D6] font-poppins text-[12px] font-semibold uppercase tracking-[0.12em] hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: GREEN }}
                                >
                                    Get Directions
                                </a>
                                <a
                                    href="https://wa.me/919900082208"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-6 py-3 rounded-full border font-poppins text-[12px] font-semibold uppercase tracking-[0.12em] hover:bg-white transition-colors"
                                    style={{ borderColor: GREEN, color: GREEN }}
                                >
                                    Chat on WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer id="footer" className="px-6 py-10 md:py-14" style={{ backgroundColor: GREEN }}>
                <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
                    <div className="col-span-2 md:col-span-1">
                        <span className="font-baloo font-bold text-[22px] text-white">Cakeology</span>
                        <p className="font-poppins text-[13px] text-white/60 mt-4 leading-relaxed">
                            Freshly baked cakes for every celebration.
                        </p>
                        <div className="flex items-center gap-3 mt-5">
                            <a
                                href="https://www.instagram.com/cakeology_bagalkote/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="w-9 h-9 flex items-center justify-center rounded-full border border-white/25 text-white/80 hover:text-white hover:border-white/60 hover:bg-white/10 transition"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                                </svg>
                            </a>
                            <a
                                href="https://www.facebook.com/cakeologyBgk/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                                className="w-9 h-9 flex items-center justify-center rounded-full border border-white/25 text-white/80 hover:text-white hover:border-white/60 hover:bg-white/10 transition"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-poppins text-[12px] uppercase tracking-[0.15em] text-white/50 mb-4">Shop</h4>
                        <ul className="space-y-2.5 font-poppins text-[14px] text-white/85">
                            <li><button onClick={() => navigate('/shop')} className="hover:opacity-70 cursor-pointer">Shop Cakes</button></li>
                            <li><button onClick={() => navigate('/customCake')} className="hover:opacity-70 cursor-pointer">Custom Cake</button></li>
                            <li><button onClick={() => navigate('/myOrders')} className="hover:opacity-70 cursor-pointer">My Orders</button></li>
                            <li><button onClick={() => navigate('/wishlist')} className="hover:opacity-70 cursor-pointer">Wishlist</button></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-poppins text-[12px] uppercase tracking-[0.15em] text-white/50 mb-4">Account</h4>
                        <ul className="space-y-2.5 font-poppins text-[14px] text-white/85">
                            {User ? (
                                <li><button onClick={() => navigate('/myCustomCakes')} className="hover:opacity-70 cursor-pointer">My Custom Cakes</button></li>
                            ) : (
                                <>
                                    <li><button onClick={() => navigate('/login')} className="hover:opacity-70 cursor-pointer">Login</button></li>
                                    <li><button onClick={() => navigate('/register')} className="hover:opacity-70 cursor-pointer">Register</button></li>
                                </>
                            )}
                            <li><button onClick={() => navigate('/cart')} className="hover:opacity-70 cursor-pointer">Cart</button></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto mt-8 md:mt-10 pt-6 border-t border-white/10 font-poppins text-[12px] text-white/40">
                    © 2026 Cakeology. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Landing;
