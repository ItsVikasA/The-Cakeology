import mongoose, { mongo, Mongoose } from 'mongoose';

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, "userId is required"]
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products",
            required: [true, "userId is required"]
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "products.variants",
            required: [true, "variantId is required"]
        },
        quantity: {
            type: Number,
            default:1
        }
    }
    ]
})

const cartModel = mongoose.model("carts",cartSchema);

export default cartModel;