const Sparkle = ({ className = '', size = 20 }) => (
    <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={`sparkle ${className}`}
        aria-hidden="true"
    >
        <path d="M12 0c0 5.5 1.2 8.4 3.2 10.7C17.5 12.9 20.5 14 24 14c-4.9 0-7.8 1.2-10.1 3.2C11.6 19.5 12 22 12 24c0-4.9-1.2-7.8-3.2-10.1C6.5 11.6 3.5 12 0 12c4.9 0 7.8-1.2 10.1-3.2C12.4 6.5 12 3.5 12 0z" />
    </svg>
);

export default Sparkle;
