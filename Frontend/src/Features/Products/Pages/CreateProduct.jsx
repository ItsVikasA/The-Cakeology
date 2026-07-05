import { useState } from "react";
import { useSelector } from "react-redux";
import useProduct from "../Hook/useProduct";
import useCatalog from "../../Catalog/Hook/useCatalog";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { COLORS, COLOR_SWATCHES } from "../constants/catalog";

const CreateProduct = () => {
    const navigate = useNavigate();
    const { createProductHandler, createVariantHandler } = useProduct();
    const { getCategoriesHandler, getBrandsHandler } = useCatalog();

    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);

    const [productData, setProductData] = useState({
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

    useEffect(() => {
        getCategoriesHandler().then(setCategories).catch(() => {});
        getBrandsHandler().then(setBrands).catch(() => {});
    }, []);

    // Size options for the currently selected category.
    const sizesFor = (slug) => categories.find((c) => c.slug === slug)?.sizeOptions || [];
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "amount" || name === "currency") {
            setProductData(prev => ({
                ...prev,
                price: { ...prev.price, [name]: value }
            }));
        } else {
            setProductData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const [imagePreviews, setImagePreviews] = useState([]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        // Append to existing images
        setProductData(prev => ({
            ...prev,
            images: [...prev.images, ...files]
        }));

        // Generate and append previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeImage = (index) => {
        setProductData(prev => {
            const newImages = [...prev.images];
            newImages.splice(index, 1);
            return { ...prev, images: newImages };
        });
        setImagePreviews(prev => {
            const newPreviews = [...prev];
            URL.revokeObjectURL(newPreviews[index]);
            newPreviews.splice(index, 1);
            return newPreviews;
        });
    };

    const [showSuccess, setShowSuccess] = useState(false);
    const [publishError, setPublishError] = useState('');

    // --- VARIANT HANDLERS ---
    const getImageSource = (img) => (img instanceof File ? URL.createObjectURL(img) : img);

    const handleVariantField = (field, value) => {
        if (field === 'amount') {
            setCurrentVariant(prev => ({ ...prev, price: { ...prev.price, amount: value } }));
        } else {
            setCurrentVariant(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleVariantImageAdd = (e) => {
        const files = Array.from(e.target.files);
        setCurrentVariant(prev => ({ ...prev, images: [...prev.images, ...files] }));
    };

    const handleVariantImageRemove = (index) => {
        setCurrentVariant(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
    };

    const resetCurrentVariant = () => setCurrentVariant({
        flavor: '',
        weight: '',
        price: { amount: '', currency: 'INR' },
        stock: '',
        images: []
    });

    const addVariantToStaging = () => {
        if (!currentVariant.flavor) return setVariantError("Please select a flavour.");
        if (!currentVariant.weight) return setVariantError("Please select a weight.");
        if (!currentVariant.stock) return setVariantError("Stock is required for a variant.");
        setVariantError('');
        setNewVariants(prev => [...prev, currentVariant]);
        resetCurrentVariant();
        setIsAddingVariant(false);
    };

    const removeStagedVariant = (index) => {
        setNewVariants(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setPublishError('');
        try {
            const product = await createProductHandler(productData);
            if (product?._id) {
                // Create each staged variant for the new product.
                for (const variant of newVariants) {
                    const attribute = { Flavor: variant.flavor, Weight: variant.weight };
                    const variantPrice = variant.price.amount ? variant.price : productData.price;
                    await createVariantHandler({
                        productId: product._id,
                        attribute,
                        price: variantPrice,
                        stock: variant.stock,
                        images: variant.images
                    });
                }

                setShowSuccess(true);

                // Reset form
                setProductData({
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
                setNewVariants([]);
                resetCurrentVariant();
                setIsAddingVariant(false);

                // Clear previews and revoke URLs
                imagePreviews.forEach(url => URL.revokeObjectURL(url));
                setImagePreviews([]);

                // Auto-hide success message after 5 seconds
                setTimeout(() => setShowSuccess(false), 5000);
            }
        } catch (error) {
            console.error("Failed to create product:", error);
            setPublishError(error.message || 'Failed to publish product. Please try again.');
        }
    };

    // Clean up URLs on unmount
    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);

    return (
            <div className="font-poppins">
                {/* ── MAIN CONTENT ── */}
                <main className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
                    {/* Page Title Section */}
                    <div className="mb-12 lg:mb-16">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm
                                             text-[9px] font-medium uppercase tracking-[0.16em] text-[#F37966]
                                             border border-[rgba(138,110,82,0.25)] bg-[rgba(138,110,82,0.06)]">
                                <span className="w-[5px] h-[5px] rounded-full bg-[#F37966]" />
                                New Cake
                            </span>
                        </div>
                        <h1 className="font-baloo text-[clamp(36px,4.5vw,52px)] font-light text-[#5A1A2B] leading-[1.1] tracking-[-0.01em] mb-3">
                            Add New{' '}
                            <em className="not-italic italic font-light text-[#F37966]">Product</em>
                        </h1>
                        <p className="font-poppins text-[13.5px] font-light text-[#6B7280] leading-relaxed max-w-md">
                            Curate your inventory with precision. Every detail matters in the storytelling of your brand.
                        </p>
                        {/* Divider */}
                        <div className="w-12 h-px bg-[rgba(138,110,82,0.3)] mt-8" />
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                        {/* ── LEFT COLUMN: FORM FIELDS ── */}
                        <div className="lg:col-span-8 space-y-12">
                            {/* General Information Section */}
                            <section className="space-y-8">
                                <div className="space-y-1.5">
                                    <label htmlFor="title" className="block font-poppins text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F37966]">
                                        Product Title
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        name="title"
                                        value={productData.title}
                                        onChange={handleChange}
                                        className="w-full bg-white/50 border border-[#F3D9CB] rounded-sm px-5 py-4
                                                   font-poppins text-[15px] text-[#5A1A2B] placeholder:text-[#C9B5A8]
                                                   focus:outline-none focus:border-[#F37966] transition-colors duration-300"
                                        placeholder="Enter a descriptive title..."
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="description" className="block font-poppins text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F37966]">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={productData.description}
                                        onChange={handleChange}
                                        rows="6"
                                        className="w-full bg-white/50 border border-[#F3D9CB] rounded-sm px-5 py-4
                                                   font-poppins text-[14px] text-[#5A1A2B] placeholder:text-[#C9B5A8]
                                                   focus:outline-none focus:border-[#F37966] transition-colors duration-300 resize-none"
                                        placeholder="Describe the layers, flavour and decoration..."
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="category" className="block font-poppins text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F37966]">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={productData.category}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-white/50 border border-[#F3D9CB] rounded-sm px-5 py-4
                                                   font-poppins text-[14px] text-[#5A1A2B]
                                                   focus:outline-none focus:border-[#F37966] transition-colors duration-300 appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select a category...</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat.slug}>
                                                {cat.parent ? '— ' : ''}{cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="font-poppins text-[11px] font-light text-[#6B7280] pt-1">
                                        Determines the weight options available when adding variants.
                                    </p>
                                </div>

                                <div className="space-y-1.5">
                                    <label htmlFor="brand" className="block font-poppins text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F37966]">
                                        Brand (optional)
                                    </label>
                                    <select
                                        id="brand"
                                        name="brand"
                                        value={productData.brand}
                                        onChange={handleChange}
                                        className="w-full bg-white/50 border border-[#F3D9CB] rounded-sm px-5 py-4
                                                   font-poppins text-[14px] text-[#5A1A2B]
                                                   focus:outline-none focus:border-[#F37966] transition-colors duration-300 appearance-none cursor-pointer"
                                    >
                                        <option value="">No brand</option>
                                        {brands.map((b) => (
                                            <option key={b._id} value={b.slug}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </section>

                            {/* Media Section */}
                            <section className="space-y-4">
                                <label className="block font-poppins text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F37966]">
                                    Product Imagery
                                </label>
                                <div className="space-y-6">
                                    <div className="relative group">
                                        <div className="w-full h-48 border border-[#F3D9CB] border-dashed rounded-sm bg-white/30
                                                        flex flex-col items-center justify-center gap-3 group-hover:bg-white/50 transition-colors duration-300">
                                            <div className="w-10 h-10 rounded-full bg-[#F9E0D6] border border-[#F3D9CB] flex items-center justify-center">
                                                <svg className="w-4 h-4 text-[#F37966]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <div className="text-center px-4">
                                                <p className="font-poppins text-[12px] font-medium text-[#5A1A2B]">Add More Images</p>
                                                <p className="font-poppins text-[10px] text-[#6B7280] mt-0.5">High resolution visuals create higher conversion.</p>
                                            </div>
                                        </div>
                                        <input
                                            id="images"
                                            name="images"
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>

                                    {/* Image Preview Grid */}
                                    {imagePreviews.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {imagePreviews.map((url, idx) => (
                                                <div key={idx} className="relative aspect-square rounded-sm overflow-hidden border border-[#F3D9CB] bg-white group">
                                                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(idx)}
                                                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-[#5A1A2B]/80 backdrop-blur-sm rounded-full 
                                                                   flex items-center justify-center text-white opacity-0 group-hover:opacity-100 
                                                                   transition-all duration-200 hover:bg-[#5A1A2B]"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-[#5A1A2B]/40 backdrop-blur-[2px] py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[8px] text-white uppercase tracking-widest font-medium">Image {idx + 1}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Pricing Section */}
                            <section className="pt-8 border-t border-[#F3D9CB]">
                                <h3 className="font-baloo text-[24px] font-light text-[#5A1A2B] mb-6">Pricing Detail</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-1.5">
                                        <label htmlFor="amount" className="block font-poppins text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F37966]">
                                            Amount
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 font-baloo text-[18px] text-[#F37966]">
                                                {productData.price.currency === 'INR' ? '₹' : productData.price.currency}
                                            </span>
                                            <input
                                                type="number"
                                                id="amount"
                                                name="amount"
                                                value={productData.price.amount}
                                                onChange={handleChange}
                                                className="w-full bg-white/50 border border-[#F3D9CB] rounded-sm pl-10 pr-5 py-4
                                                           font-poppins text-[15px] text-[#5A1A2B] focus:outline-none focus:border-[#F37966]"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="currency" className="block font-poppins text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F37966]">
                                            Currency
                                        </label>
                                        <select
                                            id="currency"
                                            name="currency"
                                            value={productData.price.currency}
                                            onChange={handleChange}
                                            className="w-full bg-white/50 border border-[#F3D9CB] rounded-sm px-5 py-4
                                                       font-poppins text-[13px] text-[#5A1A2B] focus:outline-none focus:border-[#F37966] appearance-none cursor-pointer"
                                        >
                                            <option value="INR">INR - Indian Rupee</option>
                                            <option value="USD">USD - US Dollar</option>
                                            <option value="EUR">EUR - Euro</option>
                                            <option value="GBP">GBP - Pound Sterling</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            {/* Variants Section */}
                            <section className="pt-8 border-t border-[#F3D9CB] space-y-6">
                                <div>
                                    <h3 className="font-baloo text-[24px] font-light text-[#5A1A2B]">Product Variants</h3>
                                    <p className="font-poppins text-[12px] font-light text-[#6B7280] mt-1">
                                        Add flavour/weight versions with their own stock and images. Weight options come from the selected category.
                                    </p>
                                </div>

                                {/* Staged variants */}
                                {newVariants.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {newVariants.map((v, idx) => (
                                            <div key={idx} className="bg-white p-5 border border-[#F3D9CB] rounded-sm relative">
                                                <button
                                                    type="button"
                                                    onClick={() => removeStagedVariant(idx)}
                                                    className="absolute top-3 right-3 text-[#6B7280] hover:text-red-500 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="px-2 py-0.5 bg-[#F9E0D6] text-[10px] uppercase tracking-wider text-[#F37966] rounded-full">Flavour: {v.flavor}</span>
                                                    <span className="px-2 py-0.5 bg-[#F9E0D6] text-[10px] uppercase tracking-wider text-[#F37966] rounded-full">Weight: {v.weight}</span>
                                                </div>
                                                <div className="text-[12px] text-[#5A1A2B] flex justify-between pt-3">
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
                                        ))}
                                    </div>
                                )}

                                {/* Add variant control */}
                                {!isAddingVariant ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!productData.category) {
                                                setVariantError("Select a category first to enable weights.");
                                                return;
                                            }
                                            setVariantError('');
                                            setIsAddingVariant(true);
                                        }}
                                        className="w-full py-6 border-2 border-dashed border-[#F3D9CB] rounded-sm flex flex-col items-center justify-center gap-2 text-[#F37966] hover:border-[#5A1A2B] hover:text-[#5A1A2B] transition-all duration-300 bg-white/50"
                                    >
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-[11px] uppercase tracking-[0.2em] font-medium">Add Variant</span>
                                    </button>
                                ) : (
                                    <div className="bg-white p-8 border border-[#F3D9CB] rounded-sm space-y-8">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-baloo text-xl font-light text-[#5A1A2B]">Configure Variant</h4>
                                            <button type="button" onClick={() => { setIsAddingVariant(false); setVariantError(''); }} className="p-2 text-[#6B7280] hover:text-[#5A1A2B]">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Flavour + Weight */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <span className="text-[10px] uppercase tracking-[0.1em] text-[#F37966] font-medium block">
                                                    Flavour {currentVariant.flavor && <span className="text-[#5A1A2B] normal-case tracking-normal">· {currentVariant.flavor}</span>}
                                                </span>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {COLORS.map((c) => {
                                                        const selected = currentVariant.flavor === c;
                                                        return (
                                                            <button
                                                                key={c}
                                                                type="button"
                                                                title={c}
                                                                onClick={() => handleVariantField('flavor', c)}
                                                                className={`w-8 h-8 rounded-full border transition-all duration-150 ${selected ? 'ring-2 ring-offset-2 ring-[#5A1A2B] border-transparent' : 'border-[#F3D9CB] hover:border-[#5A1A2B]'}`}
                                                                style={{ backgroundColor: COLOR_SWATCHES[c] || '#ccc' }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <span className="text-[10px] uppercase tracking-[0.1em] text-[#F37966] font-medium block">Weight</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {sizesFor(productData.category).map((s) => {
                                                        const selected = currentVariant.weight === s;
                                                        return (
                                                            <button
                                                                key={s}
                                                                type="button"
                                                                onClick={() => handleVariantField('weight', s)}
                                                                className={`min-w-[44px] px-3 py-2 rounded-sm border text-[12px] font-medium transition-all duration-150 ${selected ? 'bg-[#5A1A2B] text-[#FFF6F0] border-[#5A1A2B]' : 'bg-white text-[#5A1A2B] border-[#F3D9CB] hover:border-[#5A1A2B]'}`}
                                                            >
                                                                {s}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price + Stock */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <span className="text-[10px] uppercase tracking-[0.1em] text-[#F37966] font-medium block">Override Price (Optional)</span>
                                                <div className="relative">
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#6B7280] font-baloo">₹</span>
                                                    <input
                                                        type="number"
                                                        value={currentVariant.price.amount}
                                                        onChange={(e) => handleVariantField('amount', e.target.value)}
                                                        className="w-full bg-transparent border-b border-[#F3D9CB] pl-4 py-2 text-[14px] text-[#5A1A2B] focus:border-[#5A1A2B] focus:outline-none transition-colors"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <span className="text-[10px] uppercase tracking-[0.1em] text-[#F37966] font-medium block">Available Stock</span>
                                                <input
                                                    type="number"
                                                    value={currentVariant.stock}
                                                    onChange={(e) => handleVariantField('stock', e.target.value)}
                                                    className="w-full bg-transparent border-b border-[#F3D9CB] py-2 text-[14px] text-[#5A1A2B] focus:border-[#5A1A2B] focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        {/* Variant images */}
                                        <div className="space-y-3">
                                            <span className="text-[10px] uppercase tracking-[0.1em] text-[#F37966] font-medium block">Variant Imagery (Optional)</span>
                                            <div className="flex flex-wrap gap-3">
                                                {currentVariant.images.map((img, idx) => (
                                                    <div key={idx} className="relative w-16 h-20 bg-[#F9E0D6] rounded-xs group">
                                                        <img src={getImageSource(img)} className="w-full h-full object-cover rounded-xs" alt="" />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleVariantImageRemove(idx)}
                                                            className="absolute -top-2 -right-2 w-5 h-5 bg-white shadow-sm border border-[#F3D9CB] rounded-full flex items-center justify-center"
                                                        >
                                                            <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className="w-16 h-20 border border-dashed border-[#F3D9CB] flex flex-col items-center justify-center gap-1 text-[#6B7280] hover:border-[#5A1A2B] hover:text-[#5A1A2B] transition-colors cursor-pointer">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    <span className="text-[8px] uppercase tracking-tighter">Add</span>
                                                    <input type="file" onChange={handleVariantImageAdd} multiple accept="image/*" className="hidden" />
                                                </label>
                                            </div>
                                        </div>

                                        {variantError && (
                                            <p className="text-red-500 text-[11px] tracking-[0.05em] text-center">{variantError}</p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={addVariantToStaging}
                                            className="w-full py-3.5 border border-[#5A1A2B] text-[#5A1A2B] text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#5A1A2B] hover:text-[#FFF6F0] transition-all duration-300 rounded-sm"
                                        >
                                            Add to Variant List
                                        </button>
                                    </div>
                                )}
                                {variantError && !isAddingVariant && (
                                    <p className="text-red-500 text-[11px] tracking-[0.05em]">{variantError}</p>
                                )}
                            </section>

                            {/* Publish Action */}
                            <div className="pt-12">
                                {publishError && (
                                    <div className="mb-5 p-4 bg-[#f8d7da] border border-[#f5c6cb] rounded-sm text-[#721c24] text-[13px] font-light">
                                        {publishError}
                                    </div>
                                )}
                                <button
                                    type="submit"
                                    className="w-full lg:w-auto px-12 py-4 bg-[#5A1A2B] text-[#F9E0D6] rounded-sm
                                               text-[12px] font-medium uppercase tracking-[0.2em] cursor-pointer
                                               transition-all duration-300 hover:bg-[#43121F] hover:shadow-xl active:scale-[0.98]"
                                >
                                    Publish Product
                                </button>
                            </div>
                        </div>

                        {/* ── RIGHT COLUMN: INFO/TIPS ── */}
                        <div className="lg:col-span-4 space-y-10">
                            {/* Guidance Card */}
                            <div className="bg-white/40 backdrop-blur-sm border border-[#F3D9CB] p-8 rounded-sm space-y-6">
                                <h4 className="font-baloo text-[20px] font-medium text-[#5A1A2B] border-b border-[#F3D9CB] pb-4">
                                    Baker's Notes
                                </h4>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <span className="block font-poppins text-[11px] font-semibold text-[#F37966] uppercase tracking-wider">Imagery</span>
                                        <p className="font-poppins text-[12px] text-[#6B7280] leading-relaxed">
                                            Use natural lighting and high contrast. Minimum 3 images recommended for luxury feel.
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block font-poppins text-[11px] font-semibold text-[#F37966] uppercase tracking-wider">Storytelling</span>
                                        <p className="font-poppins text-[12px] text-[#6B7280] leading-relaxed">
                                            Detail the ingredients, the flavour, and the story behind each cake.
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="block font-poppins text-[11px] font-semibold text-[#F37966] uppercase tracking-wider">Pricing</span>
                                        <p className="font-poppins text-[12px] text-[#6B7280] leading-relaxed">
                                            Honest pricing reflects the true value of the artistry involved.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Badge */}
                            <div className="relative aspect-[4/5] bg-[#F9E0D6] rounded-sm overflow-hidden border border-[#F3D9CB] group">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-16 h-16 text-[#F3D9CB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div className="absolute bottom-6 left-6 right-6">
                                    <div className="h-4 w-2/3 bg-white/40 mb-2 rounded-full animate-pulse" />
                                    <div className="h-6 w-1/3 bg-[#F37966]/20 rounded-full animate-pulse" />
                                </div>
                                <div className="absolute inset-0 bg-[#5A1A2B]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                    <span className="bg-white px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#5A1A2B] shadow-sm">
                                        Preview Card
                                    </span>
                                </div>
                            </div>
                        </div>
                    </form>
                </main>

                {/* ── FOOTER ── */}
                <footer className="border-t border-[#F3D9CB] mt-16 bg-[#F9E0D6]">
                    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex items-center justify-between">
                        <span className="font-poppins text-[11px] font-light text-[#C9B5A8] tracking-[0.04em]">
                            © 2026 Cakeology. All rights reserved.
                        </span>
                        <span className="font-poppins text-[11px] font-light text-[#C9B5A8] tracking-[0.04em]">
                            Artisan Portal
                        </span>
                    </div>
                </footer>

                {/* Success Message Overlay */}
                {showSuccess && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
                        <div className="absolute inset-0 bg-[#5A1A2B]/20 backdrop-blur-sm" onClick={() => setShowSuccess(false)} />
                        <div className="relative bg-white p-10 rounded-sm shadow-2xl border border-[#F3D9CB] max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
                            <div className="w-16 h-16 bg-[#F9E0D6] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#F3D9CB]">
                                <svg className="w-8 h-8 text-[#F37966]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="font-baloo text-[28px] font-light text-[#5A1A2B] mb-2">Cake Saved</h3>
                            <p className="font-poppins text-[13px] text-[#6B7280] leading-relaxed mb-8">
                                Your new creation has been successfully added to the catalogue.
                            </p>
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="w-full py-3.5 bg-[#5A1A2B] text-[#F9E0D6] rounded-sm text-[11px] font-medium uppercase tracking-[0.2em] cursor-pointer"
                            >
                                Continue Curating
                            </button>
                        </div>
                    </div>
                )}
            </div>
    );
};

export default CreateProduct;  