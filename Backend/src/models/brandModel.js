import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Brand name is required"],
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
    },
}, { timestamps: true });

const brandModel = mongoose.model('brands', brandSchema);

export default brandModel;
