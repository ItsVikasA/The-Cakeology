import categoryModel from "../models/categoryModel.js";
import productModel from "../models/productModel.js";

const slugify = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Public: list all categories (top-level + subcategories).
export const getCategories = async (req, res) => {
    const categories = await categoryModel.find().sort({ name: 1 });
    res.status(200).json({ message: "Fetched categories", success: true, categories });
}

// Seller creates a category or subcategory.
export const createCategory = async (req, res) => {
    const { name, parent, sizeOptions } = req.body;

    if (!name) return res.status(400).json({ message: "Category name is required", success: false, error: "Missing name" });

    const slug = slugify(name);

    const exists = await categoryModel.findOne({ slug });
    if (exists) return res.status(400).json({ message: "A category with this name already exists", success: false, error: "Duplicate" });

    const category = await categoryModel.create({
        name: name.trim(),
        slug,
        parent: parent || null,
        sizeOptions: Array.isArray(sizeOptions) ? sizeOptions : [],
        createdBy: req.user,
    });

    res.status(201).json({ message: "Category created", success: true, category });
}

// Seller updates a category's name / size options / parent.
export const updateCategory = async (req, res) => {
    const { categoryId } = req.params;
    const { name, sizeOptions, parent } = req.body;

    const category = await categoryModel.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found", success: false, error: "Not found" });

    if (name) {
        category.name = name.trim();
        category.slug = slugify(name);
    }
    if (Array.isArray(sizeOptions)) category.sizeOptions = sizeOptions;
    if (parent !== undefined) category.parent = parent || null;

    await category.save();
    res.status(200).json({ message: "Category updated", success: true, category });
}

// Seller deletes a category (blocked if products still use it).
export const deleteCategory = async (req, res) => {
    const { categoryId } = req.params;
    const category = await categoryModel.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found", success: false, error: "Not found" });

    const inUse = await productModel.countDocuments({ category: category.slug });
    if (inUse > 0) {
        return res.status(400).json({ message: `Cannot delete: ${inUse} product(s) use this category`, success: false, error: "Category in use" });
    }

    // Also remove subcategories of this category.
    await categoryModel.deleteMany({ parent: categoryId });
    await categoryModel.findByIdAndDelete(categoryId);

    res.status(200).json({ message: "Category deleted", success: true, categoryId });
}
