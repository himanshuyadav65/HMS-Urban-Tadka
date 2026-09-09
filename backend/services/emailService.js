import nodemailer from 'nodemailer';

// Helper to create transporter
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Fallback if SMTP info is missing
  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Send an email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML message body
 * @returns {Promise<boolean>} Resolves to true when handled
 */
export const sendEmail = async (to, subject, html) => {
  const from = process.env.SMTP_FROM || 'noreply@Urban Tadkahotel.com';
  const transporter = getTransporter();

  if (!to) {
    console.log(`[Email Service] No recipient email specified. Skipping mail.`);
    return true;
  }

  if (!transporter) {
    console.log(`
=========================================
[EMAIL MOCK LOGGER]
From: ${from}
To: ${to}
Subject: ${subject}
Content: 
${html.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n')}
=========================================
`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`[Email Service] Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email Service] Error sending email: ${error.message}`);
    return false;
  }
};

/**
 * Send booking confirmation email
 */
export const sendBookingConfirmation = async (booking, customer, room) => {
  const subject = `Booking Confirmed - ${booking.bookingId}`;
  const html = `
    <h2>Dear ${customer.name},</h2>
    <p>Thank you for choosing Urban Tadka! We are pleased to confirm your booking.</p>
    <h3>Booking Details:</h3>
    <ul>
      <li><strong>Booking Reference:</strong> ${booking.bookingId}</li>
      <li><strong>Room Number:</strong> ${room.roomNumber} (${room.roomType})</li>
      <li><strong>Check-In Date:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</li>
      <li><strong>Check-Out Date:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</li>
      <li><strong>Total Nights:</strong> ${booking.totalDays}</li>
      <li><strong>Total Cost:</strong> Rs. ${booking.totalAmount.toFixed(2)}</li>
    </ul>
    <p>If you need to make any changes or have questions, feel free to contact us.</p>
    <p>Best regards,<br/>Urban Tadka Management</p>
  `;
  return await sendEmail(customer.email, subject, html);
};

/**
 * Send booking cancellation email
 */
export const sendBookingCancellation = async (booking, customer, room) => {
  const subject = `Booking Cancelled - ${booking.bookingId}`;
  const html = `
    <h2>Dear ${customer.name},</h2>
    <p>Your booking with reference <strong>${booking.bookingId}</strong> has been cancelled.</p>
    <p><strong>Room details:</strong> Room ${room.roomNumber} (${room.roomType})</p>
    <p>If you did not request this cancellation or have questions, please reach out to our desk immediately.</p>
    <p>Best regards,<br/>Urban Tadka Management</p>
  `;
  return await sendEmail(customer.email, subject, html);
};

/**
 * Send payment success email
 */
export const sendPaymentSuccess = async (payment, booking, customer) => {
  const subject = `Payment Successful - Ref: ${booking.bookingId}`;
  const html = `
    <h2>Dear ${customer.name},</h2>
    <p>We have successfully processed your payment of <strong>Rs. ${payment.amount.toFixed(2)}</strong> via ${payment.paymentMethod}.</p>
    <h3>Payment Summary:</h3>
    <ul>
      <li><strong>Booking Reference:</strong> ${booking.bookingId}</li>
      <li><strong>Transaction ID:</strong> ${payment.transactionId || 'N/A'}</li>
      <li><strong>Amount Paid:</strong> Rs. ${payment.amount.toFixed(2)}</li>
      <li><strong>Payment Date:</strong> ${new Date(payment.paymentDate).toLocaleString()}</li>
      <li><strong>Remaining Balance Status:</strong> ${booking.paymentStatus}</li>
    </ul>
    <p>Thank you for your payment!</p>
    <p>Best regards,<br/>Urban Tadka Management</p>
  `;
  return await sendEmail(customer.email, subject, html);
};

/**
 * Send Invoice generation alert email
 */
export const sendInvoiceEmail = async (invoice, booking, customer) => {
  const subject = `Invoice Generated - ${invoice.invoiceNumber}`;
  const html = `
    <h2>Dear ${customer.name},</h2>
    <p>An invoice has been generated for your stay under booking reference <strong>${booking.bookingId}</strong>.</p>
    <h3>Invoice Details:</h3>
    <ul>
      <li><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</li>
      <li><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate).toLocaleDateString()}</li>
      <li><strong>Subtotal:</strong> Rs. ${invoice.subtotal.toFixed(2)}</li>
      <li><strong>Tax:</strong> Rs. ${invoice.tax.toFixed(2)}</li>
      <li><strong>Discount:</strong> Rs. ${invoice.discount.toFixed(2)}</li>
      <li><strong>Grand Total:</strong> Rs. ${invoice.total.toFixed(2)}</li>
    </ul>
    <p>You can download the invoice from your customer portal or contact reception for a printed copy.</p>
    <p>Best regards,<br/>Urban Tadka Management</p>
  `;
  return await sendEmail(customer.email, subject, html);
};
