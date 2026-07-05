const CircularText = ({ text = 'CAKEOLOGY', className = '' }) => {
    const id = 'circular-text-path';
    const repeated = `${text} • ${text} • `;

    return (
        <svg viewBox="0 0 200 200" className={`animate-[spin_18s_linear_infinite] ${className}`} aria-hidden="true">
            <path id={id} fill="none" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
            <text fill="var(--color-bakejoy-coral)" fontSize="12" fontFamily="var(--font-baloo)" letterSpacing="2">
                <textPath href={`#${id}`} startOffset="0%">{repeated}</textPath>
            </text>
        </svg>
    );
};

export default CircularText;
