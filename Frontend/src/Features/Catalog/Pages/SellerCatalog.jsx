import React, { useEffect, useState } from 'react';
import useCatalog from '../Hook/useCatalog';

const SellerCatalog = () => {
    const {
        getCategoriesHandler, createCategoryHandler, deleteCategoryHandler,
        getBrandsHandler, createBrandHandler, deleteBrandHandler,
    } = useCatalog();

    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);

    // Category form
    const [catName, setCatName] = useState('');
    const [catParent, setCatParent] = useState('');
    const [catSizes, setCatSizes] = useState('');
    const [catError, setCatError] = useState('');

    // Brand form
    const [brandName, setBrandName] = useState('');
    const [brandError, setBrandError] = useState('');

    const load = async () => {
        try {
            const [cats, brs] = await Promise.all([getCategoriesHandler(), getBrandsHandler()]);
            setCategories(cats || []);
            setBrands(brs || []);
        } catch (e) {
            console.error('Failed to load catalog:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const topLevel = categories.filter((c) => !c.parent);
    const subsOf = (id) => categories.filter((c) => String(c.parent) === String(id));
    const categoryName = (id) => categories.find((c) => String(c._id) === String(id))?.name || '';

    const handleAddCategory = async (e) => {
        e.preventDefault();
        setCatError('');
        if (!catName.trim()) return setCatError('Name is required.');
        try {
            await createCategoryHandler({
                name: catName.trim(),
                parent: catParent || null,
                sizeOptions: catSizes.split(',').map((s) => s.trim()).filter(Boolean),
            });
            setCatName(''); setCatParent(''); setCatSizes('');
            await load();
        } catch (err) {
            setCatError(err?.response?.data?.message || 'Failed to add category.');
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await deleteCategoryHandler(id);
            await load();
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to delete category.');
        }
    };

    const handleAddBrand = async (e) => {
        e.preventDefault();
        setBrandError('');
        if (!brandName.trim()) return setBrandError('Name is required.');
        try {
            await createBrandHandler({ name: brandName.trim() });
            setBrandName('');
            await load();
        } catch (err) {
            setBrandError(err?.response?.data?.message || 'Failed to add brand.');
        }
    };

    const handleDeleteBrand = async (id) => {
        try {
            await deleteBrandHandler(id);
            await load();
        } catch (err) {
            alert(err?.response?.data?.message || 'Failed to delete brand.');
        }
    };

    const inputCls = "w-full bg-white border border-[#F3D9CB] rounded-sm px-4 py-2.5 text-[13px] text-[#5A1A2B] placeholder-[#C9B5A8] focus:outline-none focus:border-[#F37966] transition-colors";

    return (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-8">
                <h1 className="font-baloo text-[clamp(30px,4vw,44px)] font-light text-[#5A1A2B] leading-[1.1]">Categories & Brands</h1>
                <p className="font-poppins text-[13px] font-light text-[#6B7280] mt-2">Organize your catalogue. Categories drive the weight options on products.</p>
            </div>

            {loading ? (
                <div className="h-40 bg-white border border-[#F3D9CB] rounded-sm animate-pulse" />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Categories */}
                    <div className="space-y-6">
                        <form onSubmit={handleAddCategory} className="bg-white border border-[#F3D9CB] rounded-sm p-6 space-y-4">
                            <h2 className="font-baloo text-xl font-light text-[#5A1A2B]">Add Category</h2>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Name</label>
                                <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Cupcakes" className={inputCls} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Parent (optional — makes a subcategory)</label>
                                <select value={catParent} onChange={(e) => setCatParent(e.target.value)} className={`${inputCls} cursor-pointer`}>
                                    <option value="">— Top level —</option>
                                    {topLevel.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Sizes (comma-separated)</label>
                                <input value={catSizes} onChange={(e) => setCatSizes(e.target.value)} placeholder="S, M, L, XL" className={inputCls} />
                            </div>
                            {catError && <p className="text-[12px] text-[#c0392b]">{catError}</p>}
                            <button type="submit" className="w-full py-3 bg-[#5A1A2B] text-[#F9E0D6] rounded-sm text-[11px] uppercase tracking-[0.18em] font-medium hover:bg-[#43121F] transition-colors">
                                Add Category
                            </button>
                        </form>

                        <div className="space-y-2">
                            {topLevel.map((c) => (
                                <div key={c._id} className="bg-white border border-[#F3D9CB] rounded-sm p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-poppins font-medium text-[14px] text-[#5A1A2B]">{c.name}</span>
                                            {c.sizeOptions?.length > 0 && (
                                                <span className="text-[11px] text-[#6B7280] ml-2">({c.sizeOptions.join(', ')})</span>
                                            )}
                                        </div>
                                        <button onClick={() => handleDeleteCategory(c._id)} className="text-[10px] uppercase tracking-[0.1em] text-[#c0392b] hover:underline">Delete</button>
                                    </div>
                                    {subsOf(c._id).length > 0 && (
                                        <div className="mt-2 pl-4 border-l border-[#F9E0D6] space-y-1">
                                            {subsOf(c._id).map((s) => (
                                                <div key={s._id} className="flex items-center justify-between">
                                                    <span className="text-[12px] text-[#6B7280]">↳ {s.name}</span>
                                                    <button onClick={() => handleDeleteCategory(s._id)} className="text-[10px] uppercase tracking-[0.1em] text-[#c0392b] hover:underline">Delete</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Brands */}
                    <div className="space-y-6">
                        <form onSubmit={handleAddBrand} className="bg-white border border-[#F3D9CB] rounded-sm p-6 space-y-4">
                            <h2 className="font-baloo text-xl font-light text-[#5A1A2B]">Add Brand</h2>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Name</label>
                                <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="e.g. Cakeology" className={inputCls} />
                            </div>
                            {brandError && <p className="text-[12px] text-[#c0392b]">{brandError}</p>}
                            <button type="submit" className="w-full py-3 bg-[#5A1A2B] text-[#F9E0D6] rounded-sm text-[11px] uppercase tracking-[0.18em] font-medium hover:bg-[#43121F] transition-colors">
                                Add Brand
                            </button>
                        </form>

                        <div className="space-y-2">
                            {brands.length === 0 ? (
                                <div className="bg-white border border-[#F3D9CB] rounded-sm p-6 text-center text-[13px] text-[#6B7280]">
                                    No brands yet.
                                </div>
                            ) : brands.map((b) => (
                                <div key={b._id} className="bg-white border border-[#F3D9CB] rounded-sm p-4 flex items-center justify-between">
                                    <span className="font-poppins font-medium text-[14px] text-[#5A1A2B]">{b.name}</span>
                                    <button onClick={() => handleDeleteBrand(b._id)} className="text-[10px] uppercase tracking-[0.1em] text-[#c0392b] hover:underline">Delete</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerCatalog;
