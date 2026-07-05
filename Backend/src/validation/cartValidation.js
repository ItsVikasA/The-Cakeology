import { body, param, validationResult } from 'express-validator';


const validationHandler = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    next();
}


export const addToCartValidator = [
    param('productId')
        .isMongoId(true)
        .withMessage("ProductId must be a Mongoose Id"),
    param('variantId')
        .isMongoId(true)
        .withMessage("VariantId must be a Mongoose Id"),

    validationHandler
]

export const cartItemValidator = [
    param('itemId')
        .isMongoId(true)
        .withMessage("itemId must be a Mongoose Id"),
]