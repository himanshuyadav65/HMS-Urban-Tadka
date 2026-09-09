import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { uploadSupportFile } from '../middleware/uploadSupportFile.js';
import {
  validateRequest,
} from '../validators/schemas.js';
import {
  ticketValidator,
  replyValidator,
} from '../validators/supportValidator.js';
import {
  createTicket,
  getMyTickets,
  getTicketById,
  replyTicket,
  adminGetTickets,
  adminGetTicketById,
  adminReplyTicket,
  adminUpdateStatus,
  adminUpdatePriority,
  adminUpdateInternal,
  adminDeleteTicket,
  getUnreadCount,
  getSupportAnalytics,
} from '../controllers/supportController.js';

const router = express.Router();

// ==========================================
// 1. Common / Notification Routes
// ==========================================
router.get('/unread-count', protect, getUnreadCount);

// ==========================================
// 2. Customer Routes
// ==========================================
router.post(
  '/',
  protect,
  authorize('Customer'),
  uploadSupportFile.single('attachment'),
  ticketValidator,
  validateRequest,
  createTicket
);
router.get('/my-tickets', protect, authorize('Customer'), getMyTickets);
router.get('/:ticketId', protect, authorize('Customer'), getTicketById);
router.post(
  '/:ticketId/reply',
  protect,
  authorize('Customer'),
  uploadSupportFile.single('attachment'),
  replyValidator,
  validateRequest,
  replyTicket
);

// ==========================================
// 3. Admin / Staff Routes
// ==========================================
router.get('/admin/all', protect, authorize('SuperAdmin', 'Receptionist'), adminGetTickets);
router.get('/admin/analytics', protect, authorize('SuperAdmin', 'Receptionist'), getSupportAnalytics);
router.get('/admin/:ticketId', protect, authorize('SuperAdmin', 'Receptionist'), adminGetTicketById);
router.post(
  '/admin/:ticketId/reply',
  protect,
  authorize('SuperAdmin', 'Receptionist'),
  uploadSupportFile.single('attachment'),
  replyValidator,
  validateRequest,
  adminReplyTicket
);
router.put('/admin/:ticketId/status', protect, authorize('SuperAdmin', 'Receptionist'), adminUpdateStatus);
router.put('/admin/:ticketId/priority', protect, authorize('SuperAdmin', 'Receptionist'), adminUpdatePriority);
router.put('/admin/:ticketId/internal', protect, authorize('SuperAdmin', 'Receptionist'), adminUpdateInternal);
router.delete('/admin/:ticketId', protect, authorize('SuperAdmin'), adminDeleteTicket);

export default router;
