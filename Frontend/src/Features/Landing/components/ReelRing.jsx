import { useEffect, useRef, useState } from 'react';

const REELS = [
    '/reels/WA0175.mp4',
    '/reels/WA0100.mp4',
    '/reels/WA0102.mp4',
    '/reels/WA0170.mp4',
    '/reels/WA0173.mp4',
    '/reels/WA0099.mp4',
    '/reels/WA0066.mp4',
    '/reels/WA0098.mp4',
];

// Ring sizing scales with viewport: tight/small on phones, wide & large on desktop.
const getDims = (w) => {
    if (w >= 1280) return { itemW: 210, itemH: 372, radius: 440 }; // large desktop
    if (w >= 1024) return { itemW: 196, itemH: 348, radius: 380 }; // desktop
    if (w >= 768)  return { itemW: 184, itemH: 326, radius: 320 }; // tablet
    if (w >= 480)  return { itemW: 168, itemH: 298, radius: 250 }; // large phone
    return { itemW: 150, itemH: 266, radius: 205 };                 // small phone
};

/**
 * A 3D carousel: the reels sit around a vertical ring (like a cylinder) and
 * the whole ring auto-rotates slowly. Drag / swipe left–right to spin it
 * yourself — the way you flick between Android home screens — then it eases
 * back into its gentle drift.
 */
const ReelRing = () => {
    const step = 360 / REELS.length;
    const [angle, setAngle] = useState(0);
    const [dims, setDims] = useState(() =>
        getDims(typeof window !== 'undefined' ? window.innerWidth : 1024)
    );

    // Recompute ring size on resize (small ring on mobile, larger on desktop).
    useEffect(() => {
        const onResize = () => setDims(getDims(window.innerWidth));
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const { itemW: ITEM_W, itemH: ITEM_H, radius: RADIUS } = dims;

    // The front reel (translateZ toward the camera) is magnified by the perspective,
    // so the container must be tall enough to show it fully — otherwise its
    // top/bottom corners get clipped by overflow-hidden.
    const PERSPECTIVE = 1500;
    const magnification = PERSPECTIVE / (PERSPECTIVE - RADIUS);
    const containerH = Math.round(ITEM_H * magnification) + 56;

    const angleRef = useRef(0);      // current rotation (source of truth)
    const velRef = useRef(0);        // momentum after a flick (deg/frame)
    const draggingRef = useRef(false);
    const dragStart = useRef({ x: 0, a: 0, t: 0, lastX: 0, lastT: 0 });

    const videoRefs = useRef([]);    // <video> nodes, indexed by reel
    const playingRef = useRef([]);   // tracks current play/pause state per reel

    // Only the reels facing the viewer decode/play; the rest pause. Decoding all
    // eight at once overwhelms the browser and makes every reel stutter — keeping
    // ~3 active (front + its two neighbours) keeps them smooth.
    useEffect(() => {
        for (let i = 0; i < REELS.length; i++) {
            const v = videoRefs.current[i];
            if (!v) continue;
            const itemAngle = i * step;
            const facing = Math.cos(((itemAngle + angle) * Math.PI) / 180);
            const shouldPlay = facing > 0.35; // front-facing hemisphere
            if (shouldPlay && !playingRef.current[i]) {
                playingRef.current[i] = true;
                const p = v.play();
                if (p && p.catch) p.catch(() => {});
            } else if (!shouldPlay && playingRef.current[i]) {
                playingRef.current[i] = false;
                v.pause();
            }
        }
    }, [angle, step]);

    // Animation loop: auto-drift + momentum, paused while actively dragging.
    useEffect(() => {
        let raf;
        let prev = performance.now();
        const tick = (now) => {
            const dt = now - prev;
            prev = now;
            if (!draggingRef.current) {
                // decay any flick momentum, fall back to a slow constant drift
                if (Math.abs(velRef.current) > 0.02) {
                    angleRef.current += velRef.current;
                    velRef.current *= 0.95;
                } else {
                    angleRef.current -= dt * 0.004; // ~4°/sec ambient spin
                }
                setAngle(angleRef.current);
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, []);

    const pointX = (e) => (e.touches ? e.touches[0].clientX : e.clientX);

    const onDown = (e) => {
        draggingRef.current = true;
        velRef.current = 0;
        const x = pointX(e);
        dragStart.current = { x, a: angleRef.current, t: performance.now(), lastX: x, lastT: performance.now() };
    };

    const onMove = (e) => {
        if (!draggingRef.current) return;
        const x = pointX(e);
        angleRef.current = dragStart.current.a + (x - dragStart.current.x) * 0.35;
        setAngle(angleRef.current);
        dragStart.current.lastX = x;
        dragStart.current.lastT = performance.now();
    };

    const onUp = (e) => {
        if (!draggingRef.current) return;
        draggingRef.current = false;
        // convert the final drag speed into momentum for a natural flick
        const x = e.changedTouches ? e.changedTouches[0].clientX : dragStart.current.lastX;
        const dt = performance.now() - dragStart.current.lastT || 16;
        velRef.current = Math.max(-6, Math.min(6, ((x - dragStart.current.lastX) / dt) * 6));
    };

    return (
        <div
            className="relative mt-10 md:mt-14 overflow-hidden -mx-6 cursor-grab active:cursor-grabbing select-none touch-pan-y"
            style={{ height: ITEM_H + 60, perspective: '1200px' }}
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={onDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
        >
            <div
                className="absolute left-1/2 top-1/2"
                style={{ transformStyle: 'preserve-3d', transform: `translate(-50%, -50%) rotateY(${angle}deg)` }}
            >
                {REELS.map((src, i) => {
                    const itemAngle = i * step;
                    // how much this reel faces the viewer: 1 = front, -1 = back
                    const facing = Math.cos(((itemAngle + angle) * Math.PI) / 180);
                    const t = facing * 0.5 + 0.5; // 0..1
                    const opacity = 0.28 + 0.72 * t;
                    const scale = 0.82 + 0.18 * t;
                    return (
                        <div
                            key={src}
                            className="shine-frame absolute p-[3px] rounded-[22px] shadow-[0_0_28px_rgba(244,217,123,0.45)]"
                            style={{
                                width: ITEM_W,
                                height: ITEM_H,
                                left: -ITEM_W / 2,
                                top: -ITEM_H / 2,
                                transform: `rotateY(${itemAngle}deg) translateZ(${RADIUS}px) scale(${scale})`,
                                opacity,
                                zIndex: Math.round(t * 100),
                                animationDelay: `${(i % 3) * -1.3}s`,
                            }}
                        >
                            <video
                                ref={(el) => { videoRefs.current[i] = el; }}
                                src={src}
                                muted
                                loop
                                autoPlay
                                playsInline
                                preload="metadata"
                                draggable={false}
                                // Nudge to the first frame so even paused / autoplay-blocked
                                // reels render a still instead of a blank black rectangle.
                                onLoadedMetadata={(e) => { try { e.currentTarget.currentTime = 0.05; } catch { /* noop */ } }}
                                className="block w-full h-full object-cover rounded-[19px] bg-black pointer-events-none"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ReelRing;
