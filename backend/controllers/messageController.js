import InternalMessage from '../models/InternalMessage.js';
import User from '../models/User.js';
import { Op } from 'sequelize';

/**
 * Send an internal message
 * SuperAdmin can optionally pass `senderIdOverride` to send on behalf of a receptionist (simulation mode).
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, message, senderIdOverride } = req.body;

    // If SuperAdmin is simulating a receptionist, use the override senderId
    let senderId = req.user.id;
    if (senderIdOverride && req.user.role === 'SuperAdmin') {
      senderId = senderIdOverride;
    }

    if (!receiverId || !message) {
      res.statusCode = 400;
      throw new Error('Receiver ID and message content are required');
    }

    const newMessage = await InternalMessage.create({
      senderId,
      receiverId,
      message,
      isRead: false
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get direct message history between active user and target contact.
 * SuperAdmin can optionally pass `?asUser=<id>` to fetch chat on behalf of a receptionist (simulation mode).
 */
export const getChatHistory = async (req, res, next) => {
  try {
    const { contactId } = req.params;

    // If SuperAdmin is simulating, use the overridden userId
    let userId = req.user.id;
    if (req.query.asUser && req.user.role === 'SuperAdmin') {
      userId = req.query.asUser;
    }

    const messages = await InternalMessage.find({
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    }).sort({ createdAt: 1 });

    // Mark messages as read where active user is the receiver
    await InternalMessage.updateMany(
      { senderId: contactId, receiverId: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear direct message history between active user and target contact.
 */
export const clearChatHistory = async (req, res, next) => {
  try {
    const { contactId } = req.params;

    let userId = req.user.id;
    if (req.query.asUser && req.user.role === 'SuperAdmin') {
      userId = req.query.asUser;
    }

    await InternalMessage.deleteMany({
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get contacts list for direct messaging (SuperAdmins, Receptionists, Housekeeping & Staff)
 */
export const getContacts = async (req, res, next) => {
  try {
    const activeUserId = String(req.user?.id || req.user?._id || '').trim();

    // 1. Fetch all users from User collection
    let allUsers = [];
    try {
      allUsers = await User.find({});
    } catch (e) {
      console.error('Error fetching users for chat contacts:', e);
    }

    // Convert Sequelize / Mongoose instances to clean JS objects with real IDs
    let contactsList = (allUsers || []).map(u => {
      const obj = u.toJSON ? u.toJSON() : u;
      return {
        ...obj,
        id: String(obj.id || obj._id)
      };
    });

    // Filter staff members (role is not Customer)
    contactsList = contactsList.filter(u => {
      const r = (u.role || '').toLowerCase();
      return r !== 'customer';
    });

    // Exclude currently logged-in user from contact list
    contactsList = contactsList.filter(c => {
      const cId = String(c.id || c._id || '').trim();
      return cId !== activeUserId && (c.name || '').toLowerCase() !== (req.user?.name || '').toLowerCase();
    });

    // Enrich contacts with unreadCount, lastMessage, lastMessageTime using real DB IDs
    const contactsWithMeta = await Promise.all(
      contactsList.map(async (c) => {
        const cId = String(c.id);
        let unreadCount = 0;
        let lastMessageText = '';
        let lastMessageTime = '';

        try {
          unreadCount = await InternalMessage.countDocuments({
            senderId: cId,
            receiverId: activeUserId,
            isRead: false
          });

          const lastMsg = await InternalMessage.findOne({
            $or: [
              { senderId: activeUserId, receiverId: cId },
              { senderId: cId, receiverId: activeUserId }
            ]
          }).sort({ createdAt: -1 });

          if (lastMsg) {
            lastMessageText = lastMsg.message || '';
            if (lastMsg.createdAt) {
              lastMessageTime = new Date(lastMsg.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });
            }
          }
        } catch (err) {
          // Ignore query error
        }

        return {
          ...c,
          id: cId,
          unreadCount: unreadCount || 0,
          lastMessage: lastMessageText,
          lastMessageTime
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: contactsWithMeta
    });
  } catch (error) {
    console.error('getContacts error:', error);
    next(error);
  }
};

/**
 * Get unread internal message count for the logged-in user (used for notification badge)
 */
export const getUnreadMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Find all unread messages where current user is the receiver
    const unreadMessages = await InternalMessage.find({
      receiverId: userId,
      isRead: false
    }).populate('sender');

    const notifications = unreadMessages.map(m => ({
      id: `msg-${m._id || m.id}`,
      type: 'message',
      senderId: m.senderId,
      senderName: m.sender?.name || 'Staff Member',
      senderRole: m.sender?.role || 'Staff',
      message: m.message,
      createdAt: m.createdAt
    }));

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unsend a single internal message by ID (Instagram style unsend)
 */
export const deleteSingleMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const activeUserId = req.user.id;

    const msg = await InternalMessage.findById(id);
    if (!msg) {
      res.statusCode = 404;
      throw new Error('Message not found');
    }

    const senderStr = String(msg.senderId || '').trim();
    const activeStr = String(activeUserId || '').trim();

    if (senderStr !== activeStr && req.user.role !== 'SuperAdmin') {
      res.statusCode = 403;
      throw new Error('You can only unsend your own messages');
    }

    await InternalMessage.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Message unsent successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};
