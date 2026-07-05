import productModel from "../models/productModel.js"

export const variantStock = async (productId, variantId) => {
    const product = await productModel.findOne({ _id: productId });

    const stock = product.variants.find(variant =>  variant._id == variantId ).stock;

    return stock;
}