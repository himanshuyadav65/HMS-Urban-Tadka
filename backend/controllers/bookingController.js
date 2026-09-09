import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import { sequelize } from '../config/db.js';
import { checkRoomAvailability, calculateBilling } from '../services/bookingService.js';

import { sendBookingConfirmation, sendBookingCancellation, sendInvoiceEmail } from '../services/emailService.js';

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private (Admin / Receptionist)
 */
export const createBooking = async (req, res, next) => {
  try {
    let { customerId, roomId, checkIn, checkOut, discount = 0 } = req.body;

    // Resolve Customer profile for all user roles
    if (req.user.role === 'Customer') {
      let customerRecord = await Customer.findOne({ email: req.user.email });
      if (!customerRecord) {
        customerRecord = await Customer.create({
          name: req.user.name || 'Guest User',
          email: req.user.email,
          phone: req.user.phone || '0000000000',
          governmentId: {
            idType: 'Aadhaar',
            idNumber: 'PENDING',
          }
        });
      }
      customerId = customerRecord._id;
    } else if (!customerId) {
      let staffCustomer = await Customer.findOne({ email: req.user.email });
      if (!staffCustomer) {
        staffCustomer = await Customer.create({
          name: req.user.name || 'Staff User',
          email: req.user.email,
          phone: req.user.phone || '0000000000',
          governmentId: {
            idType: 'Aadhaar',
            idNumber: 'STAFF',
          }
        });
      }
      customerId = staffCustomer._id;
    }

    // Verify Customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      res.statusCode = 404;
      throw new Error('Customer profile not found');
    }

    // Verify Room
    const room = await Room.findById(roomId);
    if (!room) {
      res.statusCode = 404;
      throw new Error('Room not found');
    }

    // Validate Room availability (No double bookings)
    const isAvailable = await checkRoomAvailability(roomId, checkIn, checkOut);
    if (!isAvailable) {
      res.statusCode = 400;
      throw new Error('This room is already booked for these dates');
    }

    // Run billing calculation
    const taxPercent = parseFloat(process.env.HOTEL_TAX_PERCENT || '18');
    const billing = calculateBilling(room.pricePerNight, checkIn, checkOut, parseFloat(discount), taxPercent);

    const isStaff = ['Admin', 'Receptionist', 'Owner', 'Manager', 'SuperAdmin'].includes(req.user.role);

    // Save booking
    const booking = await Booking.create({
      customer: customerId,
      room: roomId,
      checkIn,
      checkOut,
      totalDays: billing.totalDays,
      pricePerNight: billing.pricePerNight,
      subtotal: billing.subtotal,
      tax: billing.tax,
      discount: billing.discount,
      totalAmount: billing.totalAmount,
      bookingStatus: isStaff ? 'Confirmed' : 'Pending',
      paymentStatus: isStaff ? 'Paid' : 'Unpaid',
    });

    let invoice = null;

    if (isStaff) {
      // Mark room status as Booked for staff bookings
      room.status = 'Booked';
      await room.save();

      // Create Invoice for staff bookings
      invoice = await Invoice.create({
        booking: booking._id,
        subtotal: billing.subtotal,
        tax: billing.tax,
        discount: billing.discount,
        total: billing.totalAmount,
      });

      // Send notifications for staff bookings
      const populatedBooking = await booking.populate(['customer', 'room']);
      try {
        await sendBookingConfirmation(populatedBooking, customer, room);
        await sendInvoiceEmail(invoice, populatedBooking, customer);
      } catch (err) {
        console.error('Failed to send confirmation emails:', err);
      }
    }

    res.status(201).json({
      success: true,
      message: isStaff ? 'Booking created successfully' : 'Booking initiated. Please complete payment.',
      data: {
        booking,
        invoice,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get bookings with search and filters
 * @route   GET /api/bookings
 * @access  Private (Admin / Receptionist)
 */
export const getBookings = async (req, res, next) => {
  try {
    const { status, paymentStatus, checkIn, checkOut, customerName, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status) {
      query.bookingStatus = status;
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    if (checkIn) {
      query.checkIn = { $gte: new Date(checkIn) };
    }
    if (checkOut) {
      query.checkOut = { $lte: new Date(checkOut) };
    }

    // If Customer role, only return their own bookings
    if (req.user.role === 'Customer') {
      const customer = await Customer.findOne({ email: req.user.email });
      if (!customer) {
        return res.status(200).json({
          success: true,
          count: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          data: [],
        });
      }
      query.customer = customer._id;
    } else {
      let customerIds = [];
      if (customerName) {
        const customers = await Customer.find({ name: { $regex: customerName, $options: 'i' } });
        customerIds = customers.map(c => c._id);
        query.customer = { $in: customerIds };
      }
    }

    const count = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('customer')
      .populate('room')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private
 */
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer')
      .populate('room');

    if (!booking) {
      res.statusCode = 404;
      throw new Error('Booking not found');
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel booking
 * @route   POST /api/bookings/:id/cancel
 * @access  Private (Admin / Receptionist)
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate(['customer', 'room']);
    if (!booking) {
      res.statusCode = 404;
      throw new Error('Booking not found');
    }

    // If Customer role, ensure they only cancel their own booking
    if (req.user.role === 'Customer' && booking.customer.email !== req.user.email) {
      res.statusCode = 403;
      throw new Error('You are not authorized to cancel this booking');
    }

    if (booking.bookingStatus === 'Cancelled') {
      res.statusCode = 400;
      throw new Error('Booking is already cancelled');
    }

    if (booking.bookingStatus === 'CheckedOut') {
      res.statusCode = 400;
      throw new Error('Cannot cancel a booking that has checked out');
    }

    booking.bookingStatus = 'Cancelled';
    await booking.save();

    // Mark room available
    const room = await Room.findById(booking.room._id);
    if (room) {
      room.status = 'Available';
      await room.save();
    }

    // Send cancellation notice
    await sendBookingCancellation(booking, booking.customer, booking.room);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Discard / Delete an unconfirmed pending booking (e.g. user exited Razorpay modal before completing payment)
 * @route   DELETE /api/bookings/:id
 * @access  Private
 */
export const discardBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(200).json({ success: true, message: 'Booking already discarded' });
    }

    const bId = booking._id || booking.id;

    // Free the room back to Available if it was tied to this unconfirmed booking
    const rId = booking.room?._id || booking.room || booking.roomId;
    if (rId) {
      const room = await Room.findById(rId);
      if (room && room.status === 'Booked') {
        room.status = 'Available';
        await room.save();
      }
    }

    // Safely delete children first, then the booking
    try {
      await sequelize.query(`DELETE FROM Invoices WHERE bookingId = ?`, { replacements: [bId] });
      await sequelize.query(`DELETE FROM Payments WHERE bookingId = ? AND paymentStatus = 'Pending'`, { replacements: [bId] });
      await sequelize.query(`DELETE FROM Bookings WHERE id = ?`, { replacements: [bId] });
    } catch (sqlErr) {
      // Fallback via model destroy
      await Booking.findByIdAndDelete(bId);
    }


    res.status(200).json({
      success: true,
      message: 'Unconfirmed booking discarded and room released'
    });
  } catch (error) {
    next(error);
  }
};



/**
 * @desc    Check-in Customer
 * @route   POST /api/bookings/:id/checkin
 * @access  Private (Admin / Receptionist)
 */
export const checkIn = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.statusCode = 404;
      throw new Error('Booking not found');
    }

    if (!['Confirmed', 'Pending'].includes(booking.bookingStatus)) {
      res.statusCode = 400;
      throw new Error(`Cannot check-in booking in '${booking.bookingStatus}' status`);
    }

    const advanceAmount = parseFloat(req.body.advanceAmount || req.body.paymentAmount || 0);
    const paymentMethod = req.body.paymentMethod || 'Cash';

    if (advanceAmount > 0) {
      await Payment.create({
        booking: booking._id,
        customer: booking.customer._id || booking.customer,
        paymentMethod,
        amount: advanceAmount,
        transactionId: `ADV-${Math.floor(10000000 + Math.random() * 90000000)}`,
        paymentStatus: 'Completed',
      });

      const currentPaid = (booking.paidAmount || 0) + advanceAmount;
      booking.advanceAmount = (booking.advanceAmount || 0) + advanceAmount;
      booking.paidAmount = currentPaid;

      if (currentPaid >= booking.totalAmount) {
        booking.paymentStatus = 'Paid';
      } else {
        booking.paymentStatus = 'PartiallyPaid';
      }
    }

    booking.bookingStatus = 'CheckedIn';
    await booking.save();

    // Mark room status as Occupied
    const room = await Room.findById(booking.room._id || booking.room);
    if (room) {
      room.status = 'Occupied';
      await room.save();
    }

    // Ensure Invoice exists
    let invoice = await Invoice.findOne({ booking: booking._id });
    if (!invoice) {
      invoice = await Invoice.create({
        booking: booking._id,
        subtotal: booking.subtotal,
        tax: booking.tax,
        discount: booking.discount,
        total: booking.totalAmount,
      });
    }

    res.status(200).json({
      success: true,
      message: `Customer checked in successfully. Room set to Occupied.${advanceAmount > 0 ? ` Advance of Rs. ${advanceAmount} registered.` : ''}`,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check-out Customer
 * @route   POST /api/bookings/:id/checkout
 * @access  Private (Admin / Receptionist)
 */
export const checkOut = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.statusCode = 404;
      throw new Error('Booking not found');
    }

    if (booking.bookingStatus !== 'CheckedIn') {
      res.statusCode = 400;
      throw new Error('Customer is not checked in');
    }

    const settlementAmount = parseFloat(req.body.settlementAmount || req.body.paymentAmount || 0);
    const paymentMethod = req.body.paymentMethod || 'Cash';

    if (settlementAmount > 0) {
      await Payment.create({
        booking: booking._id,
        customer: booking.customer._id || booking.customer,
        paymentMethod,
        amount: settlementAmount,
        transactionId: `SETTLE-${Math.floor(10000000 + Math.random() * 90000000)}`,
        paymentStatus: 'Completed',
      });

      const currentPaid = Math.min(booking.totalAmount, (booking.paidAmount || 0) + settlementAmount);
      booking.paidAmount = currentPaid;
    }

    if ((booking.paidAmount || 0) >= booking.totalAmount) {
      booking.paymentStatus = 'Paid';
    } else if ((booking.paidAmount || 0) > 0) {
      booking.paymentStatus = 'PartiallyPaid';
    }

    booking.bookingStatus = 'CheckedOut';
    await booking.save();

    // Make room Available
    const room = await Room.findById(booking.room._id || booking.room);
    if (room) {
      room.status = 'Available';
      await room.save();
    }

    // Ensure Invoice exists
    let invoice = await Invoice.findOne({ booking: booking._id });
    if (!invoice) {
      invoice = await Invoice.create({
        booking: booking._id,
        subtotal: booking.subtotal,
        tax: booking.tax,
        discount: booking.discount,
        total: booking.totalAmount,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer checked out successfully. Room status set to Available.',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Preview price and availability for extending a stay
 * @route   POST /api/bookings/:id/preview-extension
 * @access  Private (Customer / Receptionist / Admin / Owner)
 */
export const previewExtendStay = async (req, res, next) => {
  try {
    const { newCheckOutDate, additionalDays } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId).populate(['customer', 'room']);
    if (!booking) {
      res.statusCode = 404;
      throw new Error('Booking not found');
    }

    if (['Cancelled', 'CheckedOut'].includes(booking.bookingStatus)) {
      res.statusCode = 400;
      throw new Error(`Cannot extend a booking in '${booking.bookingStatus}' status`);
    }

    const currentCheckOut = new Date(booking.checkOut);
    let targetCheckOut;

    if (newCheckOutDate) {
      targetCheckOut = new Date(newCheckOutDate);
    } else if (additionalDays && parseInt(additionalDays) > 0) {
      targetCheckOut = new Date(currentCheckOut.getTime() + parseInt(additionalDays) * 24 * 60 * 60 * 1000);
    } else {
      res.statusCode = 400;
      throw new Error('Please provide either a new checkout date or number of additional days');
    }

    if (isNaN(targetCheckOut.getTime())) {
      res.statusCode = 400;
      throw new Error('Invalid new check-out date');
    }

    if (targetCheckOut <= currentCheckOut) {
      res.statusCode = 400;
      throw new Error('New check-out date must be after current check-out date');
    }

    const targetRoomId = booking.room?._id || booking.roomId;
    const isAvailable = await checkRoomAvailability(targetRoomId, currentCheckOut, targetCheckOut, booking._id);

    const taxPercent = parseFloat(process.env.HOTEL_TAX_PERCENT || '18');
    const newBilling = calculateBilling(booking.pricePerNight, booking.checkIn, targetCheckOut, booking.discount || 0, taxPercent);

    const addedDays = newBilling.totalDays - booking.totalDays;
    const extraSubtotal = Math.max(0, newBilling.subtotal - booking.subtotal);
    const extraTax = Math.max(0, newBilling.tax - booking.tax);
    const additionalAmount = Math.max(0, newBilling.totalAmount - booking.totalAmount);

    res.status(200).json({
      success: true,
      data: {
        isAvailable,
        currentCheckOut,
        newCheckOut: targetCheckOut,
        addedDays,
        pricePerNight: booking.pricePerNight,
        extraSubtotal,
        extraTax,
        additionalAmount,
        newTotalAmount: newBilling.totalAmount,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Extend stay for an active or confirmed booking
 * @route   POST /api/bookings/:id/extend
 * @access  Private (Customer / Receptionist / Admin / Owner)
 */
export const extendStay = async (req, res, next) => {
  try {
    const { newCheckOutDate, additionalDays, paymentOption = 'AddToFolio' } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId).populate(['customer', 'room']);
    if (!booking) {
      res.statusCode = 404;
      throw new Error('Booking not found');
    }

    if (['Cancelled', 'CheckedOut'].includes(booking.bookingStatus)) {
      res.statusCode = 400;
      throw new Error(`Cannot extend a booking in '${booking.bookingStatus}' status`);
    }

    // Customer role authorization check
    if (req.user?.role === 'Customer') {
      const customer = await Customer.findOne({ email: req.user.email });
      const bookingCustId = booking.customer?._id || booking.customer?.id || booking.customerId;
      const bookingCustEmail = booking.customer?.email;
      const isAuthorized = (customer && (String(customer._id || customer.id) === String(bookingCustId))) || (bookingCustEmail && bookingCustEmail === req.user.email);
      if (!isAuthorized) {
        res.statusCode = 403;
        throw new Error('You are not authorized to extend this booking');
      }
    }

    const currentCheckOut = new Date(booking.checkOut);
    let targetCheckOut;

    if (newCheckOutDate) {
      targetCheckOut = new Date(newCheckOutDate);
    } else if (additionalDays && parseInt(additionalDays) > 0) {
      targetCheckOut = new Date(currentCheckOut.getTime() + parseInt(additionalDays) * 24 * 60 * 60 * 1000);
    } else {
      res.statusCode = 400;
      throw new Error('Please provide either a new checkout date or number of additional days');
    }

    if (isNaN(targetCheckOut.getTime())) {
      res.statusCode = 400;
      throw new Error('Invalid new check-out date');
    }

    if (targetCheckOut <= currentCheckOut) {
      res.statusCode = 400;
      throw new Error('New check-out date must be after current check-out date');
    }

    const targetRoomId = booking.room?._id || booking.roomId;

    // Check room availability for extended period
    const isAvailable = await checkRoomAvailability(targetRoomId, currentCheckOut, targetCheckOut, booking._id);
    if (!isAvailable) {
      res.statusCode = 400;
      throw new Error(`Room ${booking.room?.roomNumber || ''} is not available for the requested extension dates. Another guest has booked this room.`);
    }

    // Recalculate billing
    const taxPercent = parseFloat(process.env.HOTEL_TAX_PERCENT || '18');
    const newBilling = calculateBilling(booking.pricePerNight, booking.checkIn, targetCheckOut, booking.discount || 0, taxPercent);

    const oldTotal = booking.totalAmount;
    const additionalAmount = Math.max(0, newBilling.totalAmount - oldTotal);
    const addedDays = newBilling.totalDays - booking.totalDays;

    // Preserve original check-out date if this is first extension
    if (!booking.originalCheckOut) {
      booking.originalCheckOut = currentCheckOut;
    }
    booking.isExtended = true;
    booking.extensionNights = (booking.extensionNights || 0) + addedDays;
    booking.extensionAmount = (booking.extensionAmount || 0) + additionalAmount;

    // Update booking
    booking.checkOut = targetCheckOut;
    booking.totalDays = newBilling.totalDays;
    booking.subtotal = newBilling.subtotal;
    booking.tax = newBilling.tax;
    booking.totalAmount = newBilling.totalAmount;

    if ((booking.paidAmount || 0) < newBilling.totalAmount) {
      if ((booking.paidAmount || 0) > 0) {
        booking.paymentStatus = 'PartiallyPaid';
      } else {
        booking.paymentStatus = 'Unpaid';
      }
    }

    await booking.save();

    // Update Invoice
    const invoice = await Invoice.findOne({ booking: booking._id });
    if (invoice) {
      invoice.subtotal = booking.subtotal;
      invoice.tax = booking.tax;
      invoice.discount = booking.discount;
      invoice.total = booking.totalAmount;
      await invoice.save();
    } else {
      await Invoice.create({
        booking: booking._id,
        subtotal: booking.subtotal,
        tax: booking.tax,
        discount: booking.discount,
        total: booking.totalAmount,
      });
    }

    res.status(200).json({
      success: true,
      message: `Stay extended by ${addedDays} night(s) until ${targetCheckOut.toLocaleDateString()}. Additional charge of Rs. ${additionalAmount} added.`,
      data: {
        booking,
        extendedDays: addedDays,
        additionalAmount,
        newCheckOut: targetCheckOut,
        newTotal: booking.totalAmount,
      }
    });
  } catch (error) {
    next(error);
  }
};

