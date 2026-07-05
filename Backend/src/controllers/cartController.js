import mongoose from "mongoose";
import { variantStock } from "../dao/variantStock.dao.js";
import cartModel from "../models/cartModel.js";
import productModel from "../models/productModel.js";
import razorpay from "../services/paymentService.js";
import paymentModel from "../models/paymentModel.js";
import { validatePaymentVerification } from '../../node_modules/razorpay/dist/utils/razorpay-utils.js'
import { Config } from "../config/config.js";

async function getCart(userId) {
    const cart = await cartModel.aggregate([

        {
            '$match': {
                'userId': new mongoose.Types.ObjectId(userId)
            }
        },
        {
            '$unwind': {
                'path': '$items'
            }
        }, {
            '$lookup': {
                'from': 'products',
                'localField': 'items.productId',
                'foreignField': '_id',
                'as': 'items.productId'
            }
        }, {
            '$unwind': {
                'path': '$items.productId'
            }
        }, {
            '$unwind': {
                'path': '$items.productId.variants'
            }
        }, {
            '$match': {
                '$expr': {
                    '$eq': [
                        '$items.variantId', '$items.productId.variants._id'
                    ]
                }
            }
        }, {
            '$addFields': {
                'itemTotalPrice': {
                    'amount': {
                        '$multiply': [
                            '$items.quantity', '$items.productId.variants.price.amount'
                        ]
                    },
                    'currency': '$items.productId.variants.price.currency'
                }
            }
        }, {
            '$group': {
                '_id': '$_id',
                'finalAmount': {
                    '$sum': '$itemTotalPrice.amount'
                },
                'finalCurrency': {
                    '$first': '$items.productId.price.currency'
                },
                'items': {
                    '$push': '$items'
                }
            }
        }, {
            '$project': {
                'totalPrice': {
                    'amount': '$finalAmount',
                    'currency': '$finalCurrency'
                },
                'items': '$items'
            }
        }
    ]);

    return cart;
}

export const addItemToCart = async (req, res) => {

    const userId = req.user;

    const { productId, variantId } = req.params;
    const { quantity } = req.body;

    const stock = await variantStock(productId, variantId);


    if (!productId || !variantId) return res.status(400).json({
        message: "ProductId or VariantId not found",
        success: false,
        err: "ProductId or VariantId missing in params"
    })

    const product = await productModel.findOne({ _id: productId, 'variants._id': variantId });

    if (!product) return res.status(404).json({
        message: "Product variant do not exist",
        success: false,
        err: "Product variant do not exist"
    })

    let cart = await cartModel.findOne({ userId });

    if (!cart) {


        if (quantity > stock) return res.status(400).json({
            message: "Insuffecient stock for required item quantity",
            success: false,
        })

        cart = await cartModel.create({ userId, items: [{ productId, variantId, quantity }] });

        return res.status(200).json({
            message: "Item added to cart",
            success: true,
            cart
        })
    }

    const existingItem = cart.items.find((item) => item.productId == productId && item.variantId == variantId);

    if (!existingItem) {

        cart.items.push({ productId, variantId, quantity });

        await cart.save();

        return res.status(200).json({
            message: "Item added to cart",
            success: true,
            cart
        })
    }

    if (existingItem.quantity >= stock) {

        return res.status(400).json({
            message: "Insuffecient stock for required item quantity",
            success: false,
        })
    }

    existingItem.quantity += quantity;

    await cart.save();

    res.status(200).json({
        message: "Item added to cart",
        success: true,
        cart
    })

}

export const getCartItems = async (req, res) => {
    const userId = req.user;

    const cart = await getCart(userId);

    if (!cart) return res.status(200).json({
        message: "No cart items found",
        success: true,
        error: "No cart items found"
    })

    console.log(cart);


    res.status(200).json({
        message: "Fetched cart items",
        success: true,
        cart: cart[0]
    })

}

export const addItemQuantity = async (req, res) => {
    const userId = req.user;
    const { itemId } = req.body;

    let cart = await cartModel.findOne({ userId });

    if (!cart) return res.status(404).json({
        message: "Invalid cart id",
        success: false,
        error: "Invalid cart id"
    })

    const item = cart.items.find((item) => item._id == itemId);

    if (!item) return res.status(404).json({
        message: "Item not found in cart",
        success: false,
        error: "Cart item not found"
    })

    const stock = await variantStock(item.productId.toString(), item.variantId.toString());


    if (item.quantity >= stock) return res.status(400).json({
        message: "Insuffecient stock for required item quantity",
        success: false,
        error: "Insuffecient stock"
    })

    item.quantity++;


    await cart.save();

    res.status(200).json({
        message: "Item quantity increased",
        success: true,
        item
    })

}

export const subItemQuantity = async (req, res) => {
    const userId = req.user;
    const { itemId } = req.body;

    let cart = await cartModel.findOne({ userId });

    if (!cart) return res.status(404).json({
        message: "Invalid cart id",
        success: false,
        error: "Invalid cart id"
    })

    const item = cart.items.find((item) => item._id == itemId);

    if (!item) return res.status(404).json({
        message: "Item not found in cart",
        success: false,
        error: "cart item not found"
    })

    item.quantity--;

    if (item.quantity == 0) {
        cart.items = cart.items.filter((cartItem) => cartItem._id != itemId);

        await cart.save();

        return res.status(200).json({
            message: "Item removed from cart",
            success: true
        })
    }


    await cart.save();

    res.status(200).json({
        message: "Item quantity decreased",
        success: true,
        item
    })

}

export const removeItem = async (req, res) => {
    const userId = req.user;
    const { itemId } = req.body;

    let cart = await cartModel.findOne({ userId });

    if (!cart) return res.status(404).json({
        message: "Invalid cart id",
        success: false,
        error: "Iinvalid cart id"
    })

    const itemIndex = cart.items.findIndex((i) => i._id == itemId);

    cart.items.splice(itemIndex, 1);

    await cart.save();

    res.status(200).json({
        message: "Item removed from cart",
        success: true
    })
}

export const createPaymentOrder = async (req, res) => {

    const userId = req.user;
    const cart = await getCart(userId);

    const { amount, currency = 'INR' } = req.body;

    if (!amount || !currency) return res.status(400).json({
        message: "Amount or Currency not provided",
        success: false,
        error: "Amount or Currency missing"
    })

    const options = {
        amount: amount * 100,
        currency: currency
    };

    const order = await razorpay.orders.create(options);

    const payment = await paymentModel.create({ userId, cartId: cart[0]._id, order: { razorpay_order_id: order.id }, price: cart[0].totalPrice });

    res.status(200).json({
        message: "Payment pending",
        success: true,
        order
    })

}

export const verifyPayment = async (req, res) => {
    const userId = req.user;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;


    if (!razorpay_order_id) return res.status(400).json({
        message: "Order_id not provided",
        success: false,
        error: "razorpay_order_id not provided"
    })

    const payment = await paymentModel.findOne({ userId, status: { $in: ['pending', 'failed'] }, "order.razorpay_order_id": razorpay_order_id });


    if (!payment) return res.status(404).json({
        message: "Payment request do not exist",
        success: false,
        error: "Payment request do not exist"
    })

    if (!razorpay_payment_id || !razorpay_signature) {

        return res.status(200).json({
            message: "Payment failed",
            success: false,
            error: "razorpay_payment_id or razorpay_signature not found"
        })
    }

    const result = validatePaymentVerification({ "order_id": razorpay_order_id, "payment_id": razorpay_payment_id }, razorpay_signature, Config.RAZORPAY_KEY_SECRET);

    if (!result) {
        payment.status = 'failed';
        await payment.save();

        return res.status(400).json({
            message: 'Invalid signature',
            success: false,
        });
    }

    payment.order.razorpay_payment_id = razorpay_payment_id;
    payment.order.razorpay_signature = razorpay_signature;
    payment.status = 'paid';

    await payment.save();

    res.status(200).json({
        message: "Payment Verified successfully",
        success: true,
        cartId: payment.cartId
    })
}


