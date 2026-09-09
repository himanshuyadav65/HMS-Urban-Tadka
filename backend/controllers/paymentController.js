import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Room from '../models/Room.js';
import { sendPaymentSuccess, sendBookingConfirmation, sendInvoiceEmail } from '../services/emailService.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import crypto from 'crypto';
import Razorpay from 'razorpay';

/**
 * @desc    Process a new payment
 * @route   POST /api/payments
 * @access  Private (Admin / Receptionist)
 */
export const createPayment = async (req, res, next) => {
  try {
    const { bookingId, paymentMethod, amount, transactionId } = req.body;

    const booking = await Booking.findById(bookingId).populate(['customer', 'room']);
    if (!booking) {
      res.statusCode = 404;
      throw new Error('Booking not found');
    }

    // Get previous payments for this booking
    const pastPayments = await Payment.find({ booking: bookingId, paymentStatus: 'Completed' });
    const totalPaidBefore = pastPayments.reduce((sum, p) => sum + p.amount, 0);

    const targetAmount = booking.totalAmount;
    const currentTotalPaid = totalPaidBefore + parseFloat(amount);

    // Create payment record
    const payment = await Payment.create({
      booking: bookingId,
      customer: booking.customer._id,
      paymentMethod,
      amount: parseFloat(amount),
      transactionId: transactionId || `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
      paymentStatus: 'Completed',
    });

    // Update booking payment status
    if (currentTotalPaid >= targetAmount) {
      booking.paymentStatus = 'Paid';
      if (booking.bookingStatus === 'Pending') {
        booking.bookingStatus = 'Confirmed';
      }
    } else if (currentTotalPaid > 0) {
      booking.paymentStatus = 'PartiallyPaid';
    } else {
      booking.paymentStatus = 'Unpaid';
    }
    await booking.save();

    // Ensure Invoice exists for confirmed/paid booking
    if (booking.paymentStatus === 'Paid' || booking.bookingStatus === 'Confirmed') {
      const existingInv = await Invoice.findOne({ booking: booking._id });
      if (!existingInv) {
        await Invoice.create({
          booking: booking._id,
          subtotal: booking.subtotal,
          tax: booking.tax,
          discount: booking.discount,
          total: booking.totalAmount,
        });
      }
    }

    // Send confirmation email
    await sendPaymentSuccess(payment, booking, booking.customer);

    res.status(201).json({
      success: true,
      message: 'Payment registered successfully',
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payments history
 * @route   GET /api/payments
 * @access  Private (Admin / Receptionist)
 */
export const getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    let query = {};
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
    }

    const count = await Payment.countDocuments(query);
    const payments = await Payment.find(query)
      .populate({
        path: 'booking',
        populate: ['room', 'customer']
      })
      .populate('customer')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    const enrichedPayments = await Promise.all(payments.map(async (p) => {
      const pObj = typeof p.toJSON === 'function' ? p.toJSON() : { ...p };
      
      // Ensure booking and room details are populated
      let b = pObj.booking;
      if (pObj.bookingId && (!b || typeof b !== 'object')) {
        const bFound = await Booking.findById(pObj.bookingId).populate(['room', 'customer']);
        if (bFound) {
          b = typeof bFound.toJSON === 'function' ? bFound.toJSON() : bFound;
          pObj.booking = b;
        }
      }

      if (b && b.roomId && (!b.room || typeof b.room !== 'object')) {
        const r = await Room.findById(b.roomId);
        if (r) {
          b.room = typeof r.toJSON === 'function' ? r.toJSON() : r;
          pObj.booking.room = b.room;
        }
      }

      if (b && b.room && typeof b.room === 'string') {
        const r = await Room.findById(b.room);
        if (r) {
          b.room = typeof r.toJSON === 'function' ? r.toJSON() : r;
          pObj.booking.room = b.room;
        }
      }

      const bTotal = b?.totalAmount || 0;
      const bId = b?._id || b?.id || pObj.bookingId;

      let paymentType = 'Full';
      let advancePaidPrior = 0;
      let balanceDueAfterThisPayment = Math.max(0, bTotal - (parseFloat(pObj.amount) || 0));

      if (bId) {
        try {
          const allPayments = await Payment.find({
            $or: [{ bookingId: bId }, { booking: bId }],
            paymentStatus: 'Completed'
          }).sort({ createdAt: 1 });

          if (allPayments && allPayments.length > 0) {
            const currentId = (pObj.id || pObj._id || '').toString();
            const currentIndex = allPayments.findIndex(item => (item.id || item._id || '').toString() === currentId);

            if (currentIndex !== -1) {
              // Sum payments made chronologically before this payment
              const priorPayments = allPayments.slice(0, currentIndex);
              advancePaidPrior = priorPayments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

              // Cumulative paid including this payment
              const paidUpToThis = advancePaidPrior + (parseFloat(pObj.amount) || 0);
              balanceDueAfterThisPayment = Math.max(0, bTotal - paidUpToThis);

              if (balanceDueAfterThisPayment > 0.5) {
                paymentType = 'Advance';
              } else if (advancePaidPrior > 0.5 || pObj.transactionId?.startsWith('SETTLE')) {
                paymentType = 'Settlement';
              } else {
                paymentType = 'Full';
              }
            } else if (pObj.amount < (bTotal - 1) && !pObj.transactionId?.startsWith('SETTLE')) {
              paymentType = 'Advance';
              balanceDueAfterThisPayment = Math.max(0, bTotal - (parseFloat(pObj.amount) || 0));
            }
          }
        } catch (e) {
          // ignore
        }
      }

      pObj.paymentType = paymentType;
      pObj.bookingTotalAmount = bTotal;
      pObj.advancePaidPrior = advancePaidPrior;
      pObj.balanceDue = balanceDueAfterThisPayment;

      return pObj;
    }));

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: enrichedPayments,
    });
  } catch (error) {
    next(error);
  }
};




/**
 * @desc    Generate and download invoice PDF
 * @route   GET /api/invoices/:id/download
 * @access  Private (Admin / Receptionist / Customer)
 */
export const downloadInvoicePdf = async (req, res, next) => {
  try {
    let invoice = await Invoice.findById(req.params.id);

    // If not found by invoice ID, check if req.params.id is a booking ID
    if (!invoice) {
      invoice = await Invoice.findOne({ $or: [{ booking: req.params.id }, { bookingId: req.params.id }] });
    }

    // If not found, check if req.params.id is a Payment ID
    if (!invoice) {
      const pFound = await Payment.findById(req.params.id);
      if (pFound && (pFound.bookingId || pFound.booking)) {
        const bId = pFound.bookingId || pFound.booking;
        invoice = await Invoice.findOne({ $or: [{ booking: bId }, { bookingId: bId }] });
        if (!invoice) {
          const bookingForInvoice = await Booking.findById(bId);
          if (bookingForInvoice) {
            invoice = await Invoice.create({
              booking: bookingForInvoice._id || bookingForInvoice.id,
              subtotal: bookingForInvoice.subtotal,
              tax: bookingForInvoice.tax,
              discount: bookingForInvoice.discount,
              total: bookingForInvoice.totalAmount,
            });
          }
        }
      }
    }

    // If still not found, check if a booking exists and create invoice on the fly
    if (!invoice) {
      const bookingForInvoice = await Booking.findById(req.params.id);
      if (bookingForInvoice) {
        invoice = await Invoice.create({
          booking: bookingForInvoice._id || bookingForInvoice.id,
          subtotal: bookingForInvoice.subtotal,
          tax: bookingForInvoice.tax,
          discount: bookingForInvoice.discount,
          total: bookingForInvoice.totalAmount,
        });
      }
    }

    if (!invoice) {
      res.statusCode = 404;
      throw new Error('Invoice not found');
    }

    const booking = await Booking.findById(invoice.booking || invoice.bookingId)
      .populate('customer')
      .populate('room');

    if (!booking) {
      res.statusCode = 404;
      throw new Error('Booking linked to this invoice was not found');
    }


    // Authorize Customer role to only download their own invoice
    if (req.user.role === 'Customer' && req.user.email !== booking.customer?.email) {
      res.statusCode = 403;
      throw new Error('Not authorized to download other guest invoices');
    }

    // Set Response Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

    // Stream PDF directly to client
    await generateInvoicePDF(booking, invoice, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all invoices
 * @route   GET /api/invoices
 * @access  Private (Admin / Receptionist / Customer)
 */
export const getInvoices = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;

    // Auto-create invoices for any active/confirmed/paid bookings missing an invoice record
    const eligibleBookings = await Booking.find({});
    for (const b of eligibleBookings) {
      const invExists = await Invoice.findOne({ booking: b._id });
      if (!invExists) {
        try {
          await Invoice.create({
            booking: b._id,
            subtotal: b.subtotal,
            tax: b.tax,
            discount: b.discount,
            total: b.totalAmount,
          });
        } catch (e) {
          // ignore creation errors
        }
      }
    }

    let query = {};
    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }

    // If Customer role, only return invoices associated with their bookings
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

      const customerBookings = await Booking.find({ customer: customer._id });
      const bookingIds = customerBookings.map(b => b._id);
      query.booking = { $in: bookingIds };
    }

    const count = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate({
        path: 'booking',
        populate: ['customer', 'room']
      })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create Razorpay Order
 * @route   POST /api/payments/razorpay/order
 * @access  Private (Customer / Admin / Receptionist)
 */
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { bookingId, advanceAmount } = req.body;
    const booking = await Booking.findById(bookingId).populate(['customer', 'room']);
    if (!booking) {
      res.statusCode = 404;
      throw new Error('Booking not found');
    }

    const payAmount = (advanceAmount && parseFloat(advanceAmount) > 0)
      ? Math.min(booking.totalAmount, parseFloat(advanceAmount))
      : booking.totalAmount;

    const amountInPaise = Math.round(payAmount * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      res.statusCode = 500;
      throw new Error('Razorpay API keys are not configured on the server. Please check .env settings.');
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const safeReceipt = `rcpt_${(booking.bookingId || booking._id.toString()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 30)}`;

    const orderOptions = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: safeReceipt,
      notes: {
        bookingId: booking._id.toString(),
        bookingNumber: booking.bookingId || '',
        customerEmail: booking.customer?.email || req.user?.email || '',
        customerName: booking.customer?.name || req.user?.name || '',
      }
    };

    const order = await razorpay.orders.create(orderOptions);

    res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: keyId,
        isMock: false,
        payAmount: payAmount,
        bookingId: booking._id
      }
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    next(error);
  }
};

/**
 * @desc    Verify Razorpay Payment
 * @route   POST /api/payments/razorpay/verify
 * @access  Private (Customer / Admin / Receptionist)
 */
export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { 
      bookingId, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      status, 
      advanceAmount, 
      paidAmount 
    } = req.body;

    const booking = await Booking.findById(bookingId).populate(['customer', 'room']);
    if (!booking) {
      res.statusCode = 404;
      throw new Error('Booking not found');
    }

    if (status === 'failed') {
      booking.bookingStatus = 'Pending';
      booking.paymentStatus = 'Failed';
      await booking.save();

      await Payment.create({
        booking: booking._id,
        customer: booking.customer?._id || booking.customerId,
        paymentMethod: 'Razorpay',
        amount: booking.totalAmount,
        paymentId: razorpay_payment_id || '',
        transactionId: razorpay_order_id || '',
        paymentStatus: 'Failed',
        paidAt: new Date()
      });

      return res.status(200).json({
        success: false,
        message: 'Payment was marked as failed'
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      res.statusCode = 500;
      throw new Error('Razorpay secret is not configured on the server.');
    }

    // Verify HMAC-SHA256 signature
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      res.statusCode = 400;
      throw new Error('Invalid Razorpay signature. Payment verification failed.');
    }

    const actualPaid = parseFloat(advanceAmount || paidAmount || booking.totalAmount);
    booking.advanceAmount = actualPaid;
    booking.paidAmount = actualPaid;

    if (actualPaid >= booking.totalAmount) {
      booking.paymentStatus = 'Paid';
    } else {
      booking.paymentStatus = 'PartiallyPaid';
    }

    // Mark booking as Confirmed
    booking.bookingStatus = 'Confirmed';
    await booking.save();

    // Mark room status as Booked
    if (booking.room) {
      const room = await Room.findById(booking.room._id || booking.roomId);
      if (room) {
        room.status = 'Booked';
        await room.save();
      }
    }

    // Create payment record
    const payment = await Payment.create({
      booking: booking._id,
      customer: booking.customer?._id || booking.customerId,
      paymentMethod: 'Razorpay',
      amount: actualPaid,
      paymentId: razorpay_payment_id,
      transactionId: razorpay_order_id,
      paymentStatus: 'Completed',
      paidAt: new Date()
    });

    // Create or update Invoice
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

    // Send notifications asynchronously
    try {
      if (booking.customer) {
        await sendPaymentSuccess(payment, booking, booking.customer);
        if (booking.room) {
          await sendBookingConfirmation(booking, booking.customer, booking.room);
        }
        await sendInvoiceEmail(invoice, booking, booking.customer);
      }
    } catch (emailErr) {
      console.error('Failed to send confirmation emails:', emailErr);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully',
      data: {
        booking,
        payment,
        invoice
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Razorpay Webhook Handler
 * @route   POST /api/payments/razorpay/webhook
 * @access  Public (Called directly by Razorpay servers)
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature if secret is provided
    if (webhookSecret) {
      if (!signature) {
        console.error('Razorpay Webhook received without x-razorpay-signature header');
        return res.status(400).json({ success: false, message: 'Missing signature header' });
      }

      const bodyPayload = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyPayload)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.error('Invalid Razorpay Webhook signature');
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    }

    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[Razorpay Webhook] Received event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const orderEntity = payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;
      const amountInRupees = paymentEntity ? paymentEntity.amount / 100 : (orderEntity ? orderEntity.amount_paid / 100 : 0);
      const bookingId = paymentEntity?.notes?.bookingId || orderEntity?.notes?.bookingId;

      let booking = null;
      if (bookingId) {
        booking = await Booking.findById(bookingId).populate(['customer', 'room']);
      }

      if (!booking && paymentEntity?.notes?.bookingNumber) {
        booking = await Booking.findOne({ bookingId: paymentEntity.notes.bookingNumber }).populate(['customer', 'room']);
      }

      if (booking) {
        const actualPaid = amountInRupees || booking.totalAmount;
        booking.paidAmount = actualPaid;
        booking.advanceAmount = actualPaid;

        if (actualPaid >= booking.totalAmount) {
          booking.paymentStatus = 'Paid';
        } else {
          booking.paymentStatus = 'PartiallyPaid';
        }

        booking.bookingStatus = 'Confirmed';
        await booking.save();

        if (booking.room) {
          const room = await Room.findById(booking.room._id || booking.roomId);
          if (room) {
            room.status = 'Booked';
            await room.save();
          }
        }

        // Check if payment entry already exists
        const existingPayment = paymentId ? await Payment.findOne({ paymentId }) : null;
        let paymentRecord = existingPayment;

        if (!existingPayment) {
          paymentRecord = await Payment.create({
            booking: booking._id,
            customer: booking.customer?._id || booking.customerId,
            paymentMethod: 'Razorpay',
            amount: actualPaid,
            paymentId: paymentId || '',
            transactionId: orderId || '',
            paymentStatus: 'Completed',
            paidAt: new Date()
          });
        }

        // Check or create Invoice
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

        try {
          if (booking.customer && paymentRecord) {
            await sendPaymentSuccess(paymentRecord, booking, booking.customer);
            if (booking.room) {
              await sendBookingConfirmation(booking, booking.customer, booking.room);
            }
            if (invoice) {
              await sendInvoiceEmail(invoice, booking, booking.customer);
            }
          }
        } catch (mailErr) {
          console.error('[Razorpay Webhook] Email notification error:', mailErr);
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload?.payment?.entity;
      const bookingId = paymentEntity?.notes?.bookingId;
      if (bookingId) {
        const booking = await Booking.findById(bookingId);
        if (booking && booking.paymentStatus !== 'Paid') {
          booking.paymentStatus = 'Failed';
          await booking.save();
        }
      }
    } else if (event === 'refund.processed') {
      const refundEntity = payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      if (paymentId) {
        const payment = await Payment.findOne({ paymentId });
        if (payment) {
          payment.paymentStatus = 'Refunded';
          payment.refundStatus = 'Processed';
          await payment.save();
        }
      }
    }

    return res.status(200).json({ status: 'ok', event });
  } catch (error) {
    console.error('[Razorpay Webhook Error]:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

