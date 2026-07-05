import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useProduct from '../Hook/useProduct';
import { getCategoryLabel } from '../constants/catalog';

const SellerProductCard = ({ product }) => {
    const [currentImage, setCurrentImage] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const navigate = useNavigate();
    const { deleteProductHandler } = useProduct();

    const images = product?.images || [];
    const hasMultipleImages = images.length > 1;

    const variantCount = product?.variants?.length || 0;
    const totalStock = (product?.variants || []).reduce((s, v) => s + (v?.stock || 0), 0);
    const outOfStock = variantCount > 0 && totalStock === 0;
    const lowStock = variantCount > 0 && totalStock > 0 && totalStock <= 5;

    const handleDelete = async (e) => {
        e.stopPropagation();
        setDeleting(true);
        try {
            await deleteProductHandler(product._id);
        } catch (err) {
            console.error('Delete failed:', err);
            setDeleting(false);
            setConfirmDelete(false);
        }
    };

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
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Image Container */}
            <div className="relative aspect-[4/5] overflow-hidden bg-[#F9E0D6]">
                {/* Stock status badge */}
                {outOfStock && (
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-sm bg-[#5A1A2B]/80 backdrop-blur-sm text-[9px] font-medium uppercase tracking-[0.12em] text-white">
                        Out of Stock
                    </div>
                )}
                {lowStock && (
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-sm bg-[#c0392b]/90 backdrop-blur-sm text-[9px] font-medium uppercase tracking-[0.12em] text-white">
                        Low · {totalStock} left
                    </div>
                )}
                {images.length > 0 ? (
                    <img
                        src={images[currentImage]}
                        alt={product?.title || 'Product'}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out
                       group-hover:scale-[1.03]"
                    />
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
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-sm
                          bg-[#5A1A2B]/60 backdrop-blur-sm
                          text-[9px] font-medium uppercase tracking-[0.1em] text-white/90">
                        {currentImage + 1} / {images.length}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Category + inventory meta */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    {product?.category && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F9E0D6] text-[9px] uppercase tracking-[0.12em] text-[#F37966] font-medium">
                            {getCategoryLabel(product.category)}
                        </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-[#F9E0D6] text-[9px] uppercase tracking-[0.12em] text-[#6B7280] font-medium">
                        {variantCount} variant{variantCount === 1 ? '' : 's'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.12em] font-medium ${outOfStock ? 'bg-[#fce8e8] text-[#c0392b]' : 'bg-[#F9E0D6] text-[#6B7280]'}`}>
                        {totalStock} in stock
                    </span>
                </div>

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

                {/* Product Price & Actions */}
                <div className="mt-1 flex items-center justify-between gap-1.5">
                    <span className="font-baloo text-[20px] font-medium text-[#5A1A2B]">
                        {product?.price?.currency === 'INR' ? '₹' : product?.price?.currency || ''}{product?.price?.amount?.toLocaleString() || '0'}
                    </span>

                    <div className="flex items-center gap-2">
                        {!confirmDelete ? (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                                    className="flex items-center justify-center w-8 h-8 border border-[#F3D9CB] text-[#c0392b] rounded-sm
                                               cursor-pointer transition-all duration-200 hover:bg-[#fce8e8] active:scale-[0.95]"
                                    aria-label="Delete product"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`${product?._id}`);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5A1A2B] text-white rounded-sm
                                               text-[10px] font-medium uppercase tracking-[0.1em] cursor-pointer
                                               transition-all duration-200 hover:bg-[#43121F] active:scale-[0.95]"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Edit
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                                    disabled={deleting}
                                    className="px-3 py-1.5 border border-[#F3D9CB] text-[#6B7280] rounded-sm text-[10px] font-medium uppercase tracking-[0.1em] cursor-pointer hover:text-[#5A1A2B] disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="px-3 py-1.5 bg-[#c0392b] text-white rounded-sm text-[10px] font-medium uppercase tracking-[0.1em] cursor-pointer hover:bg-[#a93226] disabled:opacity-50"
                                >
                                    {deleting ? 'Deleting…' : 'Confirm'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerProductCard;
