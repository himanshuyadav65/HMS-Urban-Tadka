import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import RoomType from '../models/RoomType.js';

/**
 * Get Hotel Owner Dashboard Stats
 */
export const getOwnerDashboardStats = async (req, res, next) => {
  try {
    const ownerId = req.user.id;

    // Find all hotels owned by this owner
    const hotels = await Hotel.find({ ownerId });
    const hotelIds = hotels.map(h => h.id);

    const [roomsCount, staffCount, bookingsCount] = await Promise.all([
      Room.count({ hotelId: { $in: hotelIds } }),
      User.count({ hotelId: { $in: hotelIds }, role: { $in: ['Receptionist', 'Housekeeping'] } }),
      Booking.count({ hotelId: { $in: hotelIds } })
    ]);

    // Calculate revenue for this owner's hotels
    const bookings = await Booking.find({ hotelId: { $in: hotelIds }, paymentStatus: 'Paid' });
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalHotels: hotels.length,
        totalRooms: roomsCount,
        totalStaff: staffCount,
        totalBookings: bookingsCount,
        totalRevenue
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Room Categories / RoomTypes
 */
export const createRoomCategory = async (req, res, next) => {
  try {
    const { name, basePrice, capacity, amenities, description, hotelId } = req.body;

    const category = await RoomType.create({
      hotelId,
      name,
      basePrice,
      capacity,
      amenities: amenities || [],
      description
    });

    res.status(201).json({
      success: true,
      message: 'Room category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manage Staff (Receptionist & Housekeeping Cleaners)
 */
export const createStaffUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, hotelId } = req.body;

    // Ensure email is unique
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.statusCode = 400;
      throw new Error('Email already registered');
    }

    const staff = await User.create({
      name,
      email,
      phone,
      password,
      role,
      hotelId
    });

    res.status(201).json({
      success: true,
      message: 'Staff user created successfully',
      data: {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        hotelId: staff.hotelId
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOwnerStaff = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const hotels = await Hotel.find({ ownerId });
    const hotelIds = hotels.map(h => h.id);

    const staffList = await User.find({ hotelId: { $in: hotelIds } });

    res.status(200).json({
      success: true,
      data: staffList
    });
  } catch (error) {
    next(error);
  }
};
