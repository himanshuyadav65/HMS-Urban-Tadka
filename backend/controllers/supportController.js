import SupportTicket from '../models/SupportTicket.js';
import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

/**
 * Create a new guest support ticket (Customer only)
 */
export const createTicket = async (req, res, next) => {
  try {
    const { subject, category, description, bookingId, priority } = req.body;

    const customerRecord = await Customer.findOne({ email: req.user.email });
    if (!customerRecord) {
      res.statusCode = 404;
      throw new Error('Customer profile not found. Please log out and sign in again.');
    }

    const randomHex = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const ticketId = `TK-${randomHex}`;

    const attachmentPath = req.file ? `/uploads/support/${req.file.filename}` : '';

    const firstMessage = {
      senderId: { _id: req.user.id, name: req.user.name },
      senderType: 'Customer',
      message: description,
      attachment: attachmentPath,
      createdAt: new Date()
    };

    const ticket = await SupportTicket.create({
      ticketId,
      customerId: customerRecord._id,
      bookingId: bookingId || null,
      subject,
      category,
      description,
      priority: priority || 'Medium',
      status: 'Open',
      attachment: attachmentPath,
      messages: [firstMessage],
      isReadByCustomer: true,
      isReadByAdmin: false
    });

    res.status(201).json({
      success: true,
      message: 'Support ticket opened successfully',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get guest support tickets (Customer view)
 */
export const getMyTickets = async (req, res, next) => {
  try {
    const customerRecord = await Customer.findOne({ email: req.user.email });
    if (!customerRecord) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const { status, category, search } = req.query;
    const query = { customerId: customerRecord._id };

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await SupportTicket.find(query)
      .populate('booking')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer support ticket by ID
 */
export const getTicketById = async (req, res, next) => {
  try {
    const customerRecord = await Customer.findOne({ email: req.user.email });
    if (!customerRecord) {
      res.statusCode = 404;
      throw new Error('Customer profile not found');
    }

    const ticket = await SupportTicket.findById(req.params.ticketId).populate('booking');
    if (!ticket) {
      res.statusCode = 404;
      throw new Error('Ticket not found');
    }

    if (ticket.customerId.toString() !== customerRecord._id.toString()) {
      res.statusCode = 403;
      throw new Error('You are not authorized to view this ticket');
    }

    // Mark as read by customer
    ticket.isReadByCustomer = true;
    await ticket.save();

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Post response reply on a support ticket (Customer)
 */
export const replyTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    const customerRecord = await Customer.findOne({ email: req.user.email });
    if (!customerRecord) {
      res.statusCode = 404;
      throw new Error('Customer profile not found');
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      res.statusCode = 404;
      throw new Error('Ticket not found');
    }

    if (ticket.customerId.toString() !== customerRecord._id.toString()) {
      res.statusCode = 403;
      throw new Error('You are not authorized to reply to this ticket');
    }

    if (ticket.status === 'Closed') {
      res.statusCode = 400;
      throw new Error('Cannot reply to a closed ticket');
    }

    const currentMessages = Array.isArray(ticket.messages) ? [...ticket.messages] : [];
    currentMessages.push({
      senderId: { _id: req.user.id, name: req.user.name },
      senderType: 'Customer',
      message,
      attachment: req.file ? `/uploads/support/${req.file.filename}` : '',
      createdAt: new Date()
    });

    ticket.messages = currentMessages;
    ticket.isReadByAdmin = false;
    ticket.isReadByCustomer = true;
    if (ticket.status === 'Resolved') {
      ticket.status = 'Open'; // Reopen resolved ticket on new customer message
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Reply posted successfully',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all support tickets (Admin / Receptionist view)
 */
export const adminGetTickets = async (req, res, next) => {
  try {
    const { status, priority, category, dateRange, search } = req.query;
    const query = {};

    if (status && status !== 'All') query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    if (dateRange) {
      const now = new Date();
      if (dateRange === 'today') {
        const startOfDay = new Date(now.setHours(0,0,0,0));
        query.createdAt = { $gte: startOfDay };
      } else if (dateRange === 'week') {
        const startOfWeek = new Date(now.setDate(now.getDate() - 7));
        query.createdAt = { $gte: startOfWeek };
      } else if (dateRange === 'month') {
        const startOfMonth = new Date(now.setDate(now.getDate() - 30));
        query.createdAt = { $gte: startOfMonth };
      }
    }

    if (search) {
      // Find matching customers to search by guest details
      const customers = await Customer.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      });
      const customerIds = customers.map(c => c._id || c.id);

      query.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { customerId: { $in: customerIds } }
      ];
    }

    const tickets = await SupportTicket.find(query)
      .populate('customer')
      .populate('assignedAdmin')
      .populate('booking')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single support ticket by ID (Admin / Receptionist view)
 */
export const adminGetTicketById = async (req, res, next) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId)
      .populate('customer')
      .populate('assignedAdmin')
      .populate('booking');

    if (!ticket) {
      res.statusCode = 404;
      throw new Error('Ticket not found');
    }

    // Mark as read by admin
    ticket.isReadByAdmin = true;
    await ticket.save();

    res.status(200).json({
      success: true,
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Post response reply on a support ticket (Admin / Receptionist)
 */
export const adminReplyTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      res.statusCode = 404;
      throw new Error('Ticket not found');
    }

    if (ticket.status === 'Closed') {
      res.statusCode = 400;
      throw new Error('Cannot reply to a closed ticket');
    }

    const currentMessages = Array.isArray(ticket.messages) ? [...ticket.messages] : [];
    currentMessages.push({
      senderId: { _id: req.user.id, name: req.user.name },
      senderType: 'Admin',
      message,
      attachment: req.file ? `/uploads/support/${req.file.filename}` : '',
      createdAt: new Date()
    });

    ticket.messages = currentMessages;
    ticket.isReadByCustomer = false;
    ticket.isReadByAdmin = true;

    // Automatically set status to In Progress if it was Open
    if (ticket.status === 'Open') {
      ticket.status = 'In Progress';
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Reply posted successfully',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update ticket status (Admin / Receptionist)
 */
export const adminUpdateStatus = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      res.statusCode = 404;
      throw new Error('Ticket not found');
    }

    ticket.status = status;
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket status updated successfully',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update ticket priority (Admin / Receptionist)
 */
export const adminUpdatePriority = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { priority } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      res.statusCode = 404;
      throw new Error('Ticket not found');
    }

    ticket.priority = priority;
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket priority updated successfully',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update ticket assignee & internal notes (Admin / Receptionist)
 */
export const adminUpdateInternal = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { assignedAdminId, internalNotes } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      res.statusCode = 404;
      throw new Error('Ticket not found');
    }

    if (assignedAdminId !== undefined) {
      ticket.assignedAdminId = assignedAdminId || null;
    }
    if (internalNotes !== undefined) {
      ticket.internalNotes = internalNotes;
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Ticket internal parameters updated successfully',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete support ticket (Admin only)
 */
export const adminDeleteTicket = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const ticket = await SupportTicket.findByIdAndDelete(ticketId);
    if (!ticket) {
      res.statusCode = 404;
      throw new Error('Ticket not found');
    }

    res.status(200).json({
      success: true,
      message: 'Ticket deleted permanently'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread tickets count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'Customer') {
      const customerRecord = await Customer.findOne({ email: req.user.email });
      if (!customerRecord) {
        return res.status(200).json({ success: true, count: 0 });
      }
      query = { customerId: customerRecord._id, isReadByCustomer: false };
    } else {
      query = { isReadByAdmin: false };
    }

    const count = await SupportTicket.countDocuments(query);
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get support analytics for dashboard (Admin / Receptionist)
 */
export const getSupportAnalytics = async (req, res, next) => {
  try {
    const allTickets = await SupportTicket.find({});
    const totalTickets = allTickets.length;
    const openTickets = allTickets.filter(t => t.status === 'Open').length;
    const resolvedToday = allTickets.filter(t => t.status === 'Resolved' && new Date(t.updatedAt).toDateString() === new Date().toDateString()).length;
    const pendingToday = allTickets.filter(t => ['Open', 'In Progress'].includes(t.status)).length;

    // Group by status
    const statusCounts = { 'Open': 0, 'In Progress': 0, 'Resolved': 0, 'Closed': 0 };
    allTickets.forEach(t => {
      if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
    });
    const ticketsByStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Group by category
    const categoryCounts = {};
    allTickets.forEach(t => {
      categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
    });
    const ticketsByCategory = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));

    res.status(200).json({
      success: true,
      data: {
        cards: {
          totalTickets,
          openTickets,
          pendingToday,
          resolvedToday,
          averageResponseTime: '2.5 hrs'
        },
        charts: {
          ticketsByStatus,
          ticketsByCategory
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
