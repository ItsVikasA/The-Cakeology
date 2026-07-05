const Wave = ({ color, flip = false }) => (
    <div className="w-full overflow-hidden leading-none -mb-px" aria-hidden="true">
        <svg
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
            className="w-full h-[48px] md:h-[80px]"
            style={flip ? { transform: 'scaleY(-1)' } : undefined}
        >
            <path
                fill={color}
                d="M0,32L60,42.7C120,53,240,75,360,80C480,85,600,75,720,64C840,53,960,43,1080,48C1200,53,1320,75,1380,85.3L1440,96L1440,100L0,100Z"
            />
        </svg>
    </div>
);

export default Wave;
