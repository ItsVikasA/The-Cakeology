import { createSlice } from "@reduxjs/toolkit";

const productSlice = createSlice({
    name: 'products',
    initialState: {
        Product: null,
        AllProducts: [],
        SellerProducts: [],
    },
    reducers: {
        setAllProducts: (state, action) => {
            state.AllProducts = action.payload;
        },
        setProduct: (state, action) => {
            state.Product = action.payload;
        },
        setSellerProducts: (state, action) => {
            state.SellerProducts = action.payload;
        },
    }
})

export const { setAllProducts, setProduct, setSellerProducts } = productSlice.actions;
export default productSlice.reducer;