import { body, validationResult } from 'express-validator';

const validationHandler = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

export const createOrderValidator = [
    body('cartId').notEmpty().withMessage('Cart id is required'),
    body('address.fullName').trim().notEmpty().withMessage('Full name is required'),
    body('address.phone').trim().matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone is required'),
    body('address.line1').trim().notEmpty().withMessage('Address line 1 is required'),
    body('address.city').trim().notEmpty().withMessage('City is required'),
    body('address.state').trim().notEmpty().withMessage('State is required'),
    body('address.pincode').trim().matches(/^[0-9]{6}$/).withMessage('Valid 6-digit pincode is required'),
    body('deliveryDate')
        .notEmpty().withMessage('Delivery date is required')
        .isISO8601().withMessage('Valid delivery date is required')
        .custom((value) => {
            const picked = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (picked < today) throw new Error('Delivery date cannot be in the past');
            return true;
        }),
    validationHandler
];
