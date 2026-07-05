import React, { useEffect, useRef, useState } from 'react';
import useBanner from '../Hook/useBanner';

const AdminBanners = () => {
    const { getAllBannersHandler, createBannerHandler, toggleBannerHandler, deleteBannerHandler } = useBanner();

    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [link, setLink] = useState('');
    const [order, setOrder] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const fileRef = useRef(null);

    const load = async () => {
        try {
            const list = await getAllBannersHandler();
            setBanners(list || []);
        } catch (e) {
            console.error('Failed to load banners:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const onPickImage = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const resetForm = () => {
        setTitle(''); setSubtitle(''); setLink(''); setOrder('');
        setImageFile(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!imageFile) { setError('A banner image is required.'); return; }
        setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('title', title);
            fd.append('subtitle', subtitle);
            fd.append('link', link);
            fd.append('order', order || 0);
            fd.append('image', imageFile);
            await createBannerHandler(fd);
            resetForm();
            await load();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to create banner.');
        } finally {
            setSubmitting(false);
        }
    };

    const inputCls = "w-full bg-white border border-[#F3D9CB] rounded-sm px-4 py-2.5 text-[13px] text-[#5A1A2B] placeholder-[#C9B5A8] focus:outline-none focus:border-[#F37966] transition-colors";

    return (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-8">
                <h1 className="font-baloo text-[clamp(30px,4vw,44px)] font-light text-[#5A1A2B] leading-[1.1]">Banner Management</h1>
                <p className="font-poppins text-[13px] font-light text-[#6B7280] mt-2">Homepage hero banners shown to all shoppers.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create form */}
                <form onSubmit={handleSubmit} className="lg:col-span-1 bg-white border border-[#F3D9CB] rounded-sm p-6 space-y-4 h-fit">
                    <h2 className="font-baloo text-xl font-light text-[#5A1A2B]">New Banner</h2>

                    <div
                        onClick={() => fileRef.current?.click()}
                        className="aspect-[16/7] border border-dashed border-[#F3D9CB] rounded-sm bg-[#F9E0D6] flex items-center justify-center cursor-pointer overflow-hidden"
                    >
                        {preview ? (
                            <img src={preview} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[12px] text-[#6B7280]">Click to upload image</span>
                        )}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} className="hidden" />

                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" className={inputCls} />
                    <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle (optional)" className={inputCls} />
                    <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link e.g. /product/123 (optional)" className={inputCls} />
                    <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="Display order (0 = first)" className={inputCls} />

                    {error && <p className="text-[12px] text-[#c0392b]">{error}</p>}

                    <button type="submit" disabled={submitting} className="w-full py-3 bg-[#5A1A2B] text-[#F9E0D6] rounded-sm text-[11px] uppercase tracking-[0.18em] font-medium hover:bg-[#43121F] transition-colors disabled:opacity-50">
                        {submitting ? 'Uploading…' : 'Add Banner'}
                    </button>
                </form>

                {/* List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 bg-white border border-[#F3D9CB] rounded-sm animate-pulse" />)}
                        </div>
                    ) : banners.length === 0 ? (
                        <div className="bg-white border border-[#F3D9CB] rounded-sm p-10 text-center">
                            <p className="font-baloo text-xl text-[#5A1A2B] mb-1">No banners yet</p>
                            <p className="text-[13px] text-[#6B7280]">Upload your first homepage banner.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {banners.map((b) => (
                                <div key={b._id} className="bg-white border border-[#F3D9CB] rounded-sm overflow-hidden">
                                    <div className="aspect-[16/6] bg-[#F9E0D6] relative">
                                        <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                                        {!b.isActive && (
                                            <div className="absolute inset-0 bg-[#5A1A2B]/50 flex items-center justify-center">
                                                <span className="text-white text-[11px] uppercase tracking-[0.15em]">Inactive</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="font-poppins text-[14px] text-[#5A1A2B] font-medium truncate">{b.title || 'Untitled banner'}</p>
                                            <p className="text-[12px] text-[#6B7280] truncate">{b.subtitle || (b.link ? `→ ${b.link}` : 'No subtitle')} · order {b.order}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button onClick={async () => { await toggleBannerHandler(b._id); load(); }} className="px-3 py-1.5 border border-[#F3D9CB] text-[#5A1A2B] rounded-sm text-[10px] uppercase tracking-[0.1em] hover:bg-[#F9E0D6]">
                                                {b.isActive ? 'Disable' : 'Enable'}
                                            </button>
                                            <button onClick={async () => { await deleteBannerHandler(b._id); load(); }} className="px-3 py-1.5 border border-[#F3D9CB] text-[#c0392b] rounded-sm text-[10px] uppercase tracking-[0.1em] hover:bg-[#fce8e8]">
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminBanners;
