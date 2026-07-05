import { useState, useEffect, useRef } from 'react';

// Returns true when a sticky top bar should hide: scrolling DOWN past a small
// threshold hides it; scrolling UP (or being near the top) shows it again.
// Pair with a `transition-transform` + `-translate-y-full` on the element.
export default function useHideOnScroll(threshold = 80) {
    const [hidden, setHidden] = useState(false);
    const lastY = useRef(0);

    useEffect(() => {
        lastY.current = window.scrollY;

        const onScroll = () => {
            const y = window.scrollY;
            const delta = y - lastY.current;
            // Ignore tiny jitters (and momentum bounce past the top/bottom).
            if (Math.abs(delta) < 6) return;
            // Always reveal near the very top; otherwise follow the direction.
            setHidden(delta > 0 && y > threshold);
            lastY.current = y;
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [threshold]);

    return hidden;
}
