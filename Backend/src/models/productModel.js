import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Product title is required"],
    },
    description: {
        type: String,
        required: [true, "Product description is required"]
    },
    category: {
        type: String,
        required: [true, "Product category is required"],
    },
    brand: {
        type: String,
        default: null,
    },
    images: {
        type: [String],
        required: [true, "Product images are required"]
    },
    price: {
        type: {
            amount: {
                type: Number,
                required: [true, "Product price amount is required"]
            }, currency: {
                type: String,
                default: 'INR',
                enum: ["USD", "INR", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD"],
            }
        },
        required: true
    },

    variants: [
        {
            attribute: {
                type: Map,
                of: String,
                required: [true, "Variant attribute is required"]
            },
            images: {
                type: [String],
                required: [true, "Prodcut variant image Url is required"]
            },
            price: {
                amount: {
                    type: Number,
                    required: [true, "Product variant price amount is required"]
                },
                currency: {
                    type: String,
                    default: 'INR',
                    enum: ["USD", "INR", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD"],
                    required: [true, "Prodcut variant currency is required"]
                }

            },
            stock: {
                type: Number,
                default: 0,
                required: [true, "Product Variant stock quantity is required"]
            }
        },
    ],

    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "Product sellerId is required"]
    }

})

const productModel = mongoose.model("products", productSchema);

export default productModel