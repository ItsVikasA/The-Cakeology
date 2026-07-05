import React, { useEffect, useState, useRef } from 'react'
import useProduct from '../Hook/useProduct';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { COLORS, COLOR_SWATCHES } from '../constants/catalog';
import useCatalog from '../../Catalog/Hook/useCatalog';

const SellerProductDetail = () => {
    const { ProductHandler, updateProductHandler, createVariantHandler, deleteVariantHandler } = useProduct();
    const { getCategoriesHandler, getBrandsHandler } = useCatalog();
    const productData = useSelector((state) => state.products.Product);
    const { productId } = useParams();
    const navigate = useNavigate();

    const imageInputRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const sizesFor = (slug) => categories.find((c) => c.slug === slug)?.sizeOptions || [];
    const categoryLabel = (slug) => categories.find((c) => c.slug === slug)?.name || slug || '';

    const [FormData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        brand: '',
        images: [],
        price: {
            amount: '',
            currency: 'INR'
        }
    });

    const [existingVariant, setExistingVariant] = useState();

    const [variantDeleteReq, setVariantDeleteReq] = useState([]);

    const [newVariants, setNewVariants] = useState([]);
    const [isAddingVariant, setIsAddingVariant] = useState(false);
    const [currentVariant, setCurrentVariant] = useState({
        flavor: '',
        weight: '',
        price: { amount: '', currency: 'INR' },
        stock: '',
        images: []
    });
    const [variantError, setVariantError] = useState('');
    const [showSuccessCard, setShowSuccessCard] = useState(false);

    const variantImageInputRef = useRef(null);

    useEffect(() => {
        ProductHandler({ productId });
        getCategoriesHandler().then(setCategories).catch(() => {});
        getBrandsHandler().then(setBrands).catch(() => {});
    }, [productId]);

    useEffect(() => {
        if (productData) {
            setFormData({
                title: productData.title,
                description: productData.description,
                category: productData.category || '',
                brand: productData.brand || '',
                price: productData.price,
                images: productData.images
            });
        }
    }, [productData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "amount" || name === "currency") {
            setFormData(prev => ({
                ...prev,
                price: { ...prev.price, [name]: value }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleImageRemove = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleImageAdd = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...files]
            }));
        }
    };

    // --- VARIANT HANDLERS ---
    const handleVariantChange = (e) => {
        const { name, value } = e.target;
        if (name === "amount") {
            setCurrentVariant(prev => ({
                ...prev,
                price: { ...prev.price, amount: value }
            }));
        } else {
            setCurrentVariant(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAttributeChange = (field, value) => {
        setCurrentVariant(prev => ({ ...prev, [field]: value }));
    };

    const handleVariantImageAdd = (e) => {
        const files = Array.from(e.target.files);
        setCurrentVariant(prev => ({
            ...prev,
            images: [...prev.images, ...files]
        }));
    };

    const handleVariantImageRemove = (index) => {
        setCurrentVariant(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const handleVariantDeleteReq = async (variantId) => {
        setVariantDeleteReq(prev => {
            if (prev && prev.includes(variantId)) {
                return prev.filter(id => id !== variantId);
            }
            return [...prev, variantId];
        });
    }

    const addVariantToStaging = () => {
        if (!currentVariant.flavor) {
            setVariantError("Please select a flavour.");
            return;
        }
        if (!currentVariant.weight) {
            setVariantError("Please select a weight.");
            return;
        }
        if (!currentVariant.stock) {
            setVariantError("Stock is required for a variant.");
            return;
        }
        setVariantError('');
        setNewVariants(prev => [...prev, currentVariant]);
        setCurrentVariant({
            flavor: '',
            weight: '',
            price: { amount: '', currency: 'INR' },
            stock: '',
            images: []
        });
        setIsAddingVariant(false);
    };

    const removeStagedVariant = (index) => {
        setNewVariants(prev => prev.filter((_, i) => i !== index));
    };

    const getImageSource = (img) => {
        if (img instanceof File) {
            return URL.createObjectURL(img);
        }
        return img;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedTitle = FormData.title === productData.title ? null : FormData.title;
            const updatedDescription = FormData.description === productData.description ? null : FormData.description;
            const updatedCategory = FormData.category === (productData.category || '') ? null : FormData.category;
            const updatedBrand = FormData.brand === (productData.brand || '') ? null : FormData.brand;
            const updatedPrice = JSON.stringify(FormData.price) === JSON.stringify(productData.price) ? null : FormData.price;
            const updatedVariants = JSON.stringify(FormData.variants) === JSON.stringify(productData.variants) ? null : FormData.variants;
            const updatedImages = FormData.images;

            // Update main product
            await updateProductHandler(productId, updatedTitle, updatedDescription, updatedPrice, updatedVariants, updatedImages, updatedCategory, updatedBrand);

            // Delete variant\
            await deleteVariantHandler(productId, variantDeleteReq);


            // Create new variants
            for (const variant of newVariants) {
                const attributeMap = { Flavor: variant.flavor, Weight: variant.weight };

                // Fallback price if variant price is empty (as it's optional)
                const variantPrice = variant.price.amount ? variant.price : FormData.price;

                await createVariantHandler({
                    productId,
                    attribute: attributeMap,
                    price: variantPrice,
                    stock: variant.stock,
                    images: variant.images
                });
            }

            setVariantDeleteReq([]);
            setNewVariants([]);
            setShowSuccessCard(true);
        }
        catch (error) {
            console.error("Failed to update product:", error);
        }
    };

    return (

            <div className="min-h-screen bg-[#F9E0D6] font-poppins text-[#5A1A2B] antialiased">
                {/* ── HEADER ── */}
                <header className="sticky top-0 z-40 bg-[#F9E0D6]/90 backdrop-blur-md border-b border-[#F3D9CB]">
                    <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate('/product/sellerProducts')}
                                className="group flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[#6B7280] hover:text-[#5A1A2B] transition-colors duration-300"
                            >
                                <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Cakes
                            </button>
                            <div className="w-px h-6 bg-[#F3D9CB]" />
                            <h2 className="font-baloo text-xl font-medium italic text-[#F37966]">Editing Product</h2>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                className="px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.15em] border border-[#F3D9CB] text-[#6B7280] hover:bg-white hover:text-[#5A1A2B] transition-all duration-300 rounded-sm"
                                onClick={() => { navigate('/product/sellerProducts') }}>

                                Discard
                            </button>
                            <button onClick={handleSubmit} className="px-8 py-2.5 bg-[#5A1A2B] text-[#FFF6F0] text-[11px] font-medium uppercase tracking-[0.15em] hover:bg-[#43121F] transition-all duration-300 rounded-sm shadow-lg shadow-[#5A1A2B]/10">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-6xl mx-auto px-6 py-12">
                    {/* Success Card */}
                    {showSuccessCard && (
                        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="bg-white border border-[#F3D9CB] rounded-sm p-8 flex items-center gap-6 shadow-lg shadow-[#5A1A2B]/5">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F9E0D6] flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-baloo text-xl font-light text-[#5A1A2B]">Product changes saved</h3>
                                    <p className="text-[13px] text-[#6B7280] mt-1">Your product have been successfully updated.</p>
                                </div>
                                <button
                                    onClick={() => navigate('/product/sellerProducts')}
                                    className="flex-shrink-0 px-6 py-2.5 bg-[#5A1A2B] text-[#FFF6F0] text-[11px] font-medium uppercase tracking-[0.15em] hover:bg-[#43121F] transition-all duration-300 rounded-sm whitespace-nowrap"
                                >
                                    Back to Cakes
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

                        {/* ── LEFT COLUMN: FORM ── */}
                        <div className="lg:col-span-7 space-y-16">
                            {/* Section: Basic Info */}
                            <section className="space-y-8">
                                <div className="space-y-2">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#F37966] font-semibold">Step 01</span>
                                    <h3 className="font-baloo text-3xl font-light tracking-tight">Essential Details</h3>
                                    <p className="text-[13px] text-[#6B7280] font-light">Define the core identity of your product. Titles should be evocative yet clear.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] uppercase tracking-[0.1em] text-[#5A1A2B] font-medium">Product Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={FormData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Classic Belgian Chocolate Truffle"
                                            className="w-full bg-transparent border-b border-[#F3D9CB] py-3 text-lg font-baloo placeholder:text-[#F3D9CB] focus:border-[#5A1A2B] focus:outline-none transition-colors duration-300"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[11px] uppercase tracking-[0.1em] text-[#5A1A2B] font-medium">Description</label>
                                        <textarea
                                            name="description"
                                            value={FormData.description}
                                            onChange={handleChange}
                                            rows={5}
                                            placeholder="Describe the layers, flavour and decoration of this cake..."
                                            className="w-full bg-transparent border border-[#F3D9CB] p-4 text-[14px] leading-relaxed placeholder:text-[#F3D9CB] focus:border-[#5A1A2B] focus:outline-none transition-colors duration-300 resize-none rounded-sm"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Section: Price & Category */}
                            <section className="pt-8 border-t border-[#F3D9CB] space-y-8">
                                <div className="space-y-2">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#F37966] font-semibold">Step 02</span>
                                    <h3 className="font-baloo text-3xl font-light tracking-tight">Valuation</h3>
                                </div>

                                <div className="max-w-xs space-y-2">
                                    <label className="text-[11px] uppercase tracking-[0.1em] text-[#5A1A2B] font-medium">Base Price (INR)</label>
                                    <div className="relative">
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6B7280] font-baloo text-xl">₹</span>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={FormData.price.amount}
                                            onChange={handleChange}
                                            className="w-full bg-transparent border-b border-[#F3D9CB] pl-6 py-3 text-xl font-baloo focus:border-[#5A1A2B] focus:outline-none transition-colors duration-300"
                                        />
                                    </div>
                                </div>

                                <div className="max-w-xs space-y-2">
                                    <label className="text-[11px] uppercase tracking-[0.1em] text-[#5A1A2B] font-medium">Category</label>
                                    <select
                                        name="category"
                                        value={FormData.category}
                                        onChange={handleChange}
                                        className="w-full bg-transparent border-b border-[#F3D9CB] py-3 text-[14px] text-[#5A1A2B] focus:border-[#5A1A2B] focus:outline-none transition-colors duration-300 cursor-pointer"
                                    >
                                        <option value="" disabled>Select a category...</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat.slug}>{cat.parent ? '— ' : ''}{cat.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-[#6B7280] italic">Sets the weight options available for variants.</p>
                                </div>

                                <div className="max-w-xs space-y-2">
                                    <label className="text-[11px] uppercase tracking-[0.1em] text-[#5A1A2B] font-medium">Brand (optional)</label>
                                    <select
                                        name="brand"
                                        value={FormData.brand}
                                        onChange={handleChange}
                                        className="w-full bg-transparent border-b border-[#F3D9CB] py-3 text-[14px] text-[#5A1A2B] focus:border-[#5A1A2B] focus:outline-none transition-colors duration-300 cursor-pointer"
                                    >
                                        <option value="">No brand</option>
                                        {brands.map((b) => (
                                            <option key={b._id} value={b.slug}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </section>

                            {/* Section: Variants */}
                            <section className="pt-12 border-t border-[#F3D9CB] space-y-10">
                                <div className="space-y-2">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#F37966] font-semibold">Step 04</span>
                                    <h3 className="font-baloo text-3xl font-light tracking-tight">Product Variants</h3>
                                    <p className="text-[13px] text-[#6B7280] font-light">Create versions of this product with unique attributes like flavour or weight.</p>
                                </div>

                                {/* Existing Variants */}
                                {productData?.variants?.length > 0 && (
                                    <div className="space-y-4 mb-8">
                                        <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#F37966] font-medium">Active Variants ({productData.variants.length})</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {productData.variants.map((v, idx) => {
                                                // Handle whether backend returns 'attribute' or 'attributes'
                                                const attributesObj = v.attribute || v.attributes || {};
                                                return (
                                                    <div key={idx} className="bg-white p-5 border border-[#F3D9CB] rounded-sm relative group opacity-90">
                                                        <div className="space-y-2">
                                                            <div className="flex flex-wrap gap-2">
                                                                {/* If it's stored as an object {key: value} */}
                                                                {typeof attributesObj === 'object' && !Array.isArray(attributesObj)
                                                                    ? Object.entries(attributesObj).map(([key, value], i) => (
                                                                        <span key={i} className="px-2 py-0.5 bg-[#F9E0D6] text-[10px] uppercase tracking-wider text-[#F37966] rounded-full">
                                                                            {key}: {value}
                                                                        </span>
                                                                    ))
                                                                    : Array.isArray(attributesObj)
                                                                        ? attributesObj.map((attr, i) => (
                                                                            <span key={i} className="px-2 py-0.5 bg-[#F9E0D6] text-[10px] uppercase tracking-wider text-[#F37966] rounded-full">
                                                                                {attr.key || Object.keys(attr)[0]}: {attr.value || Object.values(attr)[0]}
                                                                            </span>
                                                                        ))
                                                                        : null
                                                                }
                                                            </div>
                                                            {/* /////////////////////////////////////////////////////////////////////// */}
                                                            <div
                                                                className='absolute top-3 right-5 transition-normal p-1 rounded-sm hover:bg-[#F9E0D6]'
                                                                onClick={() => {
                                                                    handleVariantDeleteReq(v._id);
                                                                }}>

                                                                {variantDeleteReq.includes(v._id) ? (
                                                                    <svg className='h-4' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.9997 10.5865L16.9495 5.63672L18.3637 7.05093L13.4139 12.0007L18.3637 16.9504L16.9495 18.3646L11.9997 13.4149L7.04996 18.3646L5.63574 16.9504L10.5855 12.0007L5.63574 7.05093L7.04996 5.63672L11.9997 10.5865Z"></path></svg>
                                                                ) : (
                                                                    <svg className='h-4' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 6H22V8H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V8H2V6H7V3C7 2.44772 7.44772 2 8 2H16C16.5523 2 17 2.44772 17 3V6ZM18 8H6V20H18V8ZM9 11H11V17H9V11ZM13 11H15V17H13V11ZM9 4V6H15V4H9Z"></path></svg>
                                                                )}

                                                            </div>
                                                            <div className="text-[12px] text-[#5A1A2B] flex justify-between pt-2">
                                                                <span>Stock: {v.stock}</span>
                                                                <span className="italic font-baloo text-2xl text-[#F37966]">
                                                                    {v.price?.amount ? `₹${v.price.amount}` : "Inherited Price"}
                                                                </span>
                                                            </div>
                                                            {v.images?.length > 0 && (
                                                                <div className="flex gap-1 pt-2">
                                                                    {v.images.map((img, i) => (
                                                                        <img key={i} src={getImageSource(img.url || img)} className="w-8 h-8 object-cover rounded-xs" alt="" />
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Variant List (Staged) */}
                                {newVariants.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#F37966] font-medium">Staged Variants ({newVariants.length})</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {newVariants.map((v, idx) => (
                                                <div key={idx} className="bg-white p-5 border border-[#F3D9CB] rounded-sm relative group">
                                                    <button
                                                        onClick={() => removeStagedVariant(idx)}
                                                        className="absolute top-3 right-3 text-[#6B7280] hover:text-red-500 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                    <div className="space-y-2">
                                                        <div className="flex flex-wrap gap-2">
                                                            <span className="px-2 py-0.5 bg-[#F9E0D6] text-[10px] uppercase tracking-wider text-[#F37966] rounded-full">
                                                                Flavour: {v.flavor}
                                                            </span>
                                                            <span className="px-2 py-0.5 bg-[#F9E0D6] text-[10px] uppercase tracking-wider text-[#F37966] rounded-full">
                                                                Weight: {v.weight}
                                                            </span>
                                                        </div>
                                                        <div className="text-[12px] text-[#5A1A2B] flex justify-between pt-2">
                                                            <span>Stock: {v.stock}</span>
                                                            <span className="italic font-baloo text-[#F37966]">
                                                                {v.price.amount ? `₹${v.price.amount}` : "Inherited Price"}
                                                            </span>
                                                        </div>
                                                        {v.images.length > 0 && (
                                                            <div className="flex gap-1 pt-2">
                                                                {v.images.map((img, i) => (
                                                                    <img key={i} src={getImageSource(img)} className="w-8 h-8 object-cover rounded-xs" alt="" />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add Variant Control */}
                                {!isAddingVariant ? (
                                    <button
                                        onClick={() => setIsAddingVariant(true)}
                                        className="w-full py-8 border-2 border-dashed border-[#F3D9CB] rounded-sm flex flex-col items-center justify-center gap-3 text-[#F37966] hover:border-[#5A1A2B] hover:text-[#5A1A2B] transition-all duration-300 group bg-white/50"
                                    >
                                        <div className="w-12 h-12 rounded-full border border-[#F3D9CB] flex items-center justify-center group-hover:border-[#5A1A2B] transition-colors">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <div className="text-center">
                                            <span className="block text-[11px] uppercase tracking-[0.2em] font-medium">Add Product Variant</span>
                                            <span className="block text-[10px] text-[#6B7280] mt-1 font-light italic">Define flavours, weights, or specifications</span>
                                        </div>
                                    </button>
                                ) : (
                                    <div className="bg-white p-10 border border-[#F3D9CB] rounded-sm space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <h4 className="font-baloo text-2xl font-light text-[#5A1A2B]">Configure New Variant</h4>
                                                <p className="text-[11px] text-[#6B7280] italic">Set unique attributes for this version</p>
                                            </div>
                                            <button
                                                onClick={() => setIsAddingVariant(false)}
                                                className="p-2 text-[#6B7280] hover:text-[#5A1A2B] transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Attributes Builder */}
                                        <div className="space-y-6">
                                            <label className="text-[11px] uppercase tracking-[0.1em] text-[#5A1A2B] font-medium block">
                                                Defining Attributes
                                                {productData?.category && (
                                                    <span className="ml-2 text-[#6B7280] font-light normal-case tracking-normal">
                                                        — {categoryLabel(productData.category)}
                                                    </span>
                                                )}
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                {/* Flavour swatches */}
                                                <div className="space-y-3">
                                                    <span className="text-[10px] uppercase tracking-[0.1em] text-[#F37966] font-medium block">
                                                        Flavour {currentVariant.flavor && <span className="text-[#5A1A2B] normal-case tracking-normal">· {currentVariant.flavor}</span>}
                                                    </span>
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {COLORS.map((flavor) => {
                                                            const selected = currentVariant.flavor === flavor;
                                                            return (
                                                                <button
                                                                    key={flavor}
                                                                    type="button"
                                                                    title={flavor}
                                                                    onClick={() => handleAttributeChange('flavor', flavor)}
                                                                    className={`w-8 h-8 rounded-full border transition-all duration-150 ${selected ? 'ring-2 ring-offset-2 ring-[#5A1A2B] border-transparent' : 'border-[#F3D9CB] hover:border-[#5A1A2B]'}`}
                                                                    style={{ backgroundColor: COLOR_SWATCHES[flavor] || '#ccc' }}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Weight chips (driven by category) */}
                                                <div className="space-y-3">
                                                    <span className="text-[10px] uppercase tracking-[0.1em] text-[#F37966] font-medium block">Weight</span>
                                                    {sizesFor(productData?.category).length === 0 ? (
                                                        <p className="text-[10px] text-[#6B7280] italic">
                                                            This product has no category set, so weights are unavailable.
                                                        </p>
                                                    ) : (
                                                        <div className="flex flex-wrap gap-2">
                                                            {sizesFor(productData?.category).map((weight) => {
                                                                const selected = currentVariant.weight === weight;
                                                                return (
                                                                    <button
                                                                        key={weight}
                                                                        type="button"
                                                                        onClick={() => handleAttributeChange('weight', weight)}
                                                                        className={`min-w-[44px] px-3 py-2 rounded-sm border text-[12px] font-medium transition-all duration-150 ${selected ? 'bg-[#5A1A2B] text-[#FFF6F0] border-[#5A1A2B]' : 'bg-white text-[#5A1A2B] border-[#F3D9CB] hover:border-[#5A1A2B]'}`}
                                                                    >
                                                                        {weight}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price & Stock */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[11px] uppercase tracking-[0.1em] text-[#5A1A2B] font-medium">Override Price (Optional)</label>
                                                <div className="relative">
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6B7280] font-baloo">₹</span>
                                                    <input
                                                        type="number"
                                                        name="amount"
                                                        value={currentVariant.price.amount}
                                                        onChange={handleVariantChange}
                                                        className="w-full bg-transparent border-b border-[#F3D9CB] pl-4 py-2 text-[14px] focus:border-[#5A1A2B] focus:outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] uppercase tracking-[0.1em] text-[#5A1A2B] font-medium">Available Stock</label>
                                                <input
                                                    type="number"
                                                    name="stock"
                                                    value={currentVariant.stock}
                                                    onChange={handleVariantChange}
                                                    className="w-full bg-transparent border-b border-[#F3D9CB] py-2 text-[14px] focus:border-[#5A1A2B] focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {/* Variant Images */}
                                        <div className="space-y-4">
                                            <label className="text-[11px] uppercase tracking-[0.1em] text-[#5A1A2B] font-medium block">Variant Imagery</label>
                                            <div className="flex flex-wrap gap-4">
                                                {currentVariant.images.map((img, idx) => (
                                                    <div key={idx} className="relative w-16 h-20 bg-[#F9E0D6] rounded-xs group">
                                                        <img src={getImageSource(img)} className="w-full h-full object-cover rounded-xs" alt="" />
                                                        <button
                                                            onClick={() => handleVariantImageRemove(idx)}
                                                            className="absolute -top-2 -right-2 w-5 h-5 bg-white shadow-sm border border-[#F3D9CB] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => variantImageInputRef.current?.click()}
                                                    className="w-16 h-20 border border-dashed border-[#F3D9CB] flex flex-col items-center justify-center gap-1 text-[#6B7280] hover:border-[#5A1A2B] hover:text-[#5A1A2B] transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    <span className="text-[8px] uppercase tracking-tighter">Add</span>
                                                </button>
                                                <input type="file" ref={variantImageInputRef} onChange={handleVariantImageAdd} multiple accept="image/*" className="hidden" />
                                            </div>
                                        </div>

                                        {variantError && (
                                            <div className="text-red-500 text-[11px] tracking-[0.05em] text-center mb-2">
                                                {variantError}
                                            </div>
                                        )}
                                        <button
                                            onClick={addVariantToStaging}
                                            className="w-full py-4 border border-[#5A1A2B] text-[#5A1A2B] text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#5A1A2B] hover:text-[#FFF6F0] transition-all duration-300 rounded-sm"
                                        >
                                            Add to Staging List
                                        </button>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* ── RIGHT COLUMN: MEDIA ── */}
                        <div className="lg:col-span-5">
                            <div className="sticky top-32 space-y-8">
                                <div className="space-y-2 text-right">
                                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#F37966] font-semibold">Step 03</span>
                                    <h3 className="font-baloo text-3xl font-light tracking-tight">Cake Photos</h3>
                                    <p className="text-[13px] text-[#6B7280] font-light">Great photos sell cakes. Arrange your best shots with care.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {FormData.images.map((img, idx) => (
                                        <div key={idx} className="relative aspect-[3/4] bg-[#F9E0D6] overflow-hidden group">
                                            <img
                                                src={getImageSource(img)}
                                                alt={`Preview ${idx}`}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-[#5A1A2B]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                <button
                                                    onClick={() => handleImageRemove(idx)}
                                                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#5A1A2B] hover:bg-white transition-all duration-200"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            {idx === 0 && (
                                                <span className="absolute top-3 left-3 px-2 py-1 bg-[#5A1A2B] text-[#FFF6F0] text-[8px] uppercase tracking-[0.15em] font-medium">Main</span>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => imageInputRef.current?.click()}
                                        className="aspect-[3/4] border-2 border-dashed border-[#F3D9CB] flex flex-col items-center justify-center gap-3 text-[#6B7280] hover:border-[#5A1A2B] hover:text-[#5A1A2B] transition-all duration-300 group"
                                    >
                                        <svg className="w-8 h-8 font-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Add Media</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={imageInputRef}
                                        onChange={handleImageAdd}
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                    />
                                </div>

                                <div className="p-6 bg-white border border-[#F3D9CB] rounded-sm">
                                    <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#5A1A2B] font-medium mb-3">Inventory Status</h4>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                            <span className="text-[13px] text-[#5A1A2B]">Live in Boutique</span>
                                        </div>
                                        <button className="text-[11px] text-[#F37966] hover:underline">Mark as Archive</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>

                <div className="h-24" />
            </div>
    );
};

export default SellerProductDetail;
