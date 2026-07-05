import { useState, useEffect, useRef } from 'react';
import { CAKE_GALLERY } from '../constants/galleryImages';

// Evenly sample ~48 cakes for a varied, smooth 3-row strip.
const SAMPLE = (() => {
    const want = 48;
    const step = Math.max(1, Math.floor(CAKE_GALLERY.length / want));
    const out = [];
    for (let i = 0; i < CAKE_GALLERY.length && out.length < want; i += step) out.push(CAKE_GALLERY[i]);
    return out;
})();

const ROWS = 3;
const ITEM = 110;                 // photo size (px)
const GAP = 18;
const SP = ITEM + GAP;            // horizontal spacing within a row
const ROW_GAP = 14;
const ROW_STEP = ITEM + ROW_GAP;  // vertical spacing between rows
const AMP = 24;                   // gentle arc height
const PAD_TOP = 32;               // top room so the arc peak isn't clipped
const SPEED = 0.6;                // px/frame → drift left → right

// Distribute the photos round-robin across 3 rows, then flatten with row/col.
const ROWS_ITEMS = Array.from({ length: ROWS }, () => []);
SAMPLE.forEach((src, i) => ROWS_ITEMS[i % ROWS].push(src));
const FLAT = [];
ROWS_ITEMS.forEach((arr, r) => arr.forEach((src, c) => FLAT.push({ src, r, c, count: arr.length })));

const CakeGallery = () => {
    const stageRef = useRef(null);
    const itemRefs = useRef([]);
    const offsetRef = useRef(0);
    const pausedRef = useRef(false);
    const drag = useRef({ down: false, lastX: 0, moved: false });
    const [lightbox, setLightbox] = useState(null);

    // Each row is an evenly-spaced marquee (no overlap); a shallow arc lifts the
    // photos toward the middle of the screen and lets them dip at the edges.
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        let raf;

        const frame = () => {
            const vw = stage.clientWidth || window.innerWidth;
            if (!pausedRef.current) offsetRef.current += SPEED;
            const off = offsetRef.current;

            for (let k = 0; k < FLAT.length; k++) {
                const el = itemRefs.current[k];
                if (!el) continue;
                const { r, c, count } = FLAT[k];
                const totalR = count * SP;                 // full width of this row's loop
                const phase = r * (SP / 3);                // stagger rows like brickwork
                const x = (((c * SP + off + phase) % totalR) + totalR) % totalR; // 0..totalR (loops)
                const t = Math.min(1, Math.max(0, x / vw));
                const y = PAD_TOP + r * ROW_STEP - AMP * Math.sin(Math.PI * t);
                el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
            }
            raf = requestAnimationFrame(frame);
        };
        raf = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(raf);
    }, []);

    // Drag left/right to move the strip yourself (auto-scroll pauses meanwhile).
    const onPointerDown = (e) => { drag.current = { down: true, lastX: e.clientX, moved: false }; pausedRef.current = true; };
    const onPointerMove = (e) => {
        if (!drag.current.down) return;
        const dx = e.clientX - drag.current.lastX;
        if (Math.abs(dx) > 2) drag.current.moved = true;
        offsetRef.current += dx;
        drag.current.lastX = e.clientX;
    };
    const endDrag = () => { drag.current.down = false; pausedRef.current = false; };

    const downloadImage = async (e, src) => {
        e.stopPropagation();
        try {
            const res = await fetch(src);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = src.split('/').pop() || 'cakeology-cake.jpg';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch {
            window.open(src, '_blank');
        }
    };

    const DownloadIcon = ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
        </svg>
    );

    return (
        <>
            {/* Full-bleed stage so the 3-row strip runs edge to edge. */}
            <div
                ref={stageRef}
                onMouseEnter={() => { pausedRef.current = true; }}
                onMouseLeave={() => { if (!drag.current.down) pausedRef.current = false; }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerLeave={endDrag}
                style={{ touchAction: 'pan-y' }}
                className="relative left-1/2 -translate-x-1/2 w-screen h-[400px] overflow-hidden select-none cursor-grab active:cursor-grabbing"
            >
                {FLAT.map((it, k) => (
                    <div
                        key={`${it.src}-${k}`}
                        ref={(el) => (itemRefs.current[k] = el)}
                        onClick={() => { if (!drag.current.moved) setLightbox(it.src); }}
                        style={{ width: ITEM, height: ITEM, willChange: 'transform' }}
                        className="group absolute top-0 left-0 rounded-lg overflow-hidden ring-1 ring-[#5A1A2B]/10 shadow-[0_12px_24px_rgba(90,26,43,0.18)] cursor-pointer"
                    >
                        <img
                            src={it.src}
                            alt={`Cakeology cake ${k + 1}`}
                            loading="lazy"
                            draggable={false}
                            className="w-full h-full object-cover"
                        />
                        <span className="absolute inset-0 bg-[#5A1A2B]/0 group-hover:bg-[#5A1A2B]/15 transition-colors pointer-events-none" />
                        <button
                            type="button"
                            onClick={(e) => downloadImage(e, it.src)}
                            onPointerDown={(e) => e.stopPropagation()}
                            aria-label="Download image"
                            title="Download"
                            className="absolute top-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-full
                                       bg-[#5A1A2B]/70 hover:bg-[#5A1A2B] text-white backdrop-blur-sm
                                       opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <DownloadIcon className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out"
                    onClick={() => setLightbox(null)}
                >
                    <img
                        src={lightbox}
                        alt="Cakeology cake"
                        className="max-w-full max-h-[88vh] rounded-2xl shadow-2xl ring-2 ring-[#f4d97b]/50"
                    />
                    <button
                        onClick={(e) => downloadImage(e, lightbox)}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-6 py-3 rounded-full
                                   bg-[#5A1A2B] hover:bg-[#43121F] text-white font-poppins text-[12px] font-semibold uppercase tracking-[0.14em] cursor-pointer"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Download
                    </button>
                    <button
                        onClick={() => setLightbox(null)}
                        className="absolute top-5 right-6 text-white/90 hover:text-white text-3xl leading-none cursor-pointer"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
            )}
        </>
    );
};

export default CakeGallery;
