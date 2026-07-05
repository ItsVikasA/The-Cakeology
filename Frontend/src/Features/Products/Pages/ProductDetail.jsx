import { useSelector } from "react-redux";
import useProduct from "../Hook/useProduct";
import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useCart from "../../Cart/Hook/useCart";
import useSettings from "../../Admin/Hook/useSettings";
import { COLOR_SWATCHES } from "../constants/catalog";

const ProductDetail = () => {
    const { ProductHandler } = useProduct();
    const productData = useSelector((state) => state.products.Product);
    const User = useSelector((state) => state.auth.User);
    const { productId } = useParams();

    const navigate = useNavigate();
    const [mainImage, setMainImage] = useState("");
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const { addItemToCartHandler, addGuestItemHandler } = useCart();
    const { getPublicSettingsHandler } = useSettings();

    // Whether guests may shop without logging in (admin Checkout-mode toggle).
    // Default true so add-to-cart never falsely demands login before the
    // settings fetch resolves; only 'google' mode (not yet built) disables it.
    const [guestAllowed, setGuestAllowed] = useState(true);

    useEffect(() => {
        ProductHandler({ productId });
    }, [productId]);

    useEffect(() => {
        getPublicSettingsHandler()
            .then((s) => setGuestAllowed((s?.checkoutMode || 'guest') === 'guest'))
            .catch(() => {});
    }, []);


    useEffect(() => {
        if (selectedVariant?.images?.length > 0) {
            setMainImage(selectedVariant.images[0]);
        } else if (productData?.images?.length > 0) {
            setMainImage(productData.images[0]);
        }
    }, [productData, selectedVariant]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(""), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Extract unique attribute types and their available values
    const attributeStructure = useMemo(() => {
        if (!productData?.variants?.length) return {};

        const structure = {};
        productData.variants.forEach((variant) => {
            const attrs = variant.attribute || variant.attributes || {};
            if (typeof attrs === 'object' && !Array.isArray(attrs)) {
                Object.entries(attrs).forEach(([key, value]) => {
                    if (!structure[key]) {
                        structure[key] = new Set();
                    }
                    structure[key].add(value);
                });
            }
        });

        // Convert Sets to Arrays
        Object.keys(structure).forEach(key => {
            structure[key] = Array.from(structure[key]).sort();
        });

        return structure;
    }, [productData?.variants]);

    // Find matching variant based on selected attributes
    useEffect(() => {
        if (!productData?.variants?.length) return;

        const matchingVariant = productData.variants.find((variant) => {
            const attrs = variant.attribute || variant.attributes || {};
            return Object.keys(selectedAttributes).length > 0 &&
                Object.entries(selectedAttributes).every(
                    ([key, value]) => attrs[key] === value
                );
        });

        setSelectedVariant(matchingVariant || null);
    }, [selectedAttributes, productData?.variants]);

    if (!productData) {
        return (
            <div className="min-h-screen bg-[#F9E0D6] flex items-center justify-center font-poppins antialiased">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#5A1A2B] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#6B7280] text-[13px] uppercase tracking-[0.2em]">Loading Cake...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9E0D6] font-poppins antialiased">
            {/* Back Button Navigation */}
            <nav className="max-w-7xl mx-auto px-6 pt-8 pb-2 flex items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[#5A1A2B] hover:text-[#F37966] text-sm font-medium"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
            </nav>
            <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
                {/* ── MESSAGE DISPLAY ── */}
                {message && (
                    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-sm shadow-lg font-poppins text-[12px] font-medium uppercase tracking-[0.15em] transition-all duration-300
                        ${messageType === 'error'
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : 'bg-green-100 text-green-700 border border-green-300'}`}
                    >
                        {message}
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">

                    {/* ── LEFT COLUMN: IMAGERY ── */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Main Image Display */}
                        <div className="relative max-h-[125vh] max-w-[70vw] bg-white overflow-hidden group">
                            {mainImage ? (
                                <img
                                    src={mainImage}
                                    alt={productData.title}
                                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full bg-[#F9E0D6] animate-pulse" />
                            )}
                            {/* Zoom/Expand indicator (Decorative) */}
                            <div className="absolute bottom-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                </svg>
                            </div>
                        </div>

                        {/* Thumbnails Strip */}
                        {(selectedVariant?.images && selectedVariant.images.length > 1 || productData.images && productData.images.length > 1) && (
                            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                                {(selectedVariant?.images || productData.images).map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setMainImage(img)}
                                        className={`flex-shrink-0 w-24 aspect-[4/5] bg-white overflow-hidden transition-all duration-300 relative
                                                   ${mainImage === img ? 'ring-1 ring-[#5A1A2B]' : 'hover:opacity-80'}`}
                                    >
                                        <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                                        {mainImage === img && <div className="absolute inset-0 bg-[#5A1A2B]/5" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT COLUMN: DETAILS ── */}
                    <div className="lg:col-span-5 flex flex-col pt-4">
                        <header className="mb-10">
                            <span className="text-[11px] uppercase tracking-[0.3em] text-[#F37966] font-medium mb-3 block">
                                Freshly Baked
                            </span>
                            <h1 className="text-4xl lg:text-5xl font-baloo font-light text-[#5A1A2B] leading-tight mb-6">
                                {productData.title}
                            </h1>
                            <div className="flex items-baseline gap-4">
                                <span className="text-2xl font-poppins font-medium text-[#5A1A2B]">
                                    {productData.price?.currency === 'INR' ? '₹' : '$'}
                                    {productData.price?.amount?.toLocaleString()}
                                </span>
                                <span className="text-[11px] text-[#6B7280] uppercase tracking-wider">
                                    Taxes Included
                                </span>
                            </div>
                        </header>

                        <div className="space-y-8 mb-12">
                            <div>
                                <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#5A1A2B] font-bold mb-3">
                                    Description
                                </h3>
                                <p className="text-[#6B7280] text-[14px] leading-[1.8] font-light max-w-md">
                                    {productData.description}
                                </p>
                            </div>

                            {/* ── VARIANTS SECTION ── */}
                            {productData.variants && productData.variants.length > 0 && Object.keys(attributeStructure).length > 0 && (
                                <div className="space-y-6 pt-6 border-t border-[#F3D9CB]">
                                    <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#5A1A2B] font-bold">
                                        Select Options
                                    </h3>

                                    {Object.entries(attributeStructure).map(([attrName, attrValues]) => {
                                        const attrKey = attrName.trim().toLowerCase();
                                        const isSize = attrKey === 'size' || attrKey === 'weight';
                                        const isColor = attrKey === 'color' || attrKey === 'flavor' || attrKey === 'flavour';

                                        // Helper function to get the first image of a variant with this attribute value
                                        const getImageForAttributeValue = (attrValue) => {
                                            const variant = productData.variants.find((v) => {
                                                const attrs = v.attribute || v.attributes || {};
                                                return attrs[attrName] === attrValue;
                                            });
                                            return variant?.images?.[0] || null;
                                        };

                                        return (
                                            <div key={attrName} className="space-y-4">
                                                <label className="text-[11px] uppercase tracking-[0.15em] text-[#F37966] font-semibold block">
                                                    {attrName}
                                                </label>
                                                <div className="flex flex-wrap gap-6">
                                                    {attrValues.map((value) => {
                                                        const isSelected = selectedAttributes[attrName] === value;
                                                        const imageUrl = getImageForAttributeValue(value);

                                                        return (
                                                            <div key={`${attrName}-${value}`} className="flex flex-col items-center gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAttributes(prev => {
                                                                            const updated = { ...prev };
                                                                            if (updated[attrName] === value) {
                                                                                delete updated[attrName];
                                                                            } else {
                                                                                updated[attrName] = value;
                                                                            }
                                                                            return updated;
                                                                        });
                                                                    }}
                                                                    className={`w-16 h-16 rounded-full overflow-hidden transition-all duration-300 flex-shrink-0
                                                                        ${isSelected
                                                                            ? 'ring-2 ring-[#5A1A2B] ring-offset-2 shadow-lg'
                                                                            : 'ring-1 ring-[#F3D9CB] hover:ring-[#5A1A2B]'
                                                                        }`}
                                                                >
                                                                    {isSize ? (
                                                                        <div className="flex bg-[#43121F] text-white items-center justify-center w-full h-full">
                                                                            <h1 className="text-lg font-semibold">{value}</h1>
                                                                        </div>
                                                                    ) : isColor ? (
                                                                        <div
                                                                            className="w-full h-full"
                                                                            style={{ backgroundColor: COLOR_SWATCHES[value] || String(value).toLowerCase() }}
                                                                        />
                                                                    ) : imageUrl ? (
                                                                        <img
                                                                            src={imageUrl}
                                                                            alt={value}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-[#F9E0D6] flex items-center justify-center">
                                                                            <svg className="w-6 h-6 text-[#C9B5A8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                            </svg>
                                                                        </div>
                                                                    )}
                                                                </button>
                                                                <span className="text-[11px] uppercase tracking-wider font-medium text-[#5A1A2B] text-center">
                                                                    {value}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Selected Variant Info */}
                                    {selectedVariant && (
                                        <div className="mt-6 p-4 bg-[#F9E0D6] rounded-sm space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[12px] text-[#F37966] uppercase tracking-wider font-medium">
                                                    Stock Available:
                                                </span>
                                                <span className={`font-medium ${selectedVariant.stock > 0 ? 'text-[#5A1A2B]' : 'text-red-600'}`}>
                                                    {selectedVariant.stock} {selectedVariant.stock === 0 ? '(Out of Stock)' : ''}
                                                </span>
                                            </div>
                                            {selectedVariant.price?.amount && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[12px] text-[#F37966] uppercase tracking-wider font-medium">
                                                        Variant Price:
                                                    </span>
                                                    <span className="font-medium text-[#5A1A2B]">
                                                        ₹{selectedVariant.price.amount.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {Object.keys(selectedAttributes).length > 0 && !selectedVariant && (
                                        <div className="mt-6 p-4 bg-[#fce8e8] rounded-sm">
                                            <span className="text-[12px] text-red-600 uppercase tracking-wider font-medium">
                                                ✕ This combination is not available
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col gap-4 pt-6">
                                <button className={`w-full py-4 text-[#FFF6F0] font-poppins text-[12px] font-medium uppercase tracking-[0.2em] 
                                                 rounded-sm transition-all duration-300 active:scale-[0.98] shadow-lg
                                                 ${selectedVariant && selectedVariant.stock > 0
                                        ? 'bg-[#5A1A2B] hover:bg-[#43121F] cursor-pointer'
                                        : 'bg-[#C9B5A8] cursor-not-allowed'}`}
                                    disabled={!selectedVariant || selectedVariant.stock === 0}
                                    onClick={async () => {
                                        if (!User) {
                                            if (guestAllowed) {
                                                addGuestItemHandler(productData, selectedVariant);
                                                setMessage("Item added to cart successfully!");
                                                setMessageType("success");
                                                return;
                                            }
                                            setMessage("Please log in to add items to your cart");
                                            setMessageType("error");
                                            return;
                                        }
                                        try {
                                            const result = await addItemToCartHandler(productId, selectedVariant._id);
                                            if (result) {
                                                setMessage("Item added to cart successfully!");
                                                setMessageType("success");
                                            }
                                        } catch (error) {
                                            setMessage("Please log in to add items to your cart");
                                            setMessageType("error");
                                        }
                                    }}
                                >
                                    {selectedVariant
                                        ? selectedVariant.stock > 0
                                            ? 'Add Selected to Cart'
                                            : 'Out of Stock'
                                        : productData.variants?.length > 0
                                            ? 'Select Options First'
                                            : 'Purchase Now'
                                    }
                                </button>

                                <button className={`w-full py-4 border-2 font-poppins text-[12px] font-medium uppercase tracking-[0.2em] 
                                                 rounded-sm transition-all duration-300 active:scale-[0.98]
                                                 ${selectedVariant && selectedVariant.stock > 0
                                        ? 'border-[#5A1A2B] text-[#5A1A2B] hover:bg-[#F9E0D6] cursor-pointer'
                                        : 'border-[#C9B5A8] text-[#C9B5A8] cursor-not-allowed'}`}
                                    disabled={!selectedVariant || selectedVariant.stock === 0}
                                    onClick={async () => {
                                        if (!User) {
                                            if (guestAllowed) {
                                                addGuestItemHandler(productData, selectedVariant);
                                                navigate('/cart');
                                                return;
                                            }
                                            setMessage("Please log in to continue");
                                            setMessageType("error");
                                            return;
                                        }
                                        try {
                                            await addItemToCartHandler(productId, selectedVariant._id);
                                            navigate('/cart');
                                        } catch (error) {
                                            setMessage("Something went wrong. Please try again.");
                                            setMessageType("error");
                                        }
                                    }}
                                >
                                    Buy Now
                                </button>
                            </div>
                        </div>

                        {/* ── TONAL INFO SECTIONS ── */}
                        <div className="space-y-1 mt-auto">
                            <div className="bg-[#F9E0D6] p-6 group cursor-pointer transition-colors hover:bg-[#F3D9CB]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <svg className="w-5 h-5 text-[#F37966]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                        <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#5A1A2B]">Complimentary Shipping</span>
                                    </div>
                                    <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                <p className="mt-2 pl-9 text-[12px] text-[#6B7280] leading-relaxed">
                                    Standard delivery within 3-5 business days.
                                </p>
                            </div>

                            <div className="bg-[#F9E0D6] p-6 group cursor-pointer transition-colors hover:bg-[#F3D9CB]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <svg className="w-5 h-5 text-[#F37966]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
                                        </svg>
                                        <span className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#5A1A2B]">Freshness Guaranteed</span>
                                    </div>
                                    <svg className="w-3.5 h-3.5 text-[#6B7280]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                                <p className="mt-2 pl-9 text-[12px] text-[#6B7280] leading-relaxed">
                                    Every cake is baked fresh to order with premium ingredients.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* ── FOOTER ── */}
            <footer className="border-t border-[#F3D9CB] mt-20">
                <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <span className="font-baloo text-[16px] italic text-[#5A1A2B]">
                        Baked with Love
                    </span>
                    <span className="font-poppins text-[10px] font-light text-[#C9B5A8] uppercase tracking-[0.2em]">
                        © 2026 Cakeology. All rights reserved.
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default ProductDetail;  