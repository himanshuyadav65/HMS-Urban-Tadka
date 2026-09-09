import User from '../models/User.js';
import Hotel from '../models/Hotel.js';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Coupon from '../models/Coupon.js';
import Offer from '../models/Offer.js';

/**
 * Get system-wide Super Admin dashboard statistics
 */
export const getSuperAdminStats = async (req, res, next) => {
  try {
    const [totalHotels, totalOwners, totalCustomers, totalBookings, totalRooms] = await Promise.all([
      Hotel.count(),
      User.count({ role: 'HotelOwner' }),
      User.count({ role: 'Customer' }),
      Booking.count(),
      Room.count()
    ]);

    const activeRooms = await Room.count({ status: 'Available' });
    const occupiedRooms = await Room.count({ status: 'Occupied' });

    // Aggregate total revenue
    const bookingsData = await Booking.find({});
    const totalRevenue = bookingsData.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        totalHotels,
        totalOwners,
        totalCustomers,
        totalBookings,
        totalRevenue,
        activeRooms,
        occupiedRooms,
        totalRooms
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve or Reject a Hotel Owner account
 */
export const toggleOwnerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    const owner = await User.findById(id);
    if (!owner || owner.role !== 'HotelOwner') {
      res.statusCode = 404;
      throw new Error('Hotel owner not found');
    }

    owner.isBlocked = isBlocked;
    await owner.save();

    res.status(200).json({
      success: true,
      message: `Owner account has been ${isBlocked ? 'suspended' : 'activated'} successfully.`,
      data: owner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new Hotel (Super Admin or Owner)
 */
export const createHotel = async (req, res, next) => {
  try {
    const { name, email, phone, address, city, description } = req.body;

    const hotel = await Hotel.create({
      name,
      email,
      phone,
      address,
      city,
      description,
      ownerId: req.user?.id
    });

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: hotel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manage system-wide Coupons
 */
export const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, expiryDate, minBookingAmount } = req.body;

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      expiryDate,
      minBookingAmount
    });

    res.status(201).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

export const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({});
    res.status(200).json({
      success: true,
      data: coupons
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all system users with optional filtering by role
 */
export const getSystemUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      filter.role = role;
    }
    const users = await User.find(filter).select('-password');
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle the block/suspension status of any user account
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    user.isBlocked = isBlocked;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User status changed to ${isBlocked ? 'Blocked' : 'Active'}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user account permanently
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    await user.destroy();
    res.status(200).json({
      success: true,
      message: 'User account permanently removed from system database'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Directly create a user with any role (SuperAdmin power) + Aadhaar Identity attachment
 */
export const createSystemUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, aadhaar } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.statusCode = 400;
      throw new Error('User email already registered');
    }

    let docs = [];
    if (req.file) {
      docs.push({
        docType: 'Aadhaar Card',
        docPath: `/uploads/${req.file.filename}`,
        uploadedAt: new Date(),
        status: 'Verified'
      });
    }

    const newUser = await User.create({
      name,
      email,
      phone,
      password,
      role,
      aadhaar: aadhaar || '',
      kycStatus: req.file || aadhaar ? 'Verified' : 'None',
      kycVerificationDate: req.file || aadhaar ? new Date() : null,
      documents: docs
    });

    res.status(201).json({
      success: true,
      message: `${role} account initialized successfully with Identity attachment`,
      data: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        aadhaar: newUser.aadhaar,
        documents: newUser.documents
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify or Reject staff Aadhaar identity (SuperAdmin control)
 */
export const verifyStaffIdentity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, aadhaar } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User account not found');
    }

    if (aadhaar !== undefined) {
      user.aadhaar = aadhaar;
    }

    const newStatus = status || 'Verified';
    user.kycStatus = newStatus;
    user.kycVerificationDate = new Date();
    user.kycVerifiedBy = req.user._id;

    let docs = user.documents || [];
    if (docs.length > 0) {
      docs = docs.map(d => ({ ...d, status: newStatus }));
    } else if (req.file) {
      docs = [{
        docType: 'Aadhaar Card',
        docPath: `/uploads/${req.file.filename}`,
        uploadedAt: new Date(),
        status: newStatus
      }];
    }
    user.documents = docs;

    await user.save();

    res.status(200).json({
      success: true,
      message: `Staff identity updated to ${newStatus}`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
