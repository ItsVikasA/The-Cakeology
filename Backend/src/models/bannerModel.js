import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        default: '',
    },
    subtitle: {
        type: String,
        default: '',
    },
    image: {
        type: String,
        required: [true, "Banner image is required"],
    },
    // Optional CTA link the banner navigates to when clicked.
    link: {
        type: String,
        default: '',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    // Display order (lower = first).
    order: {
        type: Number,
        default: 0,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
}, { timestamps: true });

const bannerModel = mongoose.model('banners', bannerSchema);

export default bannerModel;
