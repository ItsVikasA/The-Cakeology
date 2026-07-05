import mongoose from "mongoose";
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        unique: true,
        required: [true, "Fullname is required"]
    },
    email: {
        type: String,
        unique: true,
        required: [true, "email is required"]
    },
    password: {
        type: String,
        select: false,
        required: [true, "Password is required"],
    },
    contact: {
        type: String,
        unique: true,
        required: false
    },
    role: {
        type: String,
        default: "buyer",
        enum: ["seller", "buyer", "admin"]
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    addresses: [{
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        line1: { type: String, required: true },
        line2: { type: String, default: '' },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, default: '' },
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "products"
    }]

})


userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

const userModel = mongoose.model("users", userSchema);

export default userModel