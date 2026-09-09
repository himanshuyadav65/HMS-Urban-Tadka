import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import { sendEmail } from '../services/emailService.js';

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public / Admin (to create other staff roles)
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Strict Security Rule: Public can only signup as CUSTOMER
    if (role && role !== 'Customer') {
      res.statusCode = 400;
      throw new Error('Public registration is restricted to Customer accounts. Staff registrations are by invitation only.');
    }

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.statusCode = 400;
      throw new Error('User with this email already exists');
    }

    // Create user with forced Customer role
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: 'Customer',
      hotelId: null,
    });

    // If role is Customer, create corresponding Customer model
    if (user.role === 'Customer') {
      await Customer.create({
        name: user.name,
        email: user.email,
        phone: user.phone,
        governmentId: {
          idType: req.body.idType || 'Aadhaar',
          idNumber: req.body.idNumber || 'PENDING',
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log in user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email and select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.statusCode = 401;
      throw new Error('Invalid email or password');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.statusCode = 401;
      throw new Error('Invalid email or password');
    }

    // If Customer role, ensure Customer record exists
    if (user.role === 'Customer') {
      const customerExists = await Customer.findOne({ email: user.email });
      if (!customerExists) {
        await Customer.create({
          name: user.name,
          email: user.email,
          phone: user.phone,
          governmentId: {
            idType: 'Aadhaar',
            idNumber: 'PENDING',
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.statusCode = 404;
      throw new Error('User not found');
    }

    const oldEmail = user.email;

    // Check if email already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        res.statusCode = 400;
        throw new Error('Email is already taken by another user');
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;

    if (password) {
      user.password = password; // mongoose schema pre('save') hashes it
    }

    if (req.file) {
      // If there is an existing avatar, delete it from the filesystem
      if (user.avatar) {
        const cleanedPath = user.avatar.replace(/^\//, ''); // remove leading slash
        const oldAvatarPath = path.join('.', cleanedPath);
        try {
          if (fs.existsSync(oldAvatarPath)) {
            fs.unlinkSync(oldAvatarPath);
          }
        } catch (err) {
          console.error('Failed to delete old avatar file:', err.message);
        }
      }
      user.avatar = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await user.save();

    // Sync Customer details if role is Customer
    if (user.role === 'Customer') {
      const customer = await Customer.findOne({ email: oldEmail });
      if (customer) {
        if (name) customer.name = name;
        if (phone) customer.phone = phone;
        if (email) customer.email = email;
        await customer.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Forgot Password (Generate OTP)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.statusCode = 400;
      throw new Error('Email is required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.statusCode = 404;
      throw new Error('No user found with this email address');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update user record
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = otpExpires;
    await user.save();

    // Call email service to send the OTP
    const emailSubject = 'Password Reset OTP - Grand Horizon Resort';
    const emailHtml = `
      <h2>Dear ${user.name || 'User'},</h2>
      <p>We received a request to reset the password for your account.</p>
      <p>Please use the following 6-digit One-Time Password (OTP) to proceed with resetting your password:</p>
      <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #4f46e5; margin: 20px 0; font-family: monospace; text-align: center; background-color: #f3f4f6; padding: 10px; border-radius: 6px;">${otp}</div>
      <p>This code is valid for <strong>10 minutes</strong>.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
      <p style="font-size: 12px; color: #718096;">Grand Horizon Resort Management</p>
    `;
    
    // Attempt to send email
    const emailSent = await sendEmail(email, emailSubject, emailHtml);

    // Log the OTP to the console
    console.log(`\n========================================`);
    console.log(`[PASSWORD RESET OTP] For User: ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log(`Email Sent Status: ${emailSent ? 'Success/Mocked' : 'Failed'}`);
    console.log(`========================================\n`);

    res.status(200).json({
      success: true,
      message: 'OTP code has been sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset Password (Verify OTP & Save New Password)
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      res.statusCode = 400;
      throw new Error('Email, OTP, and new password are required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.statusCode = 404;
      throw new Error('No user found with this email address');
    }

    // Verify OTP
    if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
      res.statusCode = 400;
      throw new Error('Invalid OTP code');
    }

    // Verify expiry
    if (new Date() > new Date(user.resetPasswordOTPExpires)) {
      res.statusCode = 400;
      throw new Error('OTP has expired');
    }

    // Update password
    user.password = newPassword; // Pre-save hook hashes it automatically
    user.resetPasswordOTP = '';
    user.resetPasswordOTPExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

// Initialize OAuth2 client for Google Token verification if Client ID is configured
const getOAuthClient = () => {
  if (process.env.GOOGLE_CLIENT_ID) {
    return new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return null;
};

/**
 * @desc    Google Sign-In / Signup authenticator
 * @route   POST /api/auth/google
 * @access  Public
 */
export const googleLogin = async (req, res, next) => {
  try {
    const { credential, accessToken, isSandbox } = req.body;
    if (!credential && !accessToken) {
      res.statusCode = 400;
      throw new Error('Google credential or accessToken token is required');
    }

    let payload = null;

    if (accessToken) {
      // Retrieve user profile metadata directly using standard UserInfo REST API
      try {
        const fetchResponse = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`);
        if (!fetchResponse.ok) {
          throw new Error('Google userinfo fetch response status: ' + fetchResponse.status);
        }
        payload = await fetchResponse.json();
      } catch (err) {
        res.statusCode = 400;
        throw new Error('Failed to retrieve profile via Google access token: ' + err.message);
      }
    } else if (isSandbox) {
      // Parse sandbox credential
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        }
      } catch (err) {
        // Fallback
      }

      if (!payload) {
        try {
          payload = JSON.parse(credential);
        } catch (e) {
          res.statusCode = 400;
          throw new Error('Failed to parse Google sandbox credential token');
        }
      }
    } else {
      const client = getOAuthClient();
      if (!client) {
        res.statusCode = 400;
        throw new Error('Google OAuth client is not initialized. Please set GOOGLE_CLIENT_ID.');
      }
      // Cryptographically verify Google OAuth ID token signatures
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    }

    if (!payload || !payload.email) {
      res.statusCode = 400;
      throw new Error('Invalid Google credential payload');
    }

    const { email, name } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      if (user.isBlocked) {
        res.statusCode = 403;
        throw new Error('This user account is suspended. Please contact hotel support.');
      }
    } else {
      // Auto-register new accounts as CUSTOMER role
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        phone: payload.phone_number || 'PENDING',
        password: Math.random().toString(36).slice(-10), // random hash password
        role: 'Customer',
        hotelId: null,
      });

      // Insert matching customer entity for reservation records
      await Customer.create({
        name: user.name,
        email: user.email,
        phone: user.phone,
        governmentId: {
          idType: 'Aadhaar Card',
          idNumber: 'PENDING',
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logged in with Google successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

