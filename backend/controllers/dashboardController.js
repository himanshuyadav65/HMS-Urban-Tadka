import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import User from '../models/User.js';

/**
 * @desc    Get dashboard analytics
 * @route   GET /api/dashboard/stats
 * @access  Private (Admin / Receptionist)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Room counters
    const totalRooms = await Room.countDocuments({});
    const availableRooms = await Room.countDocuments({ status: 'Available' });
    const occupiedRooms = await Room.countDocuments({ status: 'Booked' });
    const maintenanceRooms = await Room.countDocuments({ status: 'Maintenance' });
    const cleaningRooms = await Room.countDocuments({ status: 'Cleaning' });

    // 2. Booking counters
    const todayCheckIns = await Booking.countDocuments({
      checkIn: { $gte: today, $lt: tomorrow },
      bookingStatus: { $ne: 'Cancelled' }
    });

    const todayCheckOuts = await Booking.countDocuments({
      checkOut: { $gte: today, $lt: tomorrow },
      bookingStatus: 'CheckedIn'
    });

    // 3. Revenue calculations (Completed Payments)
    const todayPayments = await Payment.find({
      paymentDate: { $gte: today, $lt: tomorrow },
      paymentStatus: 'Completed'
    });
    const revenueToday = todayPayments.reduce((sum, p) => sum + p.amount, 0);

    const monthPayments = await Payment.find({
      paymentDate: { $gte: firstDayOfMonth, $lt: tomorrow },
      paymentStatus: 'Completed'
    });
    const revenueThisMonth = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    // 4. Occupancy Rate
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // 5. Monthly Revenue Chart (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenues = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: sixMonthsAgo },
          paymentStatus: 'Completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Map month indices to names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyRevenue = monthlyRevenues.map(item => {
      const monthLabel = `${monthNames[item._id.month - 1]} ${item._id.year}`;
      return { month: monthLabel, revenue: item.revenue };
    });

    // 6. Booking trends by room type
    const roomTypeTrends = await Booking.aggregate([
      {
        $match: { bookingStatus: { $ne: 'Cancelled' } }
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'roomInfo'
        }
      },
      {
        $unwind: '$roomInfo'
      },
      {
        $group: {
          _id: '$roomInfo.roomType',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedTrends = roomTypeTrends.map(t => ({
      name: t._id,
      bookings: t.count
    }));

    // 7. Extra metrics: Pending Payments, Pending KYC, Top Customers, Top Rooms
    const pendingPaymentsCount = await Booking.countDocuments({ paymentStatus: { $in: ['Unpaid', 'Failed'] } });
    const pendingKycCount = await User.countDocuments({ 'documents.status': 'Pending' });

    const topCustomersData = await Payment.aggregate([
      { $match: { paymentStatus: 'Completed' } },
      {
        $group: {
          _id: '$customer',
          totalSpent: { $sum: '$amount' },
          bookingsCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customerInfo'
        }
      },
      { $unwind: '$customerInfo' }
    ]);
    const topCustomers = topCustomersData.map(c => ({
      name: c.customerInfo.name,
      email: c.customerInfo.email || '',
      spent: c.totalSpent,
      visits: c.bookingsCount
    }));

    const topRoomsData = await Booking.aggregate([
      { $match: { bookingStatus: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: '$room',
          bookingsCount: { $sum: 1 }
        }
      },
      { $sort: { bookingsCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: '_id',
          as: 'roomInfo'
        }
      },
      { $unwind: '$roomInfo' }
    ]);
    const topRooms = topRoomsData.map(r => ({
      roomNumber: r.roomInfo.roomNumber,
      roomType: r.roomInfo.roomType,
      bookingsCount: r.bookingsCount
    }));

    res.status(200).json({
      success: true,
      data: {
        rooms: {
          total: totalRooms,
          available: availableRooms,
          occupied: occupiedRooms,
          maintenance: maintenanceRooms,
          cleaning: cleaningRooms
        },
        bookings: {
          todayCheckIns,
          todayCheckOuts
        },
        revenue: {
          today: revenueToday,
          thisMonth: revenueThisMonth
        },
        occupancyRate,
        monthlyRevenue: formattedMonthlyRevenue,
        trends: formattedTrends,
        pendingPayments: pendingPaymentsCount,
        pendingKyc: pendingKycCount,
        topCustomers,
        topRooms
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate reports
 * @route   GET /api/dashboard/reports
 * @access  Private (Admin only)
 */
export const getReports = async (req, res, next) => {
  try {
    const { reportType } = req.query; // 'revenue', 'occupancy', 'customers'

    let reportData = {};

    if (reportType === 'revenue') {
      // Aggregate payments by date
      const revenueReport = await Payment.aggregate([
        { $match: { paymentStatus: 'Completed' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
            dailyRevenue: { $sum: '$amount' },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ]);
      reportData = revenueReport.map(r => ({
        date: r._id,
        revenue: r.dailyRevenue,
        transactions: r.transactionCount
      }));
    } else if (reportType === 'occupancy') {
      // Room status breakups
      const rooms = await Room.find({});
      const statusCounts = rooms.reduce((acc, room) => {
        acc[room.status] = (acc[room.status] || 0) + 1;
        return acc;
      }, {});
      reportData = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count
      }));
    } else {
      // Customer reports (Top spending customers)
      const topCustomers = await Payment.aggregate([
        { $match: { paymentStatus: 'Completed' } },
        {
          $group: {
            _id: '$customer',
            totalSpent: { $sum: '$amount' },
            visitCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 15 },
        {
          $lookup: {
            from: 'customers',
            localField: '_id',
            foreignField: '_id',
            as: 'customerDetails'
          }
        },
        { $unwind: '$customerDetails' }
      ]);
      
      reportData = topCustomers.map(tc => ({
        name: tc.customerDetails.name,
        phone: tc.customerDetails.phone,
        email: tc.customerDetails.email,
        spent: tc.totalSpent,
        visits: tc.visitCount
      }));
    }

    res.status(200).json({
      success: true,
      reportType,
      data: reportData
    });
  } catch (error) {
    next(error);
  }
};

import SupportTicket from '../models/SupportTicket.js';

/**
 * @desc    Get live notifications for Customers, Receptionist, Staff & SuperAdmin
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = [];
    const isCustomer = req.user.role === 'Customer';

    if (isCustomer) {
      // ── A. CUSTOMER NOTIFICATIONS ──
      const customer = await Customer.findOne({ email: req.user.email });

      if (customer) {
        const cId = customer._id || customer.id;

        // 1. Customer's Recent Bookings & Extensions
        const bookings = await Booking.find({
          $or: [{ customerId: cId }, { customer: cId }]
        })
          .populate('room')
          .sort({ updatedAt: -1 })
          .limit(10);

        bookings.forEach(b => {
          const roomName = b.room ? `Room ${b.room.roomNumber} (${b.room.roomType})` : 'Room';
          const inDate = new Date(b.checkIn).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          const outDate = new Date(b.checkOut).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

          // Extension notification
          if (b.isExtended || b.originalCheckOut) {
            const extNights = b.extensionNights || 1;
            notifications.push({
              id: `notif-ext-${b._id || b.id}`,
              category: 'booking',
              type: 'extension',
              title: `📅 Stay Extended (+${extNights} Nights)`,
              message: `Your reservation in ${roomName} extended till ${outDate}.`,
              time: new Date(b.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date(b.updatedAt || Date.now()).getTime(),
              link: '/my-bookings',
              badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            });
          }

          // Booking Confirmation
          if (b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Pending') {
            notifications.push({
              id: `notif-book-${b._id || b.id}`,
              category: 'booking',
              type: 'booking',
              title: `🎉 Booking Confirmed (${b.bookingId})`,
              message: `${roomName} reserved from ${inDate} to ${outDate} · ₹${(b.totalAmount || 0).toFixed(2)}`,
              time: new Date(b.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date(b.createdAt || Date.now()).getTime(),
              link: '/my-bookings',
              badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
            });
          }

          // Checked In
          if (b.bookingStatus === 'CheckedIn') {
            notifications.push({
              id: `notif-in-${b._id || b.id}`,
              category: 'booking',
              type: 'checkin',
              title: `🔑 Checked In Successfully`,
              message: `Welcome to Urban Tadka! Enjoy your stay in ${roomName}.`,
              time: new Date(b.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date(b.updatedAt || Date.now()).getTime(),
              link: '/my-bookings',
              badge: 'bg-teal-500/15 text-teal-400 border-teal-500/30'
            });
          }
        });

        // 2. Customer's Payments
        const payments = await Payment.find({
          $or: [{ customerId: cId }, { customer: cId }]
        })
          .sort({ createdAt: -1 })
          .limit(10);

        payments.forEach(p => {
          const isComp = p.paymentStatus === 'Completed';
          const pType = p.transactionId?.startsWith('SETTLE') ? 'Check-out Settlement' : 'Advance Payment';
          
          notifications.push({
            id: `notif-pay-${p._id || p.id}`,
            category: 'payment',
            type: isComp ? 'payment' : 'payment_failed',
            title: isComp ? `💳 Payment Successful (₹${p.amount.toFixed(2)})` : `⚠️ Payment Failed (₹${p.amount.toFixed(2)})`,
            message: isComp 
              ? `${pType} recorded via ${p.paymentMethod || 'Online Gateway'}.`
              : `Payment attempt was declined or cancelled.`,
            time: new Date(p.paidAt || p.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(p.paidAt || p.createdAt || Date.now()).getTime(),
            link: '/payments',
            badge: isComp ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          });
        });

        // 3. Customer's Support Tickets
        const tickets = await SupportTicket.find({
          $or: [{ customerId: cId }, { customer: cId }]
        })
          .sort({ updatedAt: -1 })
          .limit(5);

        tickets.forEach(t => {
          if (t.isReadByCustomer === false || t.status === 'Resolved' || t.status === 'Closed') {
            notifications.push({
              id: `notif-ticket-${t._id || t.id}`,
              category: 'support',
              type: 'support',
              title: `💬 Support: ${t.subject}`,
              message: `Ticket ${t.ticketId} · Status: ${t.status}`,
              time: new Date(t.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: new Date(t.updatedAt || Date.now()).getTime(),
              link: `/my-tickets/${t._id || t.id}`,
              badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
            });
          }
        });
      }

    } else {
      // ── B. STAFF / RECEPTIONIST / SUPERADMIN / OWNER NOTIFICATIONS ──

      // 1. Recent Bookings Created by Customers
      const recentBookings = await Booking.find({})
        .populate('customer')
        .populate('room')
        .sort({ createdAt: -1 })
        .limit(8);

      recentBookings.forEach(b => {
        const guestName = b.customer?.name || 'Guest';
        const roomNo = b.room?.roomNumber || 'TBD';
        const inDate = new Date(b.checkIn).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        const outDate = new Date(b.checkOut).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });

        notifications.push({
          id: `desk-book-${b._id || b.id}`,
          category: 'booking',
          type: 'booking',
          title: `🛎️ New Booking: ${guestName}`,
          message: `Booked Room ${roomNo} (${b.bookingId}) · ${inDate} to ${outDate} · ₹${(b.totalAmount || 0).toFixed(2)}`,
          time: new Date(b.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(b.createdAt || Date.now()).getTime(),
          link: '/bookings',
          badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
        });

        // If extended
        if (b.isExtended || b.originalCheckOut) {
          notifications.push({
            id: `desk-ext-${b._id || b.id}`,
            category: 'booking',
            type: 'extension',
            title: `🔄 Stay Extension: ${guestName}`,
            message: `Room ${roomNo} extended by +${b.extensionNights || 1}N till ${outDate}.`,
            time: new Date(b.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(b.updatedAt || Date.now()).getTime(),
            link: '/bookings',
            badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
          });
        }
      });

      // 2. Recent Payments Received
      const recentPayments = await Payment.find({ paymentStatus: 'Completed' })
        .populate('customer')
        .populate('booking')
        .sort({ createdAt: -1 })
        .limit(8);

      recentPayments.forEach(p => {
        const guestName = p.customer?.name || p.booking?.customer?.name || 'Guest';
        const pType = p.transactionId?.startsWith('SETTLE') ? 'Check-out Settlement' : 'Advance';
        
        notifications.push({
          id: `desk-pay-${p._id || p.id}`,
          category: 'payment',
          type: 'payment',
          title: `💰 Payment Received: ₹${p.amount.toFixed(2)}`,
          message: `${guestName} paid via ${p.paymentMethod || 'Online'} (${pType})`,
          time: new Date(p.paidAt || p.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timestamp: new Date(p.paidAt || p.createdAt || Date.now()).getTime(),
          link: '/payments',
          badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        });
      });

      // 3. Pending Check-Ins & Check-Outs Due
      const checkedInBookings = await Booking.find({ bookingStatus: 'CheckedIn' })
        .populate('customer')
        .populate('room')
        .limit(5);

      checkedInBookings.forEach(b => {
        const paid = b.paidAmount || 0;
        const due = Math.max(0, (b.totalAmount || 0) - paid);
        notifications.push({
          id: `desk-checkout-${b._id || b.id}`,
          category: 'booking',
          type: 'checkout',
          title: `Occupied / Due at Check-out`,
          message: `Room ${b.room?.roomNumber || ''} (${b.customer?.name || 'Guest'}) · Due: ₹${due.toFixed(2)}`,
          time: new Date(b.checkOut || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' }),
          timestamp: new Date(b.checkOut || Date.now()).getTime(),
          link: '/bookings',
          badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        });
      });

      // 4. KYC Document Submissions
      const kycCustomers = await Customer.find({}).limit(5);
      kycCustomers.forEach(c => {
        if (c.idProofImage || (c.governmentId && c.governmentId.number)) {
          notifications.push({
            id: `desk-kyc-${c._id || c.id}`,
            category: 'kyc',
            type: 'kyc',
            title: `🪪 KYC Document Verification`,
            message: `Guest ${c.name} (${c.phone}) uploaded verification ID.`,
            time: new Date(c.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(c.updatedAt || Date.now()).getTime(),
            link: '/kyc-requests',
            badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
          });
        }
      });
    }

    // Sort all notifications by timestamp descending (newest first)
    notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications.slice(0, 20) // Limit to top 20 latest notifications
    });
  } catch (error) {
    next(error);
  }
};

