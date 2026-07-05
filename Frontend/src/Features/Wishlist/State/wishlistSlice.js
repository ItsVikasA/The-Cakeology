import { createSlice } from '@reduxjs/toolkit';

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: {
        // Full product objects (for the wishlist page)
        items: [],
        // Set of product ids for quick lookup on cards
        ids: [],
    },
    reducers: {
        setWishlist: (state, action) => {
            state.items = action.payload || [];
            state.ids = (action.payload || []).map((p) => p._id);
        },
        setWishlistIds: (state, action) => {
            state.ids = action.payload || [];
        },
    },
});

export const { setWishlist, setWishlistIds } = wishlistSlice.actions;
export default wishlistSlice.reducer;
