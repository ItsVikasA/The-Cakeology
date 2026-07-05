import { body, validationResult } from 'express-validator';

const CATEGORY_VALUES = ['birthday', 'wedding', 'anniversary', 'cupcake', 'cheesecake', 'brownie', 'pastry', 'cookies', 'custom'];

const validationHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// Note: product create uses multipart/form-data; multer parses text fields
// into req.body before these run, so plain string fields are validatable.
export const createProductValidator = [
    body('title')
        .trim()
        .isLength({ min: 3 })
        .withMessage('Title must be at least 3 characters long'),

    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required'),

    body('category')
        .trim()
        .notEmpty()
        .withMessage('A valid category is required'),

    validationHandler
];
