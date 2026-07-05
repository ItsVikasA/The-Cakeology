import { useDispatch, useSelector } from "react-redux";
import { addItemQuantityApi, addItemToCartApi, getCartItemsAPi, removeItemApi, subItemQuantityApi, createOrderPaymentApi, verifyPaymentApi } from "../Service/cartApi.js";
import { setcartItems, setSubtotal, settotal, addItemQuantity, subItemQuantity, subtractSubtotal, subtractTotal, removeCartItem, addSubtotal, addtotal, setCurrency } from "../State/cartSlice.js";
import { getGuestCart, addToGuestCart, incGuestItem, decGuestItem, removeGuestItem } from "../Service/guestCart.js";

const useCart = () => {

    const dispatch = useDispatch();
    const User = useSelector((state) => state.auth.User);

    // Push a guest cart (or null) into Redux, mirroring the server cart flow.
    const loadCartToStore = (cart) => {
        if (!cart) {
            dispatch(setSubtotal(0));
            dispatch(settotal(0));
            dispatch(setcartItems(null));
            return;
        }
        dispatch(setSubtotal(cart.totalPrice.amount));
        dispatch(settotal(cart.totalPrice.amount));
        dispatch(setCurrency(cart.totalPrice.currency));
        dispatch(setcartItems(cart));
    };

    // Guest add-to-cart (no account): stores in localStorage, reflects in Redux.
    const addGuestItemHandler = (product, variant) => {
        const cart = addToGuestCart(product, variant);
        loadCartToStore(cart);
        return cart;
    };

    const addItemToCartHandler = async (productId, variantId) => {
        const itemAdded = await addItemToCartApi(productId, variantId);
        // Refresh cart state so the navbar badge reflects the new count.
        await getCartItemsHandler();
        return itemAdded;
    }

    const getCartItemsHandler = async () => {
        // Guests have no server cart — load the localStorage one.
        if (!User) {
            loadCartToStore(getGuestCart());
            return;
        }
        const cartItemsData = await getCartItemsAPi();
        const cart = cartItemsData.cart;
        if (!cart) {
            dispatch(setSubtotal(0));
            dispatch(settotal(0));
            dispatch(setcartItems(null));
            return;
        }
        dispatch(setSubtotal(cart.totalPrice.amount));
        dispatch(settotal(cart.totalPrice.amount));
        dispatch(setCurrency(cart.totalPrice.currency));
        dispatch(setcartItems(cart));
    }

    const addItemQuantityHandler = async (itemId) => {
        if (!User) { loadCartToStore(incGuestItem(itemId)); return; }
        const res = await addItemQuantityApi(itemId);
        dispatch(addItemQuantity(itemId));
        dispatch(addSubtotal(itemId));
        dispatch(addtotal(itemId));
        return res;
    }

    const subItemQuantityHandler = async (itemId) => {
        if (!User) { loadCartToStore(decGuestItem(itemId)); return; }
        const res = await subItemQuantityApi(itemId);
        dispatch(subItemQuantity(itemId));
        dispatch(subtractSubtotal(itemId));
        dispatch(subtractTotal(itemId));
        return res;
    }

    const removeItemHandler = async (itemId) => {
        if (!User) { loadCartToStore(removeGuestItem(itemId)); return; }
        const res = await removeItemApi(itemId);
        dispatch(removeCartItem(itemId));
        return res;
    }


    const createOrderPaymentHandler = async (amount, currency) => {
        const res = await createOrderPaymentApi(amount, currency);
        return res.order;
    }

    const verifyPaymentHandler = async ({ orderId, paymentId, paymentSignature }) => {
        try {
            const res = await verifyPaymentApi({ orderId, paymentId, paymentSignature });
            return res;
        } catch (err) {
            return false;
        }
    }

    return { addItemToCartHandler, addGuestItemHandler, getCartItemsHandler, addItemQuantityHandler, subItemQuantityHandler, removeItemHandler, createOrderPaymentHandler, verifyPaymentHandler }
}

export default useCart;