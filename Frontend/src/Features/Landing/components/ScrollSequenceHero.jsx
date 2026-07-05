import { useEffect, useRef, useState } from 'react';

const FRAME_COUNT = 75;
const framePath = (i) => `/sequence/frame_${String(i).padStart(2, '0')}.jpg`;

// Pinned scroll-scrubbed image sequence used as the hero background.
// The wrapper is tall (200vh); while it's in view the inner canvas stays
// sticky and swaps frames based on how far the user has scrolled through it.
const ScrollSequenceHero = ({ children }) => {
    const wrapperRef = useRef(null);
    const canvasRef = useRef(null);
    const imagesRef = useRef([]);
    const loadedRef = useRef(0);
    const [ready, setReady] = useState(false);
    const frameRef = useRef(0);
    const rafRef = useRef(null);

    // Preload frames: frame 0 first (blocks first paint), the rest trickle in
    // afterwards so scrubbing gets smoother as more of the sequence loads.
    useEffect(() => {
        let cancelled = false;
        const images = new Array(FRAME_COUNT);
        imagesRef.current = images;

        const loadFrame = (i) => new Promise((resolve) => {
            const img = new Image();
            img.onload = () => { loadedRef.current += 1; resolve(); };
            img.onerror = () => resolve();
            img.src = framePath(i);
            images[i] = img;
        });

        (async () => {
            await loadFrame(0);
            if (cancelled) return;
            setReady(true);
            draw(0);
            for (let i = 1; i < FRAME_COUNT; i++) {
                if (cancelled) return;
                await loadFrame(i);
            }
        })();

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const draw = (index) => {
        const canvas = canvasRef.current;
        const img = imagesRef.current[index];
        if (!canvas || !img || !img.complete || !img.naturalWidth) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const cssW = canvas.clientWidth;
        const cssH = canvas.clientHeight;
        if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
            canvas.width = cssW * dpr;
            canvas.height = cssH * dpr;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // cover-fit
        const scale = Math.max(cssW / img.naturalWidth, cssH / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const x = (cssW - w) / 2;
        const y = (cssH - h) / 2;
        ctx.clearRect(0, 0, cssW, cssH);
        ctx.drawImage(img, x, y, w, h);
    };

    useEffect(() => {
        const onScroll = () => {
            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(() => {
                rafRef.current = null;
                const el = wrapperRef.current;
                if (!el) return;
                const rect = el.getBoundingClientRect();
                const scrollable = rect.height - window.innerHeight;
                const progress = scrollable > 0
                    ? Math.min(1, Math.max(0, -rect.top / scrollable))
                    : 0;

                // Snap to the nearest already-loaded frame so scrubbing never
                // shows a blank canvas while later frames are still loading.
                let idx = Math.round(progress * (FRAME_COUNT - 1));
                while (idx > 0 && !(imagesRef.current[idx]?.complete)) idx--;

                if (idx !== frameRef.current) {
                    frameRef.current = idx;
                    draw(idx);
                }
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        onScroll();
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <div ref={wrapperRef} className="relative h-[200vh]">
            <div className="sticky top-0 h-screen w-full overflow-hidden">
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
                {!ready && (
                    <div className="absolute inset-0 bg-[var(--color-bakejoy-peach)] animate-pulse" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bakejoy-cream)]/20 via-transparent to-[var(--color-bakejoy-cream)]/35" />
                <div className="relative h-full flex items-center justify-center px-6">
                    {children}
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce">
                    <span className="font-poppins text-[10px] uppercase tracking-[0.2em] text-[#5A1A2B]/70 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full">
                        Keep scrolling
                    </span>
                    <svg className="w-4 h-4 text-[#5A1A2B]/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default ScrollSequenceHero;
