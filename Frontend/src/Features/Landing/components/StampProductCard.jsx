import { useNavigate } from 'react-router-dom';

const StampProductCard = ({ product }) => {
    const navigate = useNavigate();
    const image = product?.images?.[0];

    return (
        <div
            onClick={() => navigate(`/product/${product?._id}`)}
            className="stamp-edge bg-white p-4 cursor-pointer transition-transform duration-300 hover:-translate-y-1"
        >
            <div className="aspect-square overflow-hidden bg-[var(--color-bakejoy-peach)]">
                {image ? (
                    <img src={image} alt={product?.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-bakejoy-coral)]/40 font-baloo text-2xl">🎂</div>
                )}
            </div>
            <div className="flex items-center justify-between mt-4">
                <div>
                    <h3 className="font-baloo text-[17px] text-[var(--color-bakejoy-green)] leading-tight">
                        {product?.title || 'Untitled Cake'}
                    </h3>
                    <span className="font-poppins text-[14px] font-semibold text-[var(--color-bakejoy-coral)]">
                        {product?.price?.currency === 'INR' ? '₹' : ''}{product?.price?.amount?.toLocaleString() || '0'}
                    </span>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/product/${product?._id}`); }}
                    aria-label="View cake"
                    className="w-9 h-9 rounded-lg bg-[var(--color-bakejoy-green)] text-white flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4l1-12z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default StampProductCard;
