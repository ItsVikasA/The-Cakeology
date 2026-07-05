import React, { useEffect, useState } from 'react';
import useCoupon from '../Hook/useCoupon';

const emptyForm = {
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxDiscount: '',
    minOrderAmount: '',
    usageLimit: '',
    expiresAt: '',
};

const SellerCoupons = () => {
    const { getSellerCouponsHandler, createCouponHandler, toggleCouponHandler, deleteCouponHandler } = useCoupon();

    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = async () => {
        try {
            const list = await getSellerCouponsHandler();
            setCoupons(list || []);
        } catch (e) {
            console.error('Failed to load coupons:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.code.trim() || form.discountValue === '' || !form.expiresAt) {
            setError('Code, discount value and expiry are required.');
            return;
        }
        setSubmitting(true);
        try {
            await createCouponHandler({
                code: form.code,
                discountType: form.discountType,
                discountValue: Number(form.discountValue),
                maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
                minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
                usageLimit: form.usageLimit ? Number(form.usageLimit) : 0,
                expiresAt: form.expiresAt,
            });
            setForm(emptyForm);
            await load();
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to create coupon.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async (id) => {
        await toggleCouponHandler(id);
        await load();
    };

    const handleDelete = async (id) => {
        await deleteCouponHandler(id);
        await load();
    };

    const inputCls = "w-full bg-white border border-[#F3D9CB] rounded-sm px-4 py-2.5 text-[13px] text-[#5A1A2B] placeholder-[#C9B5A8] focus:outline-none focus:border-[#F37966] transition-colors";

    return (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
            <div className="mb-8">
                <h1 className="font-baloo text-[clamp(30px,4vw,44px)] font-light text-[#5A1A2B] leading-[1.1]">Coupons</h1>
                <p className="font-poppins text-[13px] font-light text-[#6B7280] mt-2">Create and manage discount codes for your store.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create form */}
                <form onSubmit={handleSubmit} className="lg:col-span-1 bg-white border border-[#F3D9CB] rounded-sm p-6 space-y-4 h-fit">
                    <h2 className="font-baloo text-xl font-light text-[#5A1A2B]">New Coupon</h2>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Code</label>
                        <input name="code" value={form.code} onChange={handleChange} placeholder="e.g. WELCOME10" className={`${inputCls} uppercase`} />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Discount Type</label>
                        <select name="discountType" value={form.discountType} onChange={handleChange} className={`${inputCls} cursor-pointer`}>
                            <option value="percentage">Percentage (%)</option>
                            <option value="flat">Flat (₹)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Value</label>
                            <input type="number" name="discountValue" value={form.discountValue} onChange={handleChange} placeholder={form.discountType === 'percentage' ? '10' : '100'} className={inputCls} />
                        </div>
                        {form.discountType === 'percentage' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Max ₹ (opt)</label>
                                <input type="number" name="maxDiscount" value={form.maxDiscount} onChange={handleChange} placeholder="500" className={inputCls} />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Min Order ₹</label>
                            <input type="number" name="minOrderAmount" value={form.minOrderAmount} onChange={handleChange} placeholder="0" className={inputCls} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Usage Limit</label>
                            <input type="number" name="usageLimit" value={form.usageLimit} onChange={handleChange} placeholder="0 = ∞" className={inputCls} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">Expires On</label>
                        <input type="date" name="expiresAt" value={form.expiresAt} onChange={handleChange} className={inputCls} />
                    </div>

                    {error && <p className="text-[12px] text-[#c0392b]">{error}</p>}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-[#5A1A2B] text-[#F9E0D6] rounded-sm text-[11px] uppercase tracking-[0.18em] font-medium hover:bg-[#43121F] transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Creating…' : 'Create Coupon'}
                    </button>
                </form>

                {/* List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="h-20 bg-white border border-[#F3D9CB] rounded-sm animate-pulse" />
                            ))}
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="bg-white border border-[#F3D9CB] rounded-sm p-10 text-center">
                            <p className="font-baloo text-xl text-[#5A1A2B] mb-1">No coupons yet</p>
                            <p className="text-[13px] text-[#6B7280]">Create your first discount code using the form.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {coupons.map((c) => {
                                const expired = new Date(c.expiresAt) < new Date();
                                return (
                                    <div key={c._id} className="bg-white border border-[#F3D9CB] rounded-sm p-5 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="font-poppins font-semibold text-[15px] text-[#5A1A2B] tracking-wide">{c.code}</span>
                                                <span className="px-2 py-0.5 rounded-full bg-[#F9E0D6] text-[10px] uppercase tracking-wider text-[#F37966] font-medium">
                                                    {c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                                                </span>
                                                {!c.isActive && <span className="px-2 py-0.5 rounded-full bg-[#F9E0D6] text-[10px] uppercase tracking-wider text-[#6B7280]">Inactive</span>}
                                                {expired && <span className="px-2 py-0.5 rounded-full bg-[#fce8e8] text-[10px] uppercase tracking-wider text-[#c0392b]">Expired</span>}
                                            </div>
                                            <p className="text-[12px] text-[#6B7280] mt-1">
                                                {c.minOrderAmount > 0 && `Min ₹${c.minOrderAmount} · `}
                                                {c.usageLimit > 0 ? `${c.usedCount}/${c.usageLimit} used` : `${c.usedCount} used`}
                                                {' · '}Expires {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleToggle(c._id)}
                                                className="px-3 py-1.5 border border-[#F3D9CB] text-[#5A1A2B] rounded-sm text-[10px] uppercase tracking-[0.1em] hover:bg-[#F9E0D6] transition-colors"
                                            >
                                                {c.isActive ? 'Disable' : 'Enable'}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(c._id)}
                                                className="px-3 py-1.5 border border-[#F3D9CB] text-[#c0392b] rounded-sm text-[10px] uppercase tracking-[0.1em] hover:bg-[#fce8e8] transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerCoupons;
