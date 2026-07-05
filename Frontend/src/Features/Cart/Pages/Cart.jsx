
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useCart from '../Hook/useCart';
import { useRazorpay, RazorpayOrderOptions } from "react-razorpay";
import useOrder from '../../Orders/Hooks/useOrder';
import useCoupon from '../../Coupons/Hook/useCoupon';
import useSettings from '../../Admin/Hook/useSettings';
import useAuth from '../../Authentication/Hook/useAuth';
import { guestOrderItems, clearGuestCart } from '../Service/guestCart';

const Cart = () => {
    const { getCartItemsHandler, addItemQuantityHandler, subItemQuantityHandler, removeItemHandler, createOrderPaymentHandler, verifyPaymentHandler } = useCart();
    const { createOrderHandler, createGuestOrderHandler } = useOrder();
    const { validateCouponHandler } = useCoupon();
    const { getPublicSettingsHandler } = useSettings();
    const { getAddressesHandler, addAddressHandler, deleteAddressHandler } = useAuth();
    const User = useSelector((state) => state.auth.User);
    const cartItems = useSelector((state) => state.cart.cartItems);
    const total = useSelector((state) => state.cart.total);
    const subtotal = useSelector((state) => state.cart.subtotal);
    const currency = useSelector((state) => state.cart.currency);
    const [loading, setLoading] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');
    const [guestOrderPlaced, setGuestOrderPlaced] = useState(null); // holds the placed guest order

    // Saved addresses
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [addingNew, setAddingNew] = useState(false);

    const [address, setAddress] = useState({
        fullName: '',
        email: '',
        phone: '',
        line1: '',
        line2: '',
        city: 'Bagalkot',
        state: 'Karnataka',
    });
    const [addressErrors, setAddressErrors] = useState({});

    // Delivery date — when the buyer needs the cake.
    const [deliveryDate, setDeliveryDate] = useState('');
    const [deliveryDateError, setDeliveryDateError] = useState('');

    // Coupon state
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount }
    const [couponError, setCouponError] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    const [settings, setSettings] = useState(null);

    const navigate = useNavigate();

    const discount = appliedCoupon?.discount || 0;
    const afterDiscount = Math.max(0, (subtotal || 0) - discount);

    // Shipping: free above threshold (if set), otherwise flat charge.
    const freeThreshold = settings?.shipping?.freeShippingThreshold || 0;
    const shippingCharge = settings?.shipping?.shippingCharge || 0;
    const shipping = (subtotal > 0 && !(freeThreshold > 0 && subtotal >= freeThreshold)) ? shippingCharge : 0;

    // GST on the discounted subtotal (unless prices are tax-inclusive).
    const gstPercent = settings?.tax?.gstPercent || 0;
    const tax = (!settings?.tax?.taxInclusive && gstPercent > 0) ? Math.round(afterDiscount * gstPercent / 100) : 0;

    const payableTotal = afterDiscount + shipping + tax;

    useEffect(() => {
        getPublicSettingsHandler().then(setSettings).catch(() => {});
    }, []);

    // Re-validate the coupon if the cart total changes (e.g. quantity edits).
    useEffect(() => {
        if (appliedCoupon && subtotal != null) {
            (async () => {
                try {
                    const res = await validateCouponHandler(appliedCoupon.code, subtotal);
                    setAppliedCoupon({ code: res.code, discount: res.discount });
                } catch {
                    setAppliedCoupon(null);
                    setCouponError('Coupon no longer valid for this cart.');
                }
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subtotal]);

    const applyCoupon = async () => {
        if (!couponInput.trim()) return;
        setCouponError('');
        setApplyingCoupon(true);
        try {
            const res = await validateCouponHandler(couponInput.trim(), subtotal);
            setAppliedCoupon({ code: res.code, discount: res.discount });
        } catch (err) {
            setAppliedCoupon(null);
            setCouponError(err?.response?.data?.message || 'Invalid coupon code.');
        } finally {
            setApplyingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput('');
        setCouponError('');
    };

    // Fetch cart items on mount
    useEffect(() => {
        const fetchCartItems = async () => { await getCartItemsHandler(); }
        fetchCartItems();
    }, []);

    // Load saved addresses; default-select the first if any.
    const loadAddresses = async () => {
        try {
            const list = await getAddressesHandler();
            setSavedAddresses(list || []);
            if (list && list.length > 0) {
                setSelectedAddressId((prev) => prev || list[0]._id);
                setAddingNew(false);
            } else {
                setAddingNew(true);
            }
            return list || [];
        } catch {
            setAddingNew(true);
            return [];
        }
    };

    useEffect(() => {
        if (User) loadAddresses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [User]);

    // Prefill name/phone from the logged-in user once available.
    useEffect(() => {
        if (User) {
            setAddress((prev) => ({
                ...prev,
                fullName: prev.fullName || User.fullname || '',
                email: prev.email || User.email || '',
                phone: prev.phone || User.contact || '',
            }));
        }
    }, [User]);


    const { error, isLoading, Razorpay } = useRazorpay();

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setAddress((prev) => ({ ...prev, [name]: value }));
        if (addressErrors[name]) setAddressErrors((prev) => ({ ...prev, [name]: '' }));
    };

    const validateAddress = () => {
        const errs = {};
        if (!address.fullName.trim()) errs.fullName = 'Full name is required';
        // Guests are reached only by email — require a valid one from them.
        if (!User && !/^\S+@\S+\.\S+$/.test((address.email || '').trim())) errs.email = 'Enter a valid email';
        if (!/^[0-9]{10}$/.test(address.phone.trim())) errs.phone = 'Enter a valid 10-digit phone';
        if (!address.line1.trim()) errs.line1 = 'Address is required';
        if (!address.city.trim()) errs.city = 'City is required';
        if (!address.state.trim()) errs.state = 'State is required';
        setAddressErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const stripAddress = (a) => ({
        fullName: a.fullName, phone: a.phone, line1: a.line1,
        line2: a.line2 || '', city: a.city, state: a.state,
    });

    // Proceed using the selected saved address.
    const handleUseSelected = () => {
        const sel = savedAddresses.find((a) => a._id === selectedAddressId);
        if (!sel) return;
        setShowAddressForm(false);
        handlePayment(stripAddress(sel));
    };

    // Save the typed address to the account, then proceed with it.
    const handleSaveNewAddress = async () => {
        if (!validateAddress()) return;
        // Guests have no account to save the address to — just proceed with it.
        if (!User) {
            setShowAddressForm(false);
            handlePayment(stripAddress(address));
            return;
        }
        try {
            const list = await addAddressHandler({ ...address });
            setSavedAddresses(list);
            const newAddr = list[list.length - 1];
            setSelectedAddressId(newAddr._id);
            setAddingNew(false);
            setShowAddressForm(false);
            setAddress({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
            handlePayment(stripAddress(newAddr));
        } catch (e) {
            console.error('Failed to save address:', e);
        }
    };

    const handleDeleteAddress = async (id) => {
        try {
            const list = await deleteAddressHandler(id);
            setSavedAddresses(list);
            if (selectedAddressId === id) setSelectedAddressId(list[0]?._id || null);
            if (!list || list.length === 0) setAddingNew(true);
        } catch (e) {
            console.error('Failed to delete address:', e);
        }
    };

    // Build the WhatsApp order message from the (still-populated) cart items,
    // the created order id, and the delivery address.
    const buildWhatsappMessage = (order, addr) => {
        const shortId = order?._id ? order._id.toString().slice(-8).toUpperCase() : '';
        const cur = currency === 'INR' ? '₹' : `${currency} `;

        const lines = (cartItems?.items || []).map((item) => {
            const variant = item.productId.variants;
            const price = variant?.price || item.price;
            const attributes = variant?.attribute || {};
            const variantLabel = Object.values(attributes).join(', ');
            const lineTotal = (price?.amount || 0) * (item.quantity || 1);
            return `${item.productId.title}${variantLabel ? ` (${variantLabel})` : ''} x${item.quantity} — ${cur}${lineTotal}`;
        });

        const parts = [
            `New Order — #${shortId}`,
            '',
            ...lines,
            '',
            `Subtotal: ${cur}${subtotal}`,
        ];
        if (discount > 0) parts.push(`Discount: -${cur}${discount}${appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}`);
        if (shipping > 0) parts.push(`Shipping: ${cur}${shipping}`);
        if (tax > 0) parts.push(`GST (${gstPercent}%): ${cur}${tax}`);
        parts.push(`Total: ${cur}${payableTotal}`);
        if (deliveryDate) parts.push('', `Delivery date: ${deliveryDate}`);
        parts.push(
            '',
            'Deliver to:',
            addr.fullName,
            `${addr.line1}${addr.line2 ? `, ${addr.line2}` : ''}`,
            `${addr.city}, ${addr.state}`,
            addr.phone,
            '',
            'Please confirm payment to complete this order.'
        );

        return parts.join('\n');
    };

    // WhatsApp checkout: run the same order-creation pipeline as Razorpay
    // (server-side price/coupon/stock validation), then hand off to WhatsApp.
    const handleWhatsappCheckout = async (addr) => {
        const cartId = cartItems?._id;
        if (!cartId) {
            setCheckoutError('Your cart is empty. Please add items before checking out.');
            setShowAddressForm(true);
            return;
        }

        let res;
        try {
            res = await createOrderHandler(cartId, addr, appliedCoupon?.code || null, deliveryDate);
        } catch (err) {
            // Stock ran out / validation failed — surface it instead of opening WhatsApp.
            setCheckoutError(err?.response?.data?.message || 'Could not place the order. Some items may be out of stock. Please review your cart.');
            setShowAddressForm(true);
            return;
        }

        const message = buildWhatsappMessage(res.order, addr);
        // Normalise the number for wa.me: digits only, and add the India country
        // code if a bare 10-digit number was configured (wa.me needs full intl format).
        let number = (settings?.whatsappNumber || '919900082208').replace(/\D/g, '');
        if (number.length === 10) number = `91${number}`;
        const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

        // Open WhatsApp in a new tab and send the buyer to their orders page.
        window.open(url, '_blank');
        navigate('/myOrders');
    };

    // Guest checkout (no account): post the client-side cart + address to the
    // guest-order endpoint (same server validation), then hand off to WhatsApp.
    const handleGuestCheckout = async (addr) => {
        const items = guestOrderItems();
        if (!items.length) {
            setCheckoutError('Your cart is empty. Please add items before checking out.');
            setShowAddressForm(true);
            return;
        }

        let res;
        try {
            res = await createGuestOrderHandler(items, addr, address.email, appliedCoupon?.code || null, deliveryDate);
        } catch (err) {
            setCheckoutError(err?.response?.data?.message || 'Could not place the order. Some items may be out of stock. Please review your cart.');
            setShowAddressForm(true);
            return;
        }

        const message = buildWhatsappMessage(res.order, addr);
        let number = (settings?.whatsappNumber || '919900082208').replace(/\D/g, '');
        if (number.length === 10) number = `91${number}`;
        const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

        window.open(url, '_blank');
        clearGuestCart();
        await getCartItemsHandler(); // reset the (now empty) cart in state
        setShowAddressForm(false);
        setGuestOrderPlaced(res.order); // show the confirmation screen
    };

    const handlePayment = async (addr) => {

        setCheckoutError('');

        // Require a delivery date before taking payment.
        if (!deliveryDate) {
            setDeliveryDateError('Please choose a delivery date');
            setShowAddressForm(true);
            return;
        }

        // Guests have no account/server cart — always use the guest + WhatsApp path.
        if (!User) {
            await handleGuestCheckout(addr);
            return;
        }

        // Branch on the store's active checkout method (admin-configurable).
        if ((settings?.activeMethod || 'razorpay') === 'whatsapp') {
            await handleWhatsappCheckout(addr);
            return;
        }

        const order = await createOrderPaymentHandler(payableTotal, currency);

        const options = {
            key: settings?.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: payableTotal,
            currency: currency,
            name: "Cakeology",
            description: "Test Transaction",
            order_id: order.id, // Generate order_id on server
            handler: async (response) => {

                const isPaymentVerified = await verifyPaymentHandler({ orderId: order.id, paymentId: response.razorpay_payment_id, paymentSignature: response.razorpay_signature });

                if (isPaymentVerified.success) {
                    await createOrderHandler(isPaymentVerified.cartId, addr, appliedCoupon?.code || null, deliveryDate);
                    navigate('/myOrders');
                }

            },
            prefill: {
                name: addr?.fullName || User?.fullname,
                email: User?.email,
                contact: addr?.phone || User?.contact || "",
            },
            theme: {
                color: "#F37254",
            },
        };

        const razorpayInstance = new Razorpay(options);

        razorpayInstance.on('payment.failed', async (error) => {
            await verifyPaymentHandler({ orderId: order.id, paymentId: error.error.metadata.payment_id, paymentSignature: -1 });
        })

        razorpayInstance.open();



    };



    if (loading) {
        return (
            <div className="min-h-screen bg-[#F9E0D6] flex items-center justify-center font-poppins antialiased">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[#5A1A2B] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#6B7280] text-[13px] uppercase tracking-[0.2em]">Loading Cart...</p>
                </div>
            </div>
        );
    }

    // Guest order confirmation — shown after a successful guest checkout.
    if (guestOrderPlaced) {
        const shortId = guestOrderPlaced._id ? guestOrderPlaced._id.toString().slice(-8).toUpperCase() : '';
        return (
            <div className="min-h-screen bg-[#F9E0D6] font-poppins antialiased flex items-center justify-center px-6">
                <div className="max-w-md w-full text-center bg-white border border-[#F3D9CB] rounded-sm p-10">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#e8f0e8] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#3f7d4f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="font-baloo text-3xl font-light text-[#5A1A2B] mb-2">Order Placed</h1>
                    <p className="text-[13px] text-[#F37966] font-medium mb-4">Order #{shortId}</p>
                    <p className="text-[13px] text-[#6B7280] leading-relaxed mb-8">
                        We've opened WhatsApp with your order details — please send that message so we can
                        confirm your payment. Once we confirm your order, <span className="text-[#5A1A2B] font-medium">you'll receive a
                        confirmation email</span>. If WhatsApp didn't open, message us at
                        <span className="text-[#5A1A2B] font-medium"> +91 99000 82208</span>.
                    </p>
                    <button
                        onClick={() => { setGuestOrderPlaced(null); navigate('/shop'); }}
                        className="w-full py-3.5 bg-[#5A1A2B] text-[#FFF6F0] text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#43121F] transition-colors"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9E0D6] font-poppins antialiased">
            {/* Back Button Navigation */}
            <nav className="max-w-7xl mx-auto px-6 pt-8 pb-2 flex items-center">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-[#5A1A2B] hover:text-[#F37966] text-sm font-medium"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
            </nav>
            {/*  MAIN CONTENT */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="font-baloo text-5xl font-light tracking-widest text-[#5A1A2B] uppercase">
                        Your Cart
                    </h1>
                </div>
                {cartItems?.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-[#6B7280] text-sm tracking-[0.1em] mb-6">YOUR CART IS EMPTY</p>
                        <button
                            onClick={() => navigate('/shop')}
                            className="px-8 py-3 bg-[#5A1A2B] text-[#FFF6F0] text-[11px] uppercase tracking-[0.2em] font-medium transition-all hover:opacity-80"
                        >
                            Continue Shopping
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* ── CART ITEMS ── */}
                        <div className="lg:col-span-2 space-y-6">
                            {cartItems?.items.map((item) => {
                                const variant = item.productId.variants
                                const price = variant?.price || item.price;
                                const image = variant?.images?.[0] || item.images?.[0];
                                const attributes = variant?.attribute || {};

                                return (
                                    <div
                                        key={item._id}
                                        className="flex gap-6 pb-6 border-b border-[#F3D9CB] group"
                                    >
                                        {/* Product Image */}
                                        <div className="w-24 h-32 flex-shrink-0 overflow-hidden rounded-sm bg-[#F3D9CB]">
                                            {image ? (
                                                <img
                                                    src={image}
                                                    alt={item.productId.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[#6B7280]">
                                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-baloo text-lg font-semibold text-[#5A1A2B] mb-3">
                                                    {item.productId.title}
                                                </h3>

                                                {/* Attributes */}
                                                <div className="space-y-2 mb-4">
                                                    {Object.entries(attributes).map(([key, value]) => (
                                                        <p key={key} className="text-[11px] text-[#6B7280] uppercase tracking-[0.1em]">
                                                            <span className="font-medium capitalize">{key}:</span> {value}
                                                        </p>
                                                    ))}
                                                </div>

                                                {/* Price */}
                                                <p className="font-baloo text-2xl font-semibold text-[#5A1A2B]">
                                                    ₹{price?.amount}
                                                </p>
                                            </div>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-3 border border-[#F3D9CB] p-2">
                                                    <button
                                                        className="w-5 h-5 flex items-center justify-center text-[#6B7280] opacity-50"
                                                        onClick={() => { subItemQuantityHandler(item._id) }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M5 11V13H19V11H5Z"></path></svg>
                                                    </button>
                                                    <span className="w-6 text-center text-sm font-medium text-[#5A1A2B]">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        className="w-5 h-5 flex items-center justify-center text-[#6B7280] opacity-50"
                                                        onClick={() => { addItemQuantityHandler(item._id); }}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5H13V11H19V13H13V19H11V13H5V11H11Z"></path></svg>
                                                    </button>
                                                </div>

                                                {/* Delete Button */}
                                                <button
                                                    className="w-5 h-5 flex items-center justify-center text-[#d45454] opacity-50"
                                                    onClick={() => { removeItemHandler(item._id) }}
                                                >
                                                    <svg fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── ORDER SUMMARY ── */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-6">
                                <h2 className="font-baloo text-2xl font-semibold text-[#5A1A2B] uppercase tracking-wide">
                                    Order Summary
                                </h2>

                                {/* Summary Items */}
                                <div className="space-y-3 pb-6 border-b border-[#F3D9CB]">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] uppercase tracking-[0.1em] text-[#6B7280]">Subtotal</span>
                                        <span className="font-baloo text-2xl font-semibold text-[#5A1A2B]">
                                            {currency === 'INR' ? '₹' : currency} {subtotal}
                                        </span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] uppercase tracking-[0.1em] text-[#F37966]">Discount ({appliedCoupon.code})</span>
                                            <span className="font-baloo text-2xl font-semibold text-[#F37966]">
                                                − {currency === 'INR' ? '₹' : currency} {discount}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] uppercase tracking-[0.1em] text-[#6B7280]">Shipping</span>
                                        <span className="font-poppins text-[14px] font-medium text-[#5A1A2B]">
                                            {shipping === 0 ? 'Free' : `${currency === 'INR' ? '₹' : currency} ${shipping}`}
                                        </span>
                                    </div>
                                    {tax > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] uppercase tracking-[0.1em] text-[#6B7280]">GST ({gstPercent}%)</span>
                                            <span className="font-poppins text-[14px] font-medium text-[#5A1A2B]">
                                                {currency === 'INR' ? '₹' : currency} {tax}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Promo Code */}
                                <div className="space-y-2 pb-6 border-b border-[#F3D9CB]">
                                    {appliedCoupon ? (
                                        <div className="flex items-center justify-between bg-[#F9E0D6] px-4 py-3 rounded-sm">
                                            <span className="text-[12px] font-medium text-[#5A1A2B]">
                                                <span className="text-[#F37966]">{appliedCoupon.code}</span> applied
                                            </span>
                                            <button onClick={removeCoupon} className="text-[11px] uppercase tracking-[0.1em] text-[#c0392b] hover:underline">
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Promo code"
                                                value={couponInput}
                                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                onKeyDown={(e) => { if (e.key === 'Enter') applyCoupon(); }}
                                                className="flex-1 px-4 py-2 bg-white border border-[#F3D9CB] text-[#5A1A2B] placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#F37966] transition-colors uppercase"
                                            />
                                            <button
                                                onClick={applyCoupon}
                                                disabled={applyingCoupon || !couponInput.trim()}
                                                className="px-6 py-2 bg-[#5A1A2B] text-[#FFF6F0] text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-[#43121F] transition-colors disabled:opacity-50"
                                            >
                                                {applyingCoupon ? '…' : 'Apply'}
                                            </button>
                                        </div>
                                    )}
                                    {couponError && <p className="text-[11px] text-[#c0392b]">{couponError}</p>}
                                </div>

                                {/* Total */}
                                <div className="flex justify-between items-center mb-8">
                                    <span className="text-sm uppercase tracking-[0.15em] font-medium text-[#5A1A2B]">Total</span>
                                    <span className="font-baloo text-4xl font-semibold text-[#5A1A2B]">
                                        {currency === 'INR' ? '₹' : currency} {payableTotal}
                                    </span>
                                </div>

                                {/* Checkout Button */}
                                <button
                                    className="w-full py-4 bg-[#5A1A2B] text-[#FFF6F0] font-medium uppercase tracking-[0.2em] text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    onClick={() => { setCheckoutError(''); setShowAddressForm(true) }}
                                >
                                    Go to Checkout
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* ── SHIPPING ADDRESS MODAL ── */}
            {showAddressForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-[#5A1A2B]/30 backdrop-blur-sm" onClick={() => setShowAddressForm(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-sm shadow-2xl border border-[#F3D9CB] max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-[#F3D9CB] px-8 py-5 flex items-center justify-between">
                            <h2 className="font-baloo text-2xl font-light text-[#5A1A2B]">
                                {addingNew && savedAddresses.length > 0 ? 'Add New Address' : 'Shipping Address'}
                            </h2>
                            <button onClick={() => setShowAddressForm(false)} className="p-1 text-[#6B7280] hover:text-[#5A1A2B]">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Delivery date */}
                        <div className="px-8 pt-6 space-y-1.5">
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F37966]">
                                Delivery Date
                            </label>
                            <input
                                type="date"
                                value={deliveryDate}
                                min={new Date().toISOString().split('T')[0]}
                                onChange={(e) => { setDeliveryDate(e.target.value); setDeliveryDateError(''); }}
                                className={`w-full bg-white border rounded-sm px-4 py-3 text-[14px] text-[#5A1A2B] focus:outline-none transition-colors ${deliveryDateError ? 'border-red-400' : 'border-[#F3D9CB] focus:border-[#F37966]'}`}
                            />
                            {deliveryDateError
                                ? <p className="text-[11px] text-red-500">{deliveryDateError}</p>
                                : <p className="text-[11px] text-[#6B7280]">When would you like your cake delivered?</p>}
                        </div>

                        {/* Saved address selection */}
                        {!addingNew && savedAddresses.length > 0 ? (
                            <div className="px-8 py-6 space-y-3">
                                {savedAddresses.map((a) => (
                                    <label
                                        key={a._id}
                                        className={`flex items-start gap-3 p-4 rounded-sm border cursor-pointer transition-colors ${selectedAddressId === a._id ? 'border-[#5A1A2B] bg-[#F9E0D6]' : 'border-[#F3D9CB] hover:border-[#C9B5A8]'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="savedAddress"
                                            checked={selectedAddressId === a._id}
                                            onChange={() => setSelectedAddressId(a._id)}
                                            className="mt-1 accent-[#5A1A2B]"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-medium text-[#5A1A2B]">{a.fullName} · {a.phone}</p>
                                            <p className="text-[12px] text-[#6B7280] leading-relaxed">
                                                {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} - {a.pincode}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); handleDeleteAddress(a._id); }}
                                            className="text-[10px] uppercase tracking-[0.1em] text-[#c0392b] hover:underline shrink-0"
                                        >
                                            Remove
                                        </button>
                                    </label>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setAddingNew(true)}
                                    className="w-full py-3 border border-dashed border-[#F3D9CB] rounded-sm text-[12px] uppercase tracking-[0.15em] text-[#F37966] hover:border-[#5A1A2B] hover:text-[#5A1A2B] transition-colors"
                                >
                                    + Add New Address
                                </button>
                            </div>
                        ) : (
                            /* New address form */
                            <div className="px-8 py-6 space-y-5">
                                {[
                                    { name: 'fullName', label: 'Full Name', placeholder: 'Recipient name', type: 'text' },
                                    { name: 'email', label: 'Email', placeholder: 'you@example.com', type: 'email' },
                                    { name: 'phone', label: 'Phone Number', placeholder: '10-digit mobile number', type: 'tel' },
                                    { name: 'line1', label: 'Address Line 1', placeholder: 'House no., street', type: 'text' },
                                    { name: 'line2', label: 'Address Line 2 (Optional)', placeholder: 'Landmark, area', type: 'text' },
                                ].map((field) => (
                                    <div key={field.name} className="space-y-1.5">
                                        <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F37966]">{field.label}</label>
                                        <input
                                            type={field.type}
                                            name={field.name}
                                            value={address[field.name]}
                                            onChange={handleAddressChange}
                                            placeholder={field.placeholder}
                                            className={`w-full bg-white border rounded-sm px-4 py-3 text-[14px] text-[#5A1A2B] placeholder:text-[#C9B5A8] focus:outline-none transition-colors ${addressErrors[field.name] ? 'border-red-400' : 'border-[#F3D9CB] focus:border-[#F37966]'}`}
                                        />
                                        {addressErrors[field.name] && <p className="text-[11px] text-red-500">{addressErrors[field.name]}</p>}
                                    </div>
                                ))}

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { name: 'city', label: 'City', placeholder: 'City' },
                                        { name: 'state', label: 'State', placeholder: 'State' },
                                    ].map((field) => (
                                        <div key={field.name} className="space-y-1.5">
                                            <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#F37966]">{field.label}</label>
                                            <input
                                                type="text"
                                                name={field.name}
                                                value={address[field.name]}
                                                onChange={handleAddressChange}
                                                placeholder={field.placeholder}
                                                className={`w-full bg-white border rounded-sm px-4 py-3 text-[14px] text-[#5A1A2B] placeholder:text-[#C9B5A8] focus:outline-none transition-colors ${addressErrors[field.name] ? 'border-red-400' : 'border-[#F3D9CB] focus:border-[#F37966]'}`}
                                            />
                                            {addressErrors[field.name] && <p className="text-[11px] text-red-500">{addressErrors[field.name]}</p>}
                                        </div>
                                    ))}
                                </div>

                                {savedAddresses.length > 0 && (
                                    <button type="button" onClick={() => setAddingNew(false)} className="text-[11px] uppercase tracking-[0.12em] text-[#F37966] hover:underline">
                                        ← Use a saved address
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="sticky bottom-0 bg-white border-t border-[#F3D9CB] px-8 py-5">
                            {checkoutError && <p className="text-[12px] text-red-500 mb-3">{checkoutError}</p>}
                            {(() => {
                                const isWhatsapp = (settings?.activeMethod || 'razorpay') === 'whatsapp' || !User;
                                const useSaved = !addingNew && savedAddresses.length > 0;
                                const label = isWhatsapp
                                    ? 'Confirm Order & Message on WhatsApp'
                                    : useSaved ? 'Deliver Here & Pay' : 'Save & Pay';
                                return (
                                    <button
                                        onClick={useSaved ? handleUseSelected : handleSaveNewAddress}
                                        disabled={useSaved && !selectedAddressId}
                                        className="w-full py-4 bg-[#5A1A2B] text-[#FFF6F0] font-medium uppercase tracking-[0.2em] text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {label}
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* ── NEWSLETTER SECTION ── */}
            <section className="mt-20 py-16 px-6 bg-[#F9E0D6]">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-2xl">
                        <h3 className="font-baloo text-3xl font-light tracking-widest text-[#5A1A2B] uppercase mb-6">
                            Stay Connected About Our Latest Offers
                        </h3>
                        <div className="flex gap-3">
                            <input
                                type="email"
                                placeholder="Enter your email address"
                                className="flex-1 px-6 py-3 bg-white border border-[#F3D9CB] text-[#5A1A2B] placeholder-[#6B7280] text-sm focus:outline-none focus:border-[#5A1A2B] transition-colors"
                            />
                            <button className="px-8 py-3 bg-[#5A1A2B] text-[#FFF6F0] text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#43121F] transition-colors">
                                Subscribe
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Cart;
