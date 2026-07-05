import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useWishlist from '../../Wishlist/Hook/useWishlist';

const ProductCard = ({ product }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const navigate = useNavigate();
  const User = useSelector((state) => state.auth.User);
  const wishlistIds = useSelector((state) => state.wishlist.ids);
  const { toggleWishlistHandler } = useWishlist();

  const isWished = wishlistIds?.includes(product?._id);

  const handleWishlist = async (e) => {
    e.stopPropagation();
    if (!User) {
      navigate('/login');
      return;
    }
    try {
      await toggleWishlistHandler(product._id);
    } catch (err) {
      console.error('Wishlist toggle failed:', err);
    }
  };

  const images = product?.images || [];
  const hasMultipleImages = images.length > 1;

  const totalStock = (product?.variants || []).reduce((s, v) => s + (v?.stock || 0), 0);
  const hasVariants = (product?.variants || []).length > 0;
  const outOfStock = hasVariants && totalStock === 0;
  const lowStock = hasVariants && totalStock > 0 && totalStock <= 5;

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      className="group relative bg-white rounded-sm overflow-hidden border border-[#F3D9CB]
                 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(90, 26, 43,0.08)]
                 hover:border-[#F3D9CB]"
      onClick={() => {
        navigate(`/product/${product?._id}`)
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F9E0D6]">
        {/* Stock badge */}
        {outOfStock && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-sm bg-[#5A1A2B]/80 backdrop-blur-sm text-[9px] font-medium uppercase tracking-[0.12em] text-white">
            Out of Stock
          </div>
        )}
        {lowStock && (
          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-sm bg-[#c0392b]/90 backdrop-blur-sm text-[9px] font-medium uppercase tracking-[0.12em] text-white">
            Low Stock · {totalStock} left
          </div>
        )}

        {/* Wishlist heart */}
        <button
          onClick={handleWishlist}
          aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-white/40 flex items-center justify-center transition-all duration-200 hover:bg-white cursor-pointer"
        >
          <svg
            className={`w-4 h-4 transition-colors ${isWished ? 'text-[#c0392b]' : 'text-[#5A1A2B]'}`}
            fill={isWished ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {images.length > 0 ? (
          <>
            {!imageLoaded && <div className="absolute inset-0 bg-[#F9E0D6] animate-pulse" />}
            <img
              src={images[currentImage]}
              alt={product?.title || 'Product'}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-all duration-700 ease-out
                         group-hover:scale-[1.03] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-[#F3D9CB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Image Navigation Arrows */}
        {hasMultipleImages && isHovered && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                         bg-white/80 backdrop-blur-sm border border-white/40
                         flex items-center justify-center
                         text-[#5A1A2B] hover:bg-white transition-all duration-200
                         opacity-0 group-hover:opacity-100 cursor-pointer"
              aria-label="Previous image"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full
                         bg-white/80 backdrop-blur-sm border border-white/40
                         flex items-center justify-center
                         text-[#5A1A2B] hover:bg-white transition-all duration-200
                         opacity-0 group-hover:opacity-100 cursor-pointer"
              aria-label="Next image"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Image Dots */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentImage(idx); }}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 cursor-pointer
                  ${idx === currentImage
                    ? 'bg-white w-4 shadow-sm'
                    : 'bg-white/50 hover:bg-white/80'
                  }`}
                aria-label={`View image ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Image count badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-sm
                          bg-[#5A1A2B]/60 backdrop-blur-sm
                          text-[9px] font-medium uppercase tracking-[0.1em] text-white/90">
            {currentImage + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-baloo text-[20px] font-medium text-[#5A1A2B] leading-snug mb-2
                       tracking-[-0.01em]">
          {product?.title || 'Untitled Product'}
        </h3>
        <p className="font-poppins text-[12.5px] font-light text-[#6B7280] leading-relaxed line-clamp-2">
          {product?.description || 'No description provided.'}
        </p>

        {/* Divider */}
        <div className="w-8 h-px bg-[#F3D9CB] mt-4 mb-3 group-hover:w-12 group-hover:bg-[#D05D4E]
                        transition-all duration-500" />

        {/* Product Price */}
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-baloo text-[20px] font-medium text-[#5A1A2B]">
            {product?.price?.currency === 'INR' ? '₹' : product?.price?.currency || ''}{product?.price?.amount?.toLocaleString() || '0'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
