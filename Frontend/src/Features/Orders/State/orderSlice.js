import { createSlice, current } from '@reduxjs/toolkit'; 

const orderSlice = createSlice({ 
  name: 'order', 
  initialState: { 
    orderDets: [],
    sellerOrders: []
  }, 
  reducers: { 
    setOrderDets: (state, action) => { 
      state.orderDets = action.payload; 
    },
    setSellerOrders: (state, action) => {
      state.sellerOrders = action.payload;
    }
  } 
});

export const { setOrderDets, setSellerOrders } = orderSlice.actions; 
export default orderSlice.reducer;