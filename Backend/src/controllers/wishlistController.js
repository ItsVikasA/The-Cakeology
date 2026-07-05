import userModel from "../models/userModel.js";

// Returns the logged-in user's wishlist with product details populated.
export const getWishlist = async (req, res) => {
    const user = await userModel.findById(req.user).populate({
        path: 'wishlist',
        select: 'title description images price variants category'
    });

    if (!user) return res.status(404).json({
        message: "User not found",
        success: false,
        error: "User not found"
    });

    res.status(200).json({
        message: "Fetched wishlist",
        success: true,
        wishlist: user.wishlist || []
    });
}

// Adds the product to the wishlist if absent, removes it if present.
export const toggleWishlist = async (req, res) => {
    const { productId } = req.params;

    const user = await userModel.findById(req.user);

    if (!user) return res.status(404).json({
        message: "User not found",
        success: false,
        error: "User not found"
    });

    const idx = user.wishlist.findIndex((id) => id.toString() === productId);

    let added;
    if (idx === -1) {
        user.wishlist.push(productId);
        added = true;
    } else {
        user.wishlist.splice(idx, 1);
        added = false;
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        message: added ? "Added to wishlist" : "Removed from wishlist",
        success: true,
        added,
        wishlist: user.wishlist
    });
}
