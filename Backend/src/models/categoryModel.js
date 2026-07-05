import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    // null = top-level category; otherwise a subcategory of `parent`.
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categories',
        default: null,
    },
    // Allowed variant sizes for products in this category.
    sizeOptions: {
        type: [String],
        default: [],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
}, { timestamps: true });

const categoryModel = mongoose.model('categories', categorySchema);

export default categoryModel;
