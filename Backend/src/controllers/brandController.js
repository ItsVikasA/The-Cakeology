import brandModel from "../models/brandModel.js";
import productModel from "../models/productModel.js";

const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const getBrands = async (req, res) => {
    const brands = await brandModel.find().sort({ name: 1 });
    res.status(200).json({ message: "Fetched brands", success: true, brands });
}

export const createBrand = async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Brand name is required", success: false, error: "Missing name" });

    const slug = slugify(name);
    const exists = await brandModel.findOne({ slug });
    if (exists) return res.status(400).json({ message: "A brand with this name already exists", success: false, error: "Duplicate" });

    const brand = await brandModel.create({ name: name.trim(), slug, createdBy: req.user });
    res.status(201).json({ message: "Brand created", success: true, brand });
}

export const deleteBrand = async (req, res) => {
    const { brandId } = req.params;
    const brand = await brandModel.findById(brandId);
    if (!brand) return res.status(404).json({ message: "Brand not found", success: false, error: "Not found" });

    const inUse = await productModel.countDocuments({ brand: brand.slug });
    if (inUse > 0) {
        return res.status(400).json({ message: `Cannot delete: ${inUse} product(s) use this brand`, success: false, error: "Brand in use" });
    }

    await brandModel.findByIdAndDelete(brandId);
    res.status(200).json({ message: "Brand deleted", success: true, brandId });
}
