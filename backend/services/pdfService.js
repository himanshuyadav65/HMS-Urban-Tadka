import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import Payment from '../models/Payment.js';

/**
 * Generate PDF Invoice and pipe to writable stream
 * @param {Object} booking - Populated Booking object
 * @param {Object} invoice - Invoice object
 * @param {NodeJS.WritableStream} stream - Target writable stream (like res or fs.createWriteStream)
 */
export const generateInvoicePDF = async (booking, invoice, stream) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(stream);

  const hotelName = process.env.HOTEL_NAME || 'Urban Tadka';
  const hotelEmail = process.env.HOTEL_EMAIL || 'info@Urban Tadkahotel.com';
  const hotelPhone = process.env.HOTEL_PHONE || '+1 (555) 019-2834';
  const hotelAddress = process.env.HOTEL_ADDRESS || '123 Luxury Way, Paradise Valley, CA 90210';

  // --- Fetch Payments & Prepare Calculations ---
  const bId = booking._id || booking.id;
  let allPayments = [];
  try {
    allPayments = await Payment.find({
      $or: [{ bookingId: bId }, { booking: bId }]
    }).sort({ createdAt: 1 });
  } catch (e) {
    console.error('Failed to load payment details for invoice PDF:', e);
  }

  const completedPayments = allPayments.filter(p => p.paymentStatus === 'Completed');
  const failedPayments = allPayments.filter(p => p.paymentStatus === 'Failed');

  const grandTotal = parseFloat(invoice.total || booking.totalAmount || 0);
  const totalPaidSum = completedPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const totalPaid = Math.min(grandTotal, booking.paidAmount || totalPaidSum || (booking.paymentStatus === 'Paid' ? grandTotal : 0));
  
  const isFailed = booking.paymentStatus === 'Failed' || booking.bookingStatus === 'Failed' || (totalPaid <= 0 && failedPayments.length > 0) || invoice.status === 'Cancelled';

  let advanceAmount = 0;
  let settlementAmount = 0;

  if (!isFailed) {
    if (completedPayments.length > 1) {
      advanceAmount = parseFloat(completedPayments[0].amount) || 0;
      settlementAmount = completedPayments.slice(1).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    } else if (completedPayments.length === 1) {
      if (completedPayments[0].amount < (grandTotal - 1) && !completedPayments[0].transactionId?.startsWith('SETTLE')) {
        advanceAmount = parseFloat(completedPayments[0].amount) || 0;
        settlementAmount = 0;
      } else if (completedPayments[0].transactionId?.startsWith('SETTLE')) {
        settlementAmount = parseFloat(completedPayments[0].amount) || 0;
        advanceAmount = Math.max(0, totalPaid - settlementAmount);
      } else {
        advanceAmount = parseFloat(completedPayments[0].amount) || 0;
        settlementAmount = 0;
      }
    } else {
      advanceAmount = booking.advanceAmount || booking.advancePayment || 0;
      settlementAmount = Math.max(0, totalPaid - advanceAmount);
    }
  }

  const dueAmount = isFailed ? grandTotal : Math.max(0, grandTotal - totalPaid);

  // --- Stay & Extension Details ---
  const isExtended = Boolean(booking.isExtended || booking.originalCheckOut);
  const origCheckOutDate = booking.originalCheckOut ? new Date(booking.originalCheckOut) : null;
  const currentCheckOutDate = new Date(booking.checkOut);
  const extensionNights = parseInt(booking.extensionNights) || 0;
  const initialNights = isExtended && extensionNights > 0 
    ? Math.max(1, (booking.totalDays || 1) - extensionNights) 
    : (booking.totalDays || 1);

  // --- Header ---
  doc
    .fillColor('#1e1b4b') // Dark indigo
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(hotelName, 50, 45, { align: 'left' })
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#64748b') // Slate gray
    .text(hotelAddress, 50, 70)
    .text(`Phone: ${hotelPhone} | Email: ${hotelEmail}`, 50, 85);

  if (isFailed) {
    doc
      .fillColor('#dc2626')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('INVOICE (PAYMENT FAILED)', 300, 45, { align: 'right' })
      .fontSize(8.5)
      .fillColor('#ef4444')
      .text('⚠️ TRANSACTION DECLINED / UNPAID', 300, 72, { align: 'right' })
      .fontSize(9.5)
      .fillColor('#64748b')
      .font('Helvetica')
      .text(`Invoice No: ${invoice.invoiceNumber}`, 300, 88, { align: 'right' })
      .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 300, 102, { align: 'right' })
      .text(`Booking Ref: ${booking.bookingId}`, 300, 116, { align: 'right' });
  } else {
    doc
      .fillColor('#1e1b4b')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('INVOICE', 400, 45, { align: 'right' })
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(`Invoice No: ${invoice.invoiceNumber}`, 400, 75, { align: 'right' })
      .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 400, 90, { align: 'right' })
      .text(`Booking Ref: ${booking.bookingId}`, 400, 105, { align: 'right' });
  }

  // Divider Line
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 132).lineTo(550, 132).stroke();

  // --- Customer & Stay Info ---
  doc
    .fillColor('#1e1b4b')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('BILLED TO (GUEST):', 50, 145)
    .fontSize(9.5)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(booking.customer?.name || 'Guest', 50, 162)
    .text(`Phone: ${booking.customer?.phone || 'N/A'}`, 50, 176)
    .text(`Email: ${booking.customer?.email || 'N/A'}`, 50, 190)
    .text(`Address: ${booking.customer?.address || 'N/A'}`, 50, 204);

  doc
    .fillColor('#1e1b4b')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('STAY RESERVATION DETAILS:', 300, 145)
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#0f172a')
    .text(`Room Number: ${booking.room?.roomNumber || 'N/A'} (${booking.room?.roomType || 'Standard'})`, 300, 162)
    .text(`Check-In Date: ${new Date(booking.checkIn).toLocaleDateString('en-IN')}`, 300, 176);

  if (isExtended && origCheckOutDate) {
    doc
      .fillColor('#64748b')
      .text(`Old Check-Out (Original): ${origCheckOutDate.toLocaleDateString('en-IN')}`, 300, 190)
      .font('Helvetica-Bold')
      .fillColor('#047857')
      .text(`New Check-Out (Extended): ${currentCheckOutDate.toLocaleDateString('en-IN')} (+${extensionNights}N)`, 300, 204)
      .font('Helvetica')
      .fillColor('#0f172a')
      .text(`Total Stay Duration: ${booking.totalDays || 1} Night(s)`, 300, 218);
  } else {
    doc
      .text(`Check-Out Date: ${currentCheckOutDate.toLocaleDateString('en-IN')}`, 300, 190)
      .text(`Total Stay Duration: ${booking.totalDays || 1} Night(s)`, 300, 204);
  }

  // Table Divider Line
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, 238).lineTo(550, 238).stroke();

  // --- Pricing Table ---
  const tableTop = 248;
  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .fillColor('#475569')
    .text('Description', 50, tableTop)
    .text('Tariff Rate', 250, tableTop, { align: 'right', width: 80 })
    .text('Duration', 340, tableTop, { align: 'right', width: 80 })
    .text('Amount', 450, tableTop, { align: 'right', width: 100 });

  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 264).lineTo(550, 264).stroke();

  let itemTop = 274;

  if (isExtended && extensionNights > 0) {
    // Initial Stay line
    const initialSubtotal = initialNights * (booking.pricePerNight || 0);
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#0f172a')
      .text(`Room ${booking.room?.roomNumber || ''} - Initial Reservation Stay`, 50, itemTop)
      .text(`Rs. ${(booking.pricePerNight || 0).toFixed(2)}`, 250, itemTop, { align: 'right', width: 80 })
      .text(`${initialNights} Night(s)`, 340, itemTop, { align: 'right', width: 80 })
      .text(`Rs. ${initialSubtotal.toFixed(2)}`, 450, itemTop, { align: 'right', width: 100 });

    itemTop += 18;

    // Extension Stay line
    const extensionSubtotal = extensionNights * (booking.pricePerNight || 0);
    doc
      .fillColor('#047857')
      .font('Helvetica-Bold')
      .text(`Stay Extension (+${extensionNights} Extra Night${extensionNights > 1 ? 's' : ''})`, 50, itemTop)
      .font('Helvetica')
      .text(`Rs. ${(booking.pricePerNight || 0).toFixed(2)}`, 250, itemTop, { align: 'right', width: 80 })
      .text(`${extensionNights} Night(s)`, 340, itemTop, { align: 'right', width: 80 })
      .text(`Rs. ${extensionSubtotal.toFixed(2)}`, 450, itemTop, { align: 'right', width: 100 });

    itemTop += 16;
  } else {
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#0f172a')
      .text(`Room ${booking.room?.roomNumber || 'Room'} - Accommodation Charges`, 50, itemTop)
      .text(`Rs. ${(booking.pricePerNight || 0).toFixed(2)}`, 250, itemTop, { align: 'right', width: 80 })
      .text(`${booking.totalDays || 1} Night(s)`, 340, itemTop, { align: 'right', width: 80 })
      .text(`Rs. ${(booking.subtotal || 0).toFixed(2)}`, 450, itemTop, { align: 'right', width: 100 });

    itemTop += 20;
  }

  // Divider Line
  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, itemTop).lineTo(550, itemTop).stroke();

  // --- 2-Column Equal Split Layout ---
  const boxTop = itemTop + 12;
  const boxHeight = 168;

  // Left Box: Payment Audit & QR Code (x=50 to x=285)
  doc
    .roundedRect(50, boxTop, 235, boxHeight, 6)
    .fillColor(isFailed ? '#fff5f5' : '#f8fafc')
    .fill()
    .strokeColor(isFailed ? '#fecaca' : '#e2e8f0')
    .lineWidth(1)
    .stroke();

  doc
    .fillColor(isFailed ? '#991b1b' : '#1e1b4b')
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .text(isFailed ? 'FAILED PAYMENT ATTEMPT AUDIT' : 'PAYMENT AUDIT & SETTLEMENT', 62, boxTop + 10, { width: 210 });

  // Generate QR code for left box
  try {
    const qrData = JSON.stringify({
      inv: invoice.invoiceNumber,
      ref: booking.bookingId,
      status: isFailed ? 'PAYMENT_FAILED' : dueAmount <= 0.01 ? 'FULLY_PAID' : 'PARTIALLY_PAID',
      total: grandTotal,
      advance: advanceAmount,
      paid: totalPaid,
      due: dueAmount,
      isExtended: isExtended,
      origCheckOut: origCheckOutDate ? origCheckOutDate.toLocaleDateString('en-IN') : null,
      extendedCheckOut: currentCheckOutDate.toLocaleDateString('en-IN')
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    doc.image(qrCodeDataUrl, 60, boxTop + 26, { width: 66, height: 66 });
  } catch (err) {
    console.error('Failed to generate invoice QR code', err);
  }

  // Ledger summary next to QR code
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#334155');

  if (isFailed) {
    const failedTxn = failedPayments[0] || {};
    const pMethod = failedTxn.paymentMethod || 'Razorpay Gateway';
    const pId = failedTxn.transactionId || 'N/A';
    doc.text('Payment Gateway:', 135, boxTop + 28, { width: 140 });
    doc.font('Helvetica-Bold').fillColor('#dc2626').text(`${pMethod} (DECLINED)`, 135, boxTop + 38, { width: 140 }).font('Helvetica').fillColor('#334155');
    doc.text('Attempted Ref:', 135, boxTop + 52, { width: 140 });
    doc.font('Helvetica-Bold').text(`${pId.slice(0, 16)}`, 135, boxTop + 62, { width: 140 }).font('Helvetica');
    doc.text('Amount: Rs. ' + grandTotal.toFixed(2), 135, boxTop + 76, { width: 140 });
  } else {
    doc.text('Advance Collected:', 135, boxTop + 28, { width: 140 });
    doc.font('Helvetica-Bold').fillColor('#047857').text(`Rs. ${advanceAmount.toFixed(2)}`, 135, boxTop + 38, { width: 140 }).font('Helvetica').fillColor('#334155');
    
    if (isExtended) {
      doc.text('Stay Extension:', 135, boxTop + 50, { width: 140 });
      doc.font('Helvetica-Bold').text(`+${extensionNights} Night(s)`, 135, boxTop + 60, { width: 140 }).font('Helvetica');
    } else {
      doc.text('Settlement Collected:', 135, boxTop + 50, { width: 140 });
      doc.font('Helvetica-Bold').text(`Rs. ${settlementAmount.toFixed(2)}`, 135, boxTop + 60, { width: 140 }).font('Helvetica');
    }
  }

  // Status Badge in Left Box
  const statusY = boxTop + 120;
  const isPaid = !isFailed && dueAmount <= 0.01;
  doc
    .roundedRect(60, statusY, 215, 30, 4)
    .fillColor(isFailed ? '#fef2f2' : isPaid ? '#ecfdf5' : '#fffbeb')
    .fill()
    .strokeColor(isFailed ? '#fca5a5' : isPaid ? '#a7f3d0' : '#fde68a')
    .lineWidth(0.8)
    .stroke();

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(isFailed ? '#dc2626' : isPaid ? '#047857' : '#b45309')
    .text(
      isFailed
        ? 'STATUS: PAYMENT FAILED / UNPAID'
        : isPaid
        ? 'STATUS: FULLY SETTLED & PAID (Rs. 0.00 DUE)'
        : `STATUS: PARTIALLY PAID (Rs. ${dueAmount.toFixed(2)} DUE)`,
      65,
      statusY + 10,
      { width: 205, align: 'center' }
    );

  // Right Box: Financial Summary & Calculations (x=300 to x=550)
  doc
    .roundedRect(300, boxTop, 250, boxHeight, 6)
    .fillColor('#ffffff')
    .fill()
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .stroke();

  let lineY = boxTop + 10;
  const labelX = 312;
  const labelWidth = 125;
  const valX = 440;
  const valWidth = 100;

  // 1. Subtotal
  doc.fontSize(8.5).font('Helvetica').fillColor('#475569')
    .text('Subtotal:', labelX, lineY, { width: labelWidth })
    .text(`Rs. ${(invoice.subtotal || 0).toFixed(2)}`, valX, lineY, { align: 'right', width: valWidth });

  // 2. Tax
  lineY += 13;
  doc.text(`Tax (${process.env.HOTEL_TAX_PERCENT || 18}% GST):`, labelX, lineY, { width: labelWidth })
    .text(`Rs. ${(invoice.tax || 0).toFixed(2)}`, valX, lineY, { align: 'right', width: valWidth });

  // 3. Discount
  lineY += 13;
  doc.text('Discount:', labelX, lineY, { width: labelWidth })
    .text(`-Rs. ${(invoice.discount || 0).toFixed(2)}`, valX, lineY, { align: 'right', width: valWidth });

  // Divider
  lineY += 15;
  doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(312, lineY).lineTo(540, lineY).stroke();

  // 4. Grand Total
  lineY += 5;
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e1b4b')
    .text('Grand Total Amount:', labelX, lineY, { width: labelWidth })
    .text(`Rs. ${grandTotal.toFixed(2)}`, valX, lineY, { align: 'right', width: valWidth });

  // Divider
  lineY += 15;
  doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(312, lineY).lineTo(540, lineY).stroke();

  if (isFailed) {
    // Show Failed lines
    lineY += 5;
    doc.fontSize(8).font('Helvetica').fillColor('#dc2626')
      .text('Payment Attempted:', labelX, lineY, { width: labelWidth })
      .text(`Rs. 0.00 (FAILED)`, valX, lineY, { align: 'right', width: valWidth });

    lineY += 13;
    doc.text('Total Amount Collected:', labelX, lineY, { width: labelWidth })
      .text(`Rs. 0.00`, valX, lineY, { align: 'right', width: valWidth });

    lineY += 14;
    doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(312, lineY).lineTo(540, lineY).stroke();

    lineY += 5;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#dc2626')
      .text('Balance Due (Unpaid):', labelX, lineY, { width: labelWidth })
      .text(`Rs. ${grandTotal.toFixed(2)}`, valX, lineY, { align: 'right', width: valWidth });
  } else {
    // 5. Advance Paid Earlier
    lineY += 5;
    doc.fontSize(8.5).font('Helvetica').fillColor('#047857')
      .text('Advance Paid Earlier:', labelX, lineY, { width: labelWidth })
      .text(`-Rs. ${advanceAmount.toFixed(2)}`, valX, lineY, { align: 'right', width: valWidth });

    // 6. Check-Out Settlement
    lineY += 13;
    doc.fillColor('#475569')
      .text('Check-Out Settlement:', labelX, lineY, { width: labelWidth })
      .text(`Rs. ${settlementAmount.toFixed(2)}`, valX, lineY, { align: 'right', width: valWidth });

    // Divider
    lineY += 15;
    doc.strokeColor('#cbd5e1').lineWidth(0.8).moveTo(312, lineY).lineTo(540, lineY).stroke();

    // 7. Balance Due
    lineY += 5;
    doc.fontSize(9.5).font('Helvetica-Bold').fillColor(dueAmount > 0.01 ? '#dc2626' : '#047857')
      .text('Balance Due at Check-out:', labelX, lineY, { width: labelWidth })
      .text(`Rs. ${dueAmount.toFixed(2)}`, valX, lineY, { align: 'right', width: valWidth });
  }

  // --- Terms & Footer Note ---
  const noteTop = 530;
  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(isFailed ? '#b91c1c' : '#475569')
    .text(
      isFailed
        ? 'NOTICE: Payment for this reservation was NOT completed. Please re-attempt payment at front desk.'
        : 'Thank you for choosing Urban Tadka! We hope you enjoyed your stay.',
      50,
      noteTop,
      { align: 'center' }
    )
    .fontSize(8)
    .fillColor('#94a3b8')
    .text('Please verify all details. For queries, contact info@Urban Tadkahotel.com | +1 (555) 019-2834', 50, noteTop + 14, { align: 'center' });

  doc.end();
};
