import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import {
  validateRequest,
  registerValidator,
  loginValidator,
  profileValidator,
  roomValidator,
  customerValidator,
  bookingValidator,
  paymentValidator
} from '../validators/schemas.js';

// Controllers
import {
  register,
  login,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  googleLogin
} from '../controllers/authController.js';

import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  uploadRoomImages
} from '../controllers/roomController.js';

import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer
} from '../controllers/customerController.js';

import {
  createBooking,
  getBookings,
  getBookingById,
  cancelBooking,
  discardBooking,
  checkIn,
  checkOut,
  previewExtendStay,
  extendStay
} from '../controllers/bookingController.js';


import {
  createPayment,
  getPayments,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  getInvoices,
  downloadInvoicePdf
} from '../controllers/paymentController.js';

import {
  getDashboardStats,
  getReports,
  getNotifications
} from '../controllers/dashboardController.js';

// New Multi-Hotel controllers
import {
  getSuperAdminStats,
  toggleOwnerStatus,
  createHotel,
  createCoupon,
  getCoupons,
  getSystemUsers,
  toggleUserStatus,
  deleteUser,
  createSystemUser,
  verifyStaffIdentity
} from '../controllers/superAdminController.js';

import {
  getOwnerDashboardStats,
  createRoomCategory,
  createStaffUser,
  getOwnerStaff
} from '../controllers/ownerController.js';

import {
  createHousekeepingTask,
  updateCleaningStatus,
  fileMaintenanceRequest,
  getAssignedHousekeepingTasks,
  getAllHousekeepingTasks
} from '../controllers/housekeepingController.js';

import {
  sendMessage,
  getChatHistory,
  getContacts,
  clearChatHistory,
  getUnreadMessages,
  deleteSingleMessage
} from '../controllers/messageController.js';

import {
  createReview,
  getMyReviews,
  getAllReviews,
  replyToReview,
  deleteReview,
  getReviewStats,
  checkBookingReview
} from '../controllers/reviewController.js';


const router = express.Router();

// ==========================================
// 1. Authentication Routes
// ==========================================
router.post('/auth/register', registerValidator, validateRequest, register);
router.post('/auth/login', loginValidator, validateRequest, login);
router.get('/auth/me', protect, getMe);
router.put('/auth/profile', protect, upload.single('avatar'), profileValidator, validateRequest, updateProfile);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.post('/auth/google', googleLogin);

// ==========================================
// 2. Room Routes
// ==========================================
router.get('/rooms', protect, getRooms);
router.get('/rooms/:id', protect, getRoomById);
router.post('/rooms', protect, authorize('SuperAdmin', 'Receptionist'), roomValidator, validateRequest, createRoom);
router.put('/rooms/:id', protect, authorize('SuperAdmin', 'Receptionist'), updateRoom);
router.delete('/rooms/:id', protect, authorize('SuperAdmin', 'Receptionist'), deleteRoom);
router.post('/rooms/:id/images', protect, authorize('SuperAdmin', 'Receptionist'), upload.array('images', 5), uploadRoomImages);

// ==========================================
// 3. Customer Routes
// ==========================================
router.post('/customers', protect, authorize('SuperAdmin', 'Receptionist'), upload.single('idProofImage'), customerValidator, validateRequest, createCustomer);
router.get('/customers', protect, authorize('SuperAdmin', 'Receptionist'), getCustomers);
router.get('/customers/:id', protect, authorize('SuperAdmin', 'Receptionist'), getCustomerById);
router.put('/customers/:id', protect, authorize('SuperAdmin', 'Receptionist'), upload.single('idProofImage'), updateCustomer);
router.delete('/customers/:id', protect, authorize('SuperAdmin', 'Receptionist'), deleteCustomer);

// ==========================================
// 4. Booking Routes
// ==========================================
router.post('/bookings', protect, authorize('SuperAdmin', 'HotelOwner', 'Owner', 'Admin', 'Manager', 'Receptionist', 'Customer'), bookingValidator, validateRequest, createBooking);
router.get('/bookings', protect, authorize('SuperAdmin', 'HotelOwner', 'Owner', 'Admin', 'Manager', 'Receptionist', 'Customer'), getBookings);
router.get('/bookings/:id', protect, getBookingById);
router.delete('/bookings/:id', protect, discardBooking);
router.post('/bookings/:id/discard', protect, discardBooking);
router.post('/bookings/:id/cancel', protect, authorize('SuperAdmin', 'HotelOwner', 'Owner', 'Admin', 'Manager', 'Receptionist', 'Customer'), cancelBooking);
router.post('/bookings/:id/checkin', protect, authorize('SuperAdmin', 'HotelOwner', 'Owner', 'Admin', 'Manager', 'Receptionist'), checkIn);
router.post('/bookings/:id/checkout', protect, authorize('SuperAdmin', 'HotelOwner', 'Owner', 'Admin', 'Manager', 'Receptionist'), checkOut);
router.post('/bookings/:id/preview-extension', protect, previewExtendStay);
router.post('/bookings/:id/extend', protect, extendStay);


// ==========================================
// 5. Payment & Invoice Routes
// ==========================================
router.post('/payments', protect, authorize('SuperAdmin', 'HotelOwner', 'Owner', 'Admin', 'Manager', 'Receptionist'), paymentValidator, validateRequest, createPayment);
router.get('/payments', protect, authorize('SuperAdmin', 'HotelOwner', 'Owner', 'Admin', 'Manager', 'Receptionist', 'Customer'), getPayments);
router.post('/payments/razorpay/order', protect, createRazorpayOrder);
router.post('/payments/razorpay/verify', protect, verifyRazorpayPayment);
// Razorpay Webhooks (Public endpoints called directly by Razorpay servers)
router.post('/payments/razorpay/webhook', handleRazorpayWebhook);
router.post('/webhook/razorpay', handleRazorpayWebhook);

router.get('/invoices', protect, authorize('SuperAdmin', 'HotelOwner', 'Owner', 'Admin', 'Manager', 'Receptionist', 'Customer'), getInvoices);
router.get('/invoices/:id/download', protect, downloadInvoicePdf);
router.get('/notifications', protect, getNotifications);

// ==========================================
// 6. Super Admin Operations (Acts as Owner also)
// ==========================================
router.get('/superadmin/stats', protect, authorize('SuperAdmin'), getSuperAdminStats);
router.put('/superadmin/owner/:id/status', protect, authorize('SuperAdmin'), toggleOwnerStatus);
router.post('/superadmin/hotels', protect, authorize('SuperAdmin'), createHotel);
router.post('/superadmin/coupons', protect, authorize('SuperAdmin'), createCoupon);
router.get('/superadmin/coupons', protect, authorize('SuperAdmin', 'Customer'), getCoupons);
router.get('/superadmin/users', protect, authorize('SuperAdmin'), getSystemUsers);
router.put('/superadmin/users/:id/status', protect, authorize('SuperAdmin'), toggleUserStatus);
router.delete('/superadmin/users/:id', protect, authorize('SuperAdmin'), deleteUser);
router.post('/superadmin/users', protect, authorize('SuperAdmin'), upload.single('document'), createSystemUser);
router.put('/superadmin/users/:id/verify-identity', protect, authorize('SuperAdmin'), upload.single('document'), verifyStaffIdentity);

// ==========================================
// 7. Hotel Owner operations (Routed to Super Admin)
// ==========================================
router.get('/owner/stats', protect, authorize('SuperAdmin'), getOwnerDashboardStats);
router.post('/owner/room-categories', protect, authorize('SuperAdmin'), createRoomCategory);
router.post('/owner/staff', protect, authorize('SuperAdmin'), createStaffUser);
router.get('/owner/staff', protect, authorize('SuperAdmin'), getOwnerStaff);

// ==========================================
// 8. Housekeeping & Maintenance Operations
// ==========================================
router.post('/housekeeping', protect, authorize('SuperAdmin', 'Receptionist'), createHousekeepingTask);
router.get('/housekeeping', protect, authorize('SuperAdmin', 'Receptionist'), getAllHousekeepingTasks);
router.get('/housekeeping/assigned', protect, authorize('Housekeeping'), getAssignedHousekeepingTasks);
router.put('/housekeeping/:id', protect, authorize('SuperAdmin', 'Housekeeping', 'Receptionist'), updateCleaningStatus);
router.post('/maintenance', protect, authorize('SuperAdmin', 'Housekeeping', 'Receptionist'), fileMaintenanceRequest);

// ==========================================
// 9. Internal Messaging Operations
// ==========================================
router.post('/messages', protect, authorize('SuperAdmin', 'Receptionist', 'Housekeeping'), sendMessage);
router.get('/messages/unread', protect, authorize('SuperAdmin', 'Receptionist', 'Housekeeping'), getUnreadMessages);
router.get('/messages/contacts', protect, authorize('SuperAdmin', 'Receptionist', 'Housekeeping'), getContacts);
router.get('/messages/:contactId', protect, authorize('SuperAdmin', 'Receptionist', 'Housekeeping'), getChatHistory);
router.delete('/messages/single/:id', protect, authorize('SuperAdmin', 'Receptionist', 'Housekeeping'), deleteSingleMessage);
router.delete('/messages/:contactId', protect, authorize('SuperAdmin', 'Receptionist', 'Housekeeping'), clearChatHistory);

// ==========================================
// 10. Guest Reviews & Ratings
// ==========================================
router.post('/reviews', protect, authorize('Customer', 'SuperAdmin', 'HotelOwner', 'Receptionist'), createReview);
router.get('/reviews/my', protect, authorize('Customer', 'SuperAdmin', 'HotelOwner', 'Receptionist'), getMyReviews);
router.get('/reviews/stats', protect, getReviewStats);
router.get('/reviews/check/:bookingId', protect, authorize('Customer', 'SuperAdmin', 'HotelOwner', 'Receptionist'), checkBookingReview);
router.get('/reviews', protect, authorize('SuperAdmin', 'Receptionist', 'HotelOwner', 'Customer'), getAllReviews);
router.put('/reviews/:id/reply', protect, authorize('SuperAdmin', 'Receptionist', 'HotelOwner'), replyToReview);
router.delete('/reviews/:id', protect, authorize('SuperAdmin', 'HotelOwner'), deleteReview);

export default router;
