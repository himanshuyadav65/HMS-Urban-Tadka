import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../config/multer.js';
import { profileValidator, validateRequest } from '../validators/schemas.js';
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  uploadDocument,
  getAllUsers,
  blockUser,
  unblockUser,
  verifyDocument,
  getPendingKycRequests
} from '../controllers/userController.js';

const router = express.Router();

// ==========================================
// User Profile & Upload Routes
// ==========================================
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, profileValidator, validateRequest, updateUserProfile);
router.post('/upload-profile-image', protect, upload.single('profileImage'), uploadProfileImage);
router.post('/upload-document', protect, upload.single('document'), uploadDocument);

// ==========================================
// Admin Moderator Routes
// ==========================================
router.get('/', protect, authorize('SuperAdmin', 'HotelOwner', 'Receptionist'), getAllUsers);
router.put('/:id/block', protect, authorize('SuperAdmin'), blockUser);
router.put('/:id/unblock', protect, authorize('SuperAdmin'), unblockUser);
router.get('/kyc-requests', protect, authorize('SuperAdmin', 'Receptionist'), getPendingKycRequests);
router.put('/:id/documents/:docId/verify', protect, authorize('SuperAdmin', 'Receptionist'), verifyDocument);

export default router;
