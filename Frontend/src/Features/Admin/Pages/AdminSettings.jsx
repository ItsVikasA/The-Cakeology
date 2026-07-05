import React, { useEffect, useState } from 'react';
import useSettings from '../Hook/useSettings';

const TABS = ['General', 'Shipping', 'Tax / GST', 'Payment', 'Checkout', 'Email'];

const Field = ({ label, children, hint }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-[0.14em] text-[#F37966] font-medium">{label}</label>
        {children}
        {hint && <p className="text-[11px] text-[#6B7280]">{hint}</p>}
    </div>
);

const AdminSettings = () => {
    const { getSettingsHandler, updateSettingsHandler } = useSettings();
    const [s, setS] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('General');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        getSettingsHandler().then(setS).catch(console.error).finally(() => setLoading(false));
    }, []);

    const set = (group, key, value) => setS((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));

    const save = async () => {
        setSaving(true); setSaved(false);
        try {
            const updated = await updateSettingsHandler({
                general: s.general, shipping: s.shipping, tax: s.tax, payment: s.payment, email: s.email,
            });
            setS(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (e) {
            console.error('Failed to save settings:', e);
        } finally {
            setSaving(false);
        }
    };

    const inputCls = "w-full bg-white border border-[#F3D9CB] rounded-sm px-4 py-2.5 text-[13px] text-[#5A1A2B] placeholder-[#C9B5A8] focus:outline-none focus:border-[#F37966] transition-colors";

    if (loading || !s) {
        return <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10"><div className="h-64 bg-white border border-[#F3D9CB] rounded-sm animate-pulse" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10">
            <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="font-baloo text-[clamp(30px,4vw,44px)] font-light text-[#5A1A2B] leading-[1.1]">Settings</h1>
                    <p className="font-poppins text-[13px] font-light text-[#6B7280] mt-2">Store-wide configuration.</p>
                </div>
                <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-[#5A1A2B] text-[#F9E0D6] rounded-sm text-[11px] uppercase tracking-[0.18em] font-medium hover:bg-[#43121F] transition-colors disabled:opacity-50">
                    {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
                </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {TABS.map((t) => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-full font-poppins text-[11px] uppercase tracking-[0.12em] transition-all
                            ${tab === t ? 'bg-[#5A1A2B] text-white' : 'bg-white border border-[#F3D9CB] text-[#6B7280] hover:border-[#F37966] hover:text-[#5A1A2B]'}`}>
                        {t}
                    </button>
                ))}
            </div>

            <div className="bg-white border border-[#F3D9CB] rounded-sm p-6 space-y-5">
                {tab === 'General' && (
                    <>
                        <Field label="Store Name"><input className={inputCls} value={s.general.storeName} onChange={(e) => set('general', 'storeName', e.target.value)} /></Field>
                        <Field label="Support Email"><input className={inputCls} value={s.general.supportEmail} onChange={(e) => set('general', 'supportEmail', e.target.value)} placeholder="support@store.com" /></Field>
                        <Field label="Currency"><input className={inputCls} value={s.general.currency} onChange={(e) => set('general', 'currency', e.target.value)} /></Field>
                        <div className="pt-2 border-t border-[#F9E0D6]">
                            <label className="flex items-center gap-2.5 text-[13px] text-[#5A1A2B]">
                                <input type="checkbox" checked={!!s.general.maintenanceMode} onChange={(e) => set('general', 'maintenanceMode', e.target.checked)} className="w-4 h-4 accent-[#b91c1c]" />
                                Maintenance mode — show the maintenance page to all non-admin visitors
                            </label>
                            <p className="text-[11px] text-[#6B7280] mt-1.5 ml-[26px]">When on, only admins can browse the site. Everyone else sees the maintenance page. You can still reach <span className="font-medium">/login</span> and the admin panel to turn this back off.</p>
                        </div>
                    </>
                )}

                {tab === 'Shipping' && (
                    <>
                        <Field label="Shipping Charge (₹)" hint="Flat fee added when the order doesn't qualify for free shipping.">
                            <input type="number" className={inputCls} value={s.shipping.shippingCharge} onChange={(e) => set('shipping', 'shippingCharge', Number(e.target.value))} />
                        </Field>
                        <Field label="Free Shipping Threshold (₹)" hint="Orders at or above this subtotal ship free. 0 = always charge.">
                            <input type="number" className={inputCls} value={s.shipping.freeShippingThreshold} onChange={(e) => set('shipping', 'freeShippingThreshold', Number(e.target.value))} />
                        </Field>
                    </>
                )}

                {tab === 'Tax / GST' && (
                    <>
                        <Field label="GST (%)" hint="Applied to the cart subtotal at checkout.">
                            <input type="number" className={inputCls} value={s.tax.gstPercent} onChange={(e) => set('tax', 'gstPercent', Number(e.target.value))} />
                        </Field>
                        <label className="flex items-center gap-2.5 text-[13px] text-[#5A1A2B]">
                            <input type="checkbox" checked={s.tax.taxInclusive} onChange={(e) => set('tax', 'taxInclusive', e.target.checked)} className="w-4 h-4 accent-[#5A1A2B]" />
                            Prices already include tax (don't add a separate line)
                        </label>
                    </>
                )}

                {tab === 'Payment' && (
                    <>
                        <Field label="Active Checkout Method" hint="Which link the customer gets after checkout. Switch anytime — Razorpay stays fully working when selected.">
                            <div className="flex gap-2">
                                {[
                                    { value: 'whatsapp', label: 'WhatsApp' },
                                    { value: 'razorpay', label: 'Razorpay' },
                                ].map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => set('payment', 'activeMethod', opt.value)}
                                        className={`flex-1 py-2.5 rounded-sm text-[12px] uppercase tracking-[0.14em] font-medium transition-colors border
                                            ${(s.payment.activeMethod || 'whatsapp') === opt.value
                                                ? 'bg-[#5A1A2B] text-[#F9E0D6] border-[#5A1A2B]'
                                                : 'bg-white text-[#6B7280] border-[#F3D9CB] hover:border-[#F37966] hover:text-[#5A1A2B]'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </Field>
                        <Field label="WhatsApp Number" hint="Country code + number, digits only (no +, spaces or dashes). Used for the wa.me checkout link.">
                            <input className={inputCls} value={s.payment.whatsappNumber || ''} onChange={(e) => set('payment', 'whatsappNumber', e.target.value)} placeholder="919900082208" />
                        </Field>
                        <Field label="Razorpay Key ID" hint="Public key id only. The secret is configured securely on the server.">
                            <input className={inputCls} value={s.payment.razorpayKeyId} onChange={(e) => set('payment', 'razorpayKeyId', e.target.value)} placeholder="rzp_test_..." />
                        </Field>
                    </>
                )}

                {tab === 'Checkout' && (
                    <>
                        <Field label="Checkout Mode" hint="How buyers identify themselves at checkout.">
                            <div className="flex gap-2">
                                {[
                                    { value: 'guest', label: 'Guest', sub: 'Name / address / phone', disabled: false },
                                    { value: 'google', label: 'Google OAuth', sub: 'Coming soon', disabled: true },
                                ].map((opt) => {
                                    const active = (s.checkout?.mode || 'guest') === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            disabled={opt.disabled}
                                            onClick={() => !opt.disabled && set('checkout', 'mode', opt.value)}
                                            title={opt.disabled ? 'Not available yet' : ''}
                                            className={`flex-1 py-3 rounded-sm border flex flex-col items-center gap-1 transition-colors
                                                ${active
                                                    ? 'bg-[#5A1A2B] text-[#F9E0D6] border-[#5A1A2B]'
                                                    : 'bg-white text-[#6B7280] border-[#F3D9CB] hover:border-[#F37966] hover:text-[#5A1A2B]'}
                                                ${opt.disabled ? 'opacity-50 cursor-not-allowed hover:border-[#F3D9CB] hover:text-[#6B7280]' : ''}`}
                                        >
                                            <span className="text-[12px] uppercase tracking-[0.14em] font-medium">{opt.label}</span>
                                            <span className="text-[10px] tracking-[0.08em] opacity-80">{opt.sub}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </Field>
                        <p className="text-[11px] text-[#6B7280]">
                            <span className="font-medium">Guest</span> lets customers place an order with just their name, address and phone — login is optional. Google OAuth sign-in is planned and not active yet.
                        </p>
                    </>
                )}

                {tab === 'Email' && (
                    <>
                        <Field label="Sender Name"><input className={inputCls} value={s.email.senderName} onChange={(e) => set('email', 'senderName', e.target.value)} /></Field>
                        <Field label="From Email" hint="Display address shown on outgoing emails.">
                            <input className={inputCls} value={s.email.fromEmail} onChange={(e) => set('email', 'fromEmail', e.target.value)} placeholder="no-reply@store.com" />
                        </Field>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminSettings;
