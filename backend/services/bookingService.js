import Booking from '../models/Booking.js';
import Room from '../models/Room.js';

/**
 * Validate room availability for given dates, excluding a specific booking (if updating).
 * @param {string} roomId 
 * @param {Date|string} checkIn 
 * @param {Date|string} checkOut 
 * @param {string} [excludeBookingId] 
 * @returns {Promise<boolean>} True if available, false if overlapping booking exists
 */
export const checkRoomAvailability = async (roomId, checkIn, checkOut, excludeBookingId = null) => {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
    throw new Error('Invalid check-in or check-out date');
  }

  if (inDate >= outDate) {
    throw new Error('Check-out date must be after check-in date');
  }

  // Query conditions to find overlaps (only active, paid/confirmed or checked-in bookings reserve the room)
  const query = {
    room: roomId,
    bookingStatus: { $in: ['Confirmed', 'CheckedIn'] },
    $and: [
      { checkIn: { $lt: outDate } },
      { checkOut: { $gt: inDate } }
    ]
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const overlappingBooking = await Booking.findOne(query);
  return !overlappingBooking;
};

/**
 * Calculate totals for a stay
 * @param {number} pricePerNight 
 * @param {Date|string} checkIn 
 * @param {Date|string} checkOut 
 * @param {number} [discountPercent=0] 
 * @param {number} [taxPercent=18] 
 * @returns {Object} Pricing details
 */
export const calculateBilling = (pricePerNight, checkIn, checkOut, discountAmount = 0, taxPercent = 18) => {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  // Difference in milliseconds
  const diffTime = Math.abs(outDate - inDate);
  // Difference in days
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimum 1 day/night

  const subtotal = pricePerNight * totalDays;
  const tax = Math.round((subtotal * (taxPercent / 100)) * 100) / 100;
  const discount = Math.min(discountAmount, subtotal + tax); // Cap discount to invoice amount
  const totalAmount = Math.round((subtotal + tax - discount) * 100) / 100;

  return {
    totalDays,
    pricePerNight,
    subtotal,
    tax,
    discount,
    totalAmount
  };
};
