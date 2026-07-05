import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useCustomCake from '../Hook/useCustomCake';
import { COLORS } from '../../Products/constants/catalog';

const WEIGHTS = ['0.5 Kg', '1 Kg', '1.5 Kg', '2 Kg', '3 Kg', '5 Kg'];

const RequestCustomCake = () => {
    const navigate = useNavigate();
    const User = useSelector((state) => state.auth.User);
    const { createCustomRequestHandler } = useCustomCake();

    const [design, setDesign] = useState(null);
    const [preview, setPreview] = useState('');
    const [form, setForm] = useState({ title: '', description: '', flavor: '', weight: '', requiredDate: '', budget: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { setError('Design image must be under 5MB'); return; }
        setDesign(file);
        setPreview(URL.createObjectURL(file));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!User) { navigate('/login'); return; }
        if (!design) { setError('Please upload a design image'); return; }
        if (!form.requiredDate) { setError('Please choose the date you need the cake'); return; }

        setSubmitting(true);
        try {
            await createCustomRequestHandler({ design, ...form });
            navigate('/myCustomCakes');
        } catch (err) {
            setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9E0D6] font-poppins antialiased py-12 px-6">
            <div className="max-w-2xl mx-auto">
                <header className="mb-8">
                    <span className="text-[11px] uppercase tracking-[0.3em] text-[#F37966] font-medium block mb-2">Bespoke</span>
                    <h1 className="font-baloo text-4xl font-light text-[#5A1A2B]">Design Your Own Cake</h1>
                    <p className="text-[#6B7280] text-[14px] mt-2 font-light">
                        Upload your design and tell us what you need. A baker will review it and send you a price to confirm.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="bg-white border border-[#F3D9CB] rounded-sm p-8 space-y-6">
                    {/* Design upload */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F37966]">Design / Reference Photo *</label>
                        <label className="flex items-center justify-center gap-3 w-full py-6 border-2 border-dashed border-[#D05D4E] rounded-sm cursor-pointer hover:bg-[#F9E0D6] transition-colors">
                            <svg className="w-5 h-5 text-[#F37966]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5V18a2 2 0 002 2h14a2 2 0 002-2v-1.5M16 8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span className="text-[11px] uppercase tracking-[0.15em] text-[#F37966] font-semibold">
                                {design ? 'Change Design' : 'Upload Design'}
                            </span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                        </label>
                        {preview && (
                            <div className="flex items-center gap-4 p-3 bg-[#F9E0D6] rounded-sm">
                                <img src={preview} alt="preview" className="w-20 h-20 object-cover rounded-sm" />
                                <span className="text-[12px] text-[#5A1A2B] flex-1 truncate">{design?.name}</span>
                                <button type="button" onClick={() => { setDesign(null); setPreview(''); }} className="text-[11px] uppercase tracking-wider text-red-600 font-semibold hover:underline">Remove</button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F37966]">Title</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="e.g. Two-tier unicorn birthday cake"
                            className="w-full bg-white border border-[#F3D9CB] rounded-sm px-4 py-3 text-[14px] focus:outline-none focus:border-[#F37966]"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F37966]">Flavour</label>
                            <select
                                value={form.flavor}
                                onChange={(e) => setForm({ ...form, flavor: e.target.value })}
                                className="w-full bg-white border border-[#F3D9CB] rounded-sm px-4 py-3 text-[14px] focus:outline-none focus:border-[#F37966]"
                            >
                                <option value="">Select a flavour</option>
                                {COLORS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F37966]">Weight</label>
                            <select
                                value={form.weight}
                                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                                className="w-full bg-white border border-[#F3D9CB] rounded-sm px-4 py-3 text-[14px] focus:outline-none focus:border-[#F37966]"
                            >
                                <option value="">Select a weight</option>
                                {WEIGHTS.map((w) => <option key={w} value={w}>{w}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F37966]">Date Needed *</label>
                            <input
                                type="date"
                                value={form.requiredDate}
                                min={today}
                                onChange={(e) => setForm({ ...form, requiredDate: e.target.value })}
                                className="w-full bg-white border border-[#F3D9CB] rounded-sm px-4 py-3 text-[14px] focus:outline-none focus:border-[#F37966]"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F37966]">Budget (₹, optional)</label>
                            <input
                                type="number"
                                value={form.budget}
                                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                                placeholder="e.g. 1500"
                                className="w-full bg-white border border-[#F3D9CB] rounded-sm px-4 py-3 text-[14px] focus:outline-none focus:border-[#F37966]"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F37966]">Details</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={4}
                            maxLength={1000}
                            placeholder="Message on the cake, colour theme, allergies, number of servings, any special requests..."
                            className="w-full bg-white border border-[#F3D9CB] rounded-sm px-4 py-3 text-[14px] focus:outline-none focus:border-[#F37966] resize-none"
                        />
                    </div>

                    {error && <p className="text-[13px] text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-4 bg-[#5A1A2B] text-[#FFF6F0] font-medium uppercase tracking-[0.2em] text-[12px] rounded-sm hover:bg-[#43121F] transition-colors disabled:opacity-50"
                    >
                        {submitting ? 'Submitting…' : 'Submit Request'}
                    </button>
                    <p className="text-[11px] text-[#6B7280] text-center">No payment now — you only pay once a baker accepts and quotes a price.</p>
                </form>
            </div>
        </div>
    );
};

export default RequestCustomCake;
