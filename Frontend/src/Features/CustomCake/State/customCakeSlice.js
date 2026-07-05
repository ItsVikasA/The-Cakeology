import { createSlice } from '@reduxjs/toolkit';

const customCakeSlice = createSlice({
    name: 'customCake',
    initialState: {
        myRequests: [],
        sellerRequests: [],
    },
    reducers: {
        setMyRequests: (state, action) => {
            state.myRequests = action.payload;
        },
        setSellerRequests: (state, action) => {
            state.sellerRequests = action.payload;
        },
    },
});

export const { setMyRequests, setSellerRequests } = customCakeSlice.actions;
export default customCakeSlice.reducer;
