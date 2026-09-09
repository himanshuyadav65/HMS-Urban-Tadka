import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import { ReviewInstance } from '../models/Review.js';
import { BookingInstance } from '../models/Booking.js';
import { CustomerInstance } from '../models/Customer.js';
import { RoomInstance } from '../models/Room.js';

// @desc    Submit a new review for a stay/booking
// @route   POST /api/reviews
// @access  Customer
export const createReview = async (req, res) => {
  try {
    const { bookingId, rating, reviewText, category } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'Booking ID and rating are required' });
    }

    const numericRating = parseInt(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Verify booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking reservation not found' });
    }

    // Resolve Customer ID (from Customer profile or Booking record)
    let customerRecord = await Customer.findOne({ email: req.user.email });
    let customerId = customerRecord ? (customerRecord.id || customerRecord._id) : (booking.customerId || req.user.id);

    // If still no customer record in database, create one so foreign key constraint passes
    if (!customerRecord && customerId) {
      try {
        customerRecord = await Customer.create({
          name: req.user.name || 'Valued Guest',
          email: req.user.email,
          phone: req.user.phone || '0000000000',
          governmentId: {
            idType: 'Aadhaar',
            idNumber: 'PENDING',
          }
        });
        customerId = customerRecord.id || customerRecord._id;
      } catch (custErr) {
        console.warn('Could not auto-create customer record:', custErr.message);
      }
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      // Update existing review instead of crashing
      await Review.findByIdAndUpdate(existingReview.id || existingReview._id, {
        rating: numericRating,
        reviewText: reviewText || '',
        category: category || 'Overall',
      });
      return res.status(200).json({ 
        success: true, 
        message: 'Your review has been updated successfully! Thank you.',
        data: existingReview 
      });
    }

    const review = await Review.create({
      bookingId,
      customerId: customerId || booking.customerId,
      rating: numericRating,
      reviewText: reviewText || '',
      category: category || 'Overall',
    });

    res.status(201).json({ 
      success: true, 
      message: 'Review submitted successfully! Thank you for your feedback.', 
      data: review 
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error creating review' });
  }
};

// @desc    Get current customer's reviews
// @route   GET /api/reviews/my
// @access  Customer
export const getMyReviews = async (req, res) => {
  try {
    let customerRecord = await Customer.findOne({ email: req.user.email });
    let customerId = customerRecord ? (customerRecord.id || customerRecord._id) : req.user.id;

    const reviews = await ReviewInstance.findAll({
      where: customerId ? { customerId } : {},
      include: [
        { model: BookingInstance, as: 'booking', include: [{ model: RoomInstance, as: 'room' }] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(reviews);
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
};

// @desc    Get all reviews (admin view)
// @route   GET /api/reviews
// @access  SuperAdmin, Receptionist, HotelOwner
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await ReviewInstance.findAll({
      include: [
        { model: CustomerInstance, as: 'customer' },
        { model: BookingInstance, as: 'booking', include: [{ model: RoomInstance, as: 'room' }] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(reviews);
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ message: 'Server error fetching reviews' });
  }
};

// @desc    Admin reply to a review
// @route   PUT /api/reviews/:id/reply
// @access  SuperAdmin, Receptionist
export const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply } = req.body;

    if (!adminReply) {
      return res.status(400).json({ success: false, message: 'Reply text is required' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await Review.findByIdAndUpdate(id, {
      adminReply,
      adminReplyAt: new Date(),
    });

    res.json({ success: true, message: 'Reply submitted successfully!' });
  } catch (error) {
    console.error('Reply to review error:', error);
    res.status(500).json({ success: false, message: 'Server error replying to review' });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  SuperAdmin
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    await Review.findByIdAndDelete(id);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting review' });
  }
};

// @desc    Get rating statistics
// @route   GET /api/reviews/stats
// @access  All authenticated
export const getReviewStats = async (req, res) => {
  try {
    const reviews = await ReviewInstance.findAll();
    
    const totalReviews = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;

    // Breakdown by stars
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      breakdown[r.rating] = (breakdown[r.rating] || 0) + 1;
    });

    // Percentage breakdown
    const percentages = {};
    for (const [star, count] of Object.entries(breakdown)) {
      percentages[star] = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    }

    // Category breakdown
    const categories = {};
    reviews.forEach(r => {
      if (!categories[r.category]) categories[r.category] = { total: 0, count: 0 };
      categories[r.category].total += r.rating;
      categories[r.category].count += 1;
    });
    const categoryAverages = {};
    for (const [cat, data] of Object.entries(categories)) {
      categoryAverages[cat] = (data.total / data.count).toFixed(1);
    }

    res.json({
      totalReviews,
      averageRating: parseFloat(averageRating),
      breakdown,
      percentages,
      categoryAverages,
    });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

// @desc    Check if a booking has been reviewed
// @route   GET /api/reviews/check/:bookingId
// @access  Customer
export const checkBookingReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const review = await Review.findOne({ bookingId });
    res.json({ hasReview: !!review, review: review || null });
  } catch (error) {
    console.error('Check review error:', error);
    res.status(500).json({ message: 'Server error checking review' });
  }
};
