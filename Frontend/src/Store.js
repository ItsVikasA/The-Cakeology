import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Features/Authentication/State/authSlice.js';
import productReducer from './Features/Products/State/productSlice.js';
import cartReducer from './Features/Cart/State/cartSlice.js';
import orderReducer from './Features/Orders/State/orderSlice.js'
import wishlistReducer from './Features/Wishlist/State/wishlistSlice.js'
import customCakeReducer from './Features/CustomCake/State/customCakeSlice.js'


export const reduxStore = configureStore({
    reducer: {
        auth: authReducer,
        products: productReducer,
        cart: cartReducer,
        order: orderReducer,
        wishlist: wishlistReducer,
        customCake: customCakeReducer
    }
});

