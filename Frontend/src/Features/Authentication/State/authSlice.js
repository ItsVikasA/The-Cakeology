import { createSlice } from "@reduxjs/toolkit"

const authSlice = createSlice({
    name: "auth",
    initialState: {
        User: null,
        Loading: true,
        Error: null
    },

    reducers: {
        setUser: (state, action) => {
            state.User = action.payload;
        },
        setLoading: (state, action) => {
            state.Loading = action.payload;
        },
        setError: (state, action) => {
            state.Error = action.payload;
        }
    }
})

export const { setUser, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;