import { useDispatch } from "react-redux";
import { getWishlistApi, toggleWishlistApi } from "../Service/wishlistApi";
import { setWishlist, setWishlistIds } from "../State/wishlistSlice";

const useWishlist = () => {
    const dispatch = useDispatch();

    const getWishlistHandler = async () => {
        const res = await getWishlistApi();
        dispatch(setWishlist(res.wishlist));
        return res.wishlist;
    }

    const toggleWishlistHandler = async (productId) => {
        const res = await toggleWishlistApi(productId);
        // Backend returns the updated list of ids; sync the lookup set.
        dispatch(setWishlistIds(res.wishlist));
        return res;
    }

    return { getWishlistHandler, toggleWishlistHandler };
}

export default useWishlist;
