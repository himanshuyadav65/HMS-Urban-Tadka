import { body, validationResult } from 'express-validator';

// Middleware to run validations and return 400 if validation failed
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

export const registerValidator = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone number is required').trim(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['SuperAdmin', 'HotelOwner', 'Receptionist', 'Housekeeping', 'Customer']).withMessage('Invalid role choice'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const roomValidator = [
  body('roomNumber').notEmpty().withMessage('Room number is required').trim(),
  body('roomType').notEmpty().withMessage('Room type is required').trim(),
  body('floor').isInt({ min: 0 }).withMessage('Floor must be a non-negative number'),
  body('pricePerNight').isFloat({ min: 0 }).withMessage('Price per night must be a non-negative number'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('amenities').optional().isArray().withMessage('Amenities must be an array of strings'),
  body('description').optional().trim(),
];

export const customerValidator = [
  body('name').notEmpty().withMessage('Customer name is required').trim(),
  body('phone').notEmpty().withMessage('Customer phone number is required').trim(),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please enter a valid customer email address').normalizeEmail(),
  body('address').optional().trim(),
  body('idType').notEmpty().withMessage('Government ID type is required').trim(),
  body('idNumber').notEmpty().withMessage('Government ID number is required').trim(),
];

export const bookingValidator = [
  body('customerId').optional().trim(),
  body('roomId').notEmpty().withMessage('Valid room ID is required').trim(),
  body('checkIn').isISO8601().toDate().withMessage('Check-in must be a valid ISO8601 date'),
  body('checkOut').isISO8601().toDate().withMessage('Check-out must be a valid ISO8601 date'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Discount amount must be positive'),
];

export const paymentValidator = [
  body('bookingId').notEmpty().withMessage('Valid booking ID is required').trim(),
  body('paymentMethod').isIn(['Cash', 'Card', 'UPI', 'Stripe', 'Razorpay', 'Other']).withMessage('Invalid payment method'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than zero'),
  body('transactionId').optional().trim(),
];

export const profileValidator = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty').trim(),
  body('email').optional().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('phone').optional().notEmpty().withMessage('Phone number cannot be empty').trim(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];
