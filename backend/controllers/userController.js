import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import Customer from '../models/Customer.js';

/**
 * @desc    Get currently logged-in user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, phone, address, dateOfBirth, gender, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    // Name, phone, address, dateOfBirth, gender updates
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;

    if (password) {
      user.password = password; // mongoose schema pre-save hashes it
    }

    const updatedUser = await user.save();

    // If role is Customer, sync details to corresponding Customer collection record
    if (user.role === 'Customer') {
      const customer = await Customer.findOne({ email: user.email });
      if (customer) {
        if (name) customer.name = name;
        if (phone) customer.phone = phone;
        if (address !== undefined) customer.address = address;
        await customer.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload user profile image
 * @route   POST /api/users/upload-profile-image
 * @access  Private
 */
export const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      res.statusCode = 400;
      throw new Error('Please upload an image file');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    // Delete old profile image if exists
    const oldImage = user.profileImage || user.avatar;
    if (oldImage) {
      const cleanedPath = oldImage.replace(/^\//, '');
      const oldFilePath = path.join('.', cleanedPath);
      try {
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (err) {
        console.error('Failed to delete old profile image:', err.message);
      }
    }

    // Save path
    const imagePath = `/uploads/profile/${req.file.filename}`;
    user.profileImage = imagePath;
    user.avatar = imagePath; // Keep both updated
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        profileImage: imagePath,
        avatar: imagePath,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload verification document (KYC)
 * @route   POST /api/users/upload-document
 * @access  Private
 */
export const uploadDocument = async (req, res, next) => {
  try {
    const { docType } = req.body;
    
    if (!docType) {
      res.statusCode = 400;
      throw new Error('Please specify document type (docType)');
    }

    if (!req.file) {
      res.statusCode = 400;
      throw new Error('Please upload a document file');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    const newDocPath = `/uploads/documents/${req.file.filename}`;

    // Check if same docType already uploaded
    const existingDocIndex = user.documents.findIndex(d => d.docType === docType);

    if (existingDocIndex > -1) {
      // Delete old document file
      const oldDocPath = user.documents[existingDocIndex].docPath;
      if (oldDocPath) {
        const cleanedPath = oldDocPath.replace(/^\//, '');
        const oldFilePath = path.join('.', cleanedPath);
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (err) {
          console.error('Failed to delete old document file:', err.message);
        }
      }
      
      // Update document path & status reset to Verified
      user.documents[existingDocIndex].docPath = newDocPath;
      user.documents[existingDocIndex].status = 'Verified';
      user.documents[existingDocIndex].uploadedAt = Date.now();
      if (!user.documents[existingDocIndex]._id) {
        user.documents[existingDocIndex]._id = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      }
    } else {
      // Add new document as Verified
      user.documents.push({
        _id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        docType,
        docPath: newDocPath,
        status: 'Verified',
        uploadedAt: Date.now(),
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `${docType} uploaded successfully`,
      data: user.documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Block user account (Admin only)
 * @route   PUT /api/users/:id/block
 * @access  Private/Admin
 */
export const blockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    if (user.role === 'Admin') {
      res.statusCode = 400;
      throw new Error('Cannot block an admin account');
    }

    user.isBlocked = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been blocked successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Unblock user account (Admin only)
 * @route   PUT /api/users/:id/unblock
 * @access  Private/Admin
 */
export const unblockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    user.isBlocked = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been unblocked successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify or Reject user document status (Admin only)
 * @route   PUT /api/users/:id/documents/:docId/verify
 * @access  Private/Admin
 */
export const verifyDocument = async (req, res, next) => {
  try {
    const { status } = req.body; // 'Verified' or 'Rejected'
    if (!['Verified', 'Rejected'].includes(status)) {
      res.statusCode = 400;
      throw new Error('Verification status must be either Verified or Rejected');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    const docIndex = user.documents.findIndex(d => d._id.toString() === req.params.docId);
    if (docIndex === -1) {
      res.statusCode = 404;
      throw new Error('Document not found');
    }

    user.documents[docIndex].status = status;
    await user.save();

    // If verification status changes to verified, and it is Aadhaar Card, check if we need to sync with Customer
    // (Aadhaar is the primary document in original schema)
    if (status === 'Verified' && user.role === 'Customer' && user.documents[docIndex].docType === 'Aadhaar Card') {
      const customer = await Customer.findOne({ email: user.email });
      if (customer) {
        // Sync document verification to customer proof
        customer.idProofImage = user.documents[docIndex].docPath;
        if (!customer.governmentId || customer.governmentId.idNumber === 'PENDING') {
          customer.governmentId = {
            idType: 'Aadhaar',
            idNumber: 'VERIFIED_VIA_PROFILE',
          };
        }
        await customer.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Document status updated to ${status}`,
      data: user.documents,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users with pending KYC document requests (Admin/Receptionist only)
 * @route   GET /api/users/kyc-requests
 * @access  Private (Admin / Receptionist)
 */
export const getPendingKycRequests = async (req, res, next) => {
  try {
    const { status = 'Pending' } = req.query;
    
    let query = {};
    if (status === 'Pending') {
      query['documents.status'] = 'Pending';
    } else if (status === 'Processed') {
      query['documents.status'] = { $in: ['Verified', 'Rejected'] };
    } else if (status === 'all') {
      query['documents.0'] = { $exists: true };
    } else {
      query['documents.status'] = status;
    }

    const users = await User.find(query).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};
