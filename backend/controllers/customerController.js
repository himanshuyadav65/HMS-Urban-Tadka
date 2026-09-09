import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';

/**
 * @desc    Create a new customer
 * @route   POST /api/customers
 * @access  Private (Admin / Receptionist)
 */
export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, idType, idNumber } = req.body;

    // Check if phone or email already registered as customer
    const customerExists = await Customer.findOne({
      $or: [{ phone }, { email: email || 'nevermatch_placeholder_email' }]
    });

    if (customerExists) {
      res.statusCode = 400;
      throw new Error(`Customer with phone '${phone}' or email '${email}' already exists`);
    }

    let idProofImage = '';
    if (req.file) {
      idProofImage = `/uploads/${req.file.filename}`;
    }

    const customer = await Customer.create({
      name,
      phone,
      email,
      address,
      governmentId: {
        idType,
        idNumber,
      },
      idProofImage,
    });

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all customers with pagination & filters
 * @route   GET /api/customers
 * @access  Private (Admin / Receptionist)
 */
export const getCustomers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const count = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer by ID
 * @route   GET /api/customers/:id
 * @access  Private (Admin / Receptionist)
 */
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.statusCode = 404;
      throw new Error('Customer not found');
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update customer details
 * @route   PUT /api/customers/:id
 * @access  Private (Admin / Receptionist)
 */
export const updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, idType, idNumber } = req.body;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.statusCode = 404;
      throw new Error('Customer not found');
    }

    // Check unique constraints on update
    if (phone && phone !== customer.phone) {
      const phoneExists = await Customer.findOne({ phone });
      if (phoneExists) {
        res.statusCode = 400;
        throw new Error('Another customer is already registered with this phone number');
      }
      customer.phone = phone;
    }

    if (email && email !== customer.email) {
      const emailExists = await Customer.findOne({ email });
      if (emailExists) {
        res.statusCode = 400;
        throw new Error('Another customer is already registered with this email address');
      }
      customer.email = email;
    }

    if (name) customer.name = name;
    if (address !== undefined) customer.address = address;
    
    if (idType || idNumber) {
      customer.governmentId = {
        idType: idType || customer.governmentId.idType,
        idNumber: idNumber || customer.governmentId.idNumber,
      };
    }

    if (req.file) {
      customer.idProofImage = `/uploads/${req.file.filename}`;
    }

    const updatedCustomer = await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer details updated successfully',
      data: updatedCustomer,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a customer
 * @route   DELETE /api/customers/:id
 * @access  Private (Admin / Receptionist)
 */
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.statusCode = 404;
      throw new Error('Customer not found');
    }

    // Check if there are active bookings or unpaid bookings
    const activeBooking = await Booking.findOne({
      customer: customer._id,
      bookingStatus: { $in: ['Confirmed', 'CheckedIn'] }
    });

    if (activeBooking) {
      res.statusCode = 400;
      throw new Error('Cannot delete customer with active bookings');
    }

    const unpaidBooking = await Booking.findOne({
      customer: customer._id,
      paymentStatus: { $in: ['Unpaid', 'PartiallyPaid'] }
    });

    if (unpaidBooking) {
      res.statusCode = 400;
      throw new Error('Cannot delete customer with unpaid or partially paid bookings');
    }

    await Customer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
