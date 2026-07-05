import bannerModel from "../models/bannerModel.js";
import ImagetKitUpload from "../services/imagekit.js";

// Public: active banners for the storefront hero, ordered.
export const getActiveBanners = async (req, res) => {
    const banners = await bannerModel.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.status(200).json({ message: "Fetched banners", success: true, banners });
}

// Admin: all banners.
export const getAllBanners = async (req, res) => {
    const banners = await bannerModel.find().sort({ order: 1, createdAt: -1 });
    res.status(200).json({ message: "Fetched banners", success: true, banners });
}

// Admin: create a banner with an uploaded image.
export const createBanner = async (req, res) => {
    const { title, subtitle, link, order } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: "Banner image is required", success: false, error: "No image" });
    }

    const imageUrl = await ImagetKitUpload(req.file.buffer, req.file.originalname);

    const banner = await bannerModel.create({
        title: title || '',
        subtitle: subtitle || '',
        link: link || '',
        order: Number(order) || 0,
        image: imageUrl,
        createdBy: req.user,
    });

    res.status(201).json({ message: "Banner created", success: true, banner });
}

// Admin: toggle active state.
export const toggleBanner = async (req, res) => {
    const { bannerId } = req.params;
    const banner = await bannerModel.findById(bannerId);
    if (!banner) return res.status(404).json({ message: "Banner not found", success: false, error: "Not found" });

    banner.isActive = !banner.isActive;
    await banner.save();
    res.status(200).json({ message: "Banner updated", success: true, banner });
}

// Admin: delete.
export const deleteBanner = async (req, res) => {
    const { bannerId } = req.params;
    const banner = await bannerModel.findByIdAndDelete(bannerId);
    if (!banner) return res.status(404).json({ message: "Banner not found", success: false, error: "Not found" });

    res.status(200).json({ message: "Banner deleted", success: true, bannerId });
}
