import { createSlice, current } from "@reduxjs/toolkit";


const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        cartItems: null,
        subtotal: 0,
        total: 0, // Add taxes/shipping if needed
        currency: 'INR'
    },
    reducers: {
        setcartItems: (state, action) => {
            state.cartItems = action.payload;
        },

        setSubtotal: (state, action) => {
            state.subtotal = action.payload;
        },
        settotal: (state, action) => {
            state.total = action.payload;
        },
        setCurrency: (state, action) => {
            state.currency = action.payload;
        },
        addItemQuantity: (state, action) => {
            state.cartItems.items.forEach((item) => {
                if (item._id == action.payload) {
                    item.quantity += 1;
                    return;
                }
            })
        },
        addSubtotal: (state, action) => {
            state.cartItems.items.forEach((item) => {
                if (item._id == action.payload) {
                    state.subtotal += item.productId.variants.price.amount;
                    return;
                }
            })
        },
        addtotal: (state, action) => {
            state.cartItems.items.forEach((item) => {
                if (item._id == action.payload) {
                    state.total += item.productId.variants.price.amount;
                    return;
                }
            })
        },
        subItemQuantity: (state, action) => {
            state.cartItems.items.forEach((item) => {
                if (item._id == action.payload) {
                    item.quantity -= 1;
                    return;
                }
            })
        },
        subtractSubtotal: (state, action) => {
            state.cartItems.items.forEach((item) => {
                if (item._id == action.payload) {
                    state.subtotal -= item.productId.variants.price.amount;
                    return;
                }
            })
        },
        subtractTotal: (state, action) => {
            state.cartItems.items.forEach((item) => {
                if (item._id == action.payload) {
                    state.total -= item.productId.variants.price.amount;
                    return;
                }
            })
        },
        removeCartItem: (state, action) => {
            if (state.cartItems.items) {
                state.cartItems.items = state.cartItems.items.filter(
                    (item) => item._id !== action.payload
                );
            }
        },

    }
})

export const { setcartItems, setSubtotal, settotal, setCurrency, addItemQuantity, addtotal, addSubtotal, subItemQuantity, subtractSubtotal, subtractTotal, removeCartItem } = cartSlice.actions;
export default cartSlice.reducer;