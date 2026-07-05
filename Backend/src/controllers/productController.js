import { variantStock } from "../dao/variantStock.dao.js";
import cartModel from "../models/cartModel.js";
import productModel from "../models/productModel.js";
import ImagetKitUpload from "../services/imagekit.js";

export const createProduct = async (req, res) => {
    const { title, description, category, brand } = req.body;
    let price = req.body.price;

    if (typeof price == 'string') {
        price = JSON.parse(price);
    }

    const imagesUrl = await Promise.all(req.files.map((image) => { return ImagetKitUpload(image.buffer, image.originalname) }));

    const product = await productModel.create({ title, description, category, brand: brand || null, images: imagesUrl, price, sellerId: req.user });

    res.status(201).json({
        message: "Product created",
        success: true,
        product
    })
}

export const createVariant = async (req, res) => {

    const { productId } = req.params;

    if (!productId) return res.status(400).json({
        message: "Product Id is missing",
        success: false,
        error: "Product Id not found in params"
    });

    const product = await productModel.findOne({ _id: productId, sellerId: req.user });

    if (!product) return res.status(404).json({
        message: "Product not found",
        success: false,
        error: "Product not found"
    })

    const attribute = JSON.parse(req.body.attribute);
    const stock = req.body.stock || 0;
    let price = req.body.price || product.price;

    if (req.body.price) {
        price = JSON.parse(price);
    }


    if (req.files.length > 0) {
        const imagesUrl = await Promise.all(req.files.map((image) => { return ImagetKitUpload(image.buffer, image.originalname) }))
        var images = [...imagesUrl];
    }
    else {
        var images = product.images;
    }

    product.variants.push({ attribute, images, price, stock });

    await product.save();

    res.status(201).json({
        message: "Product Variant created",
        success: true
    })

}

export const deleteVariant = async (req, res) => {


    const { productId } = req.params;
    const { variantId } = req.body;
    console.log(variantId);

    if (!productId) return res.status(400).json({
        message: "Product Id is missing",
        success: false,
        error: "Product Id not found in params"
    });

    const product = await productModel.findOne({ _id: productId, sellerId: req.user });

    if (!product) return res.status(404).json({
        message: "Product not found",
        success: false,
        error: "Product not found"
    })

    variantId.forEach(deleteReq => {

        const variantIdx = product.variants.findIndex(variant => variant._id == deleteReq);

        if (variantIdx != -1) product.variants.splice(variantIdx, 1);

    });

    await product.save();

    res.status(201).json({
        message: "Product Variant deleted",
        success: true,
        product
    })

}

// Seller deletes one of their own products entirely.
export const deleteProduct = async (req, res) => {
    const { productId } = req.params;

    if (!productId) return res.status(400).json({
        message: "Product Id is missing",
        success: false,
        error: "Product Id not found in params"
    });

    const product = await productModel.findOneAndDelete({ _id: productId, sellerId: req.user });

    if (!product) return res.status(404).json({
        message: "Product not found",
        success: false,
        error: "Product not found or you are not its seller"
    });

    res.status(200).json({
        message: "Product deleted",
        success: true,
        productId
    });
}

// Seller sets the absolute stock of a single variant (inline inventory edit).
export const updateVariantStock = async (req, res) => {
    const { productId, variantId } = req.params;
    const newStock = Number(req.body.stock);

    if (Number.isNaN(newStock) || newStock < 0) {
        return res.status(400).json({
            message: "Stock must be a non-negative number",
            success: false,
            error: "Invalid stock value"
        });
    }

    const result = await productModel.updateOne(
        { _id: productId, sellerId: req.user, 'variants._id': variantId },
        { $set: { 'variants.$.stock': newStock } }
    );

    if (result.matchedCount === 0) {
        return res.status(404).json({
            message: "Variant not found",
            success: false,
            error: "Variant not found or you are not its seller"
        });
    }

    res.status(200).json({
        message: "Stock updated",
        success: true,
        productId,
        variantId,
        stock: newStock,
    });
}

export const getSellerProducts = async (req, res) => {
    const products = await productModel.find({ sellerId: req.user });

    if (!products) return res.status(404).json({
        message: "No products found for Seller with userId: " + req.user,
        success: false,
        error: "No products found"
    })

    res.status(201).json({
        message: "Products fetched of Seller with userId: " + req.user,
        success: true,
        products
    })
}

export const getProducts = async (req, res) => {
    const products = await productModel.find();

    if (!products) return res.status(404).json({
        message: "No products found",
        success: false,
        error: "No products found"
    })

    res.status(201).json({
        message: "Fetched all products",
        success: true,
        products
    })
}

export const getProduct = async (req, res) => {
    const { productId } = req.params;
    const product = await productModel.findOne({ _id: productId });

    if (!product) return res.status(404).json({
        message: "Product not found",
        success: false,
        error: "Product not found"
    })

    res.status(201).json({
        message: "Fetched product details",
        success: true,
        product
    })
}

export const updateProduct = async (req, res) => {
    const { productId } = req.params;

    if (!productId) return res.status(400).json({
        message: "Product Id is missing",
        success: false,
        error: "Product Id not found in params"
    })

    let { title, description, price, variants, existingImages, category, brand } = req.body;

    if (typeof price == 'string') {
        price = JSON.parse(price);
    }

    if (typeof variants == 'string') {
        variants = JSON.parse(variants);
    }

    if (existingImages) {
        existingImages = JSON.parse(existingImages);
    }

    const imagesUrl = req.files?.length ? await Promise.all(req.files.map((image) => { return ImagetKitUpload(image.buffer, image.originalname) })) : [];

    const product = await productModel.findOne({ _id: productId, sellerId: req.user });

    if (!product) return res.status(404).json({
        message: "Product not found",
        success: false,
        error: "No product found by the this product Id"
    })


    const updateFields = {};

    if (title !== undefined) {
        updateFields.title = title;
    }

    if (description !== undefined) {
        updateFields.description = description;
    }

    if (category !== undefined) {
        updateFields.category = category;
    }

    if (brand !== undefined) {
        updateFields.brand = brand;
    }

    if (price !== undefined) {
        updateFields.price = price;
    }

    if (variants !== undefined) {
        updateFields.variants = variants;
    }

    updateFields.images = [...existingImages, ...imagesUrl];


    let updatedProduct;

    try {
        updatedProduct = await productModel.findByIdAndUpdate(productId, updateFields);
    }
    catch (err) {
        console.log(err);
        return res.status(400).json({
            message: "Product updation failed",
            success: false,
            err: err
        })
    }

    res.status(200).json({
        message: "Product Updated",
        success: true,
        updatedProduct
    })

}