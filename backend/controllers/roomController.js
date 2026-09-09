import Room from '../models/Room.js';
import Booking from '../models/Booking.js';

/**
 * @desc    Create a new room
 * @route   POST /api/rooms
 * @access  Private / Admin
 */
export const createRoom = async (req, res, next) => {
  try {
    const { roomNumber, roomType, floor, pricePerNight, capacity, amenities, description } = req.body;

    // Check if room number already exists
    const roomExists = await Room.findOne({ roomNumber });
    if (roomExists) {
      res.statusCode = 400;
      throw new Error(`Room number ${roomNumber} already exists`);
    }

    const room = await Room.create({
      roomNumber,
      roomType,
      floor: parseInt(floor),
      pricePerNight: parseFloat(pricePerNight),
      capacity: parseInt(capacity),
      amenities: amenities || [],
      description,
      status: 'Available',
    });

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all rooms with filtering & pagination
 * @route   GET /api/rooms
 * @access  Public / Private
 */
export const getRooms = async (req, res, next) => {
  try {
    const { roomType, status, capacity, minPrice, maxPrice, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (roomType) {
      query.roomType = roomType;
    }
    if (status) {
      query.status = status;
    }
    if (capacity) {
      query.capacity = { $gte: parseInt(capacity) };
    }
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerNight.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.roomNumber = { $regex: search, $options: 'i' };
    }

    const count = await Room.countDocuments(query);
    const rooms = await Room.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ roomNumber: 1 });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single room by ID
 * @route   GET /api/rooms/:id
 * @access  Public / Private
 */
export const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      res.statusCode = 404;
      throw new Error('Room not found');
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a room
 * @route   PUT /api/rooms/:id
 * @access  Private / Admin
 */
export const updateRoom = async (req, res, next) => {
  try {
    const { roomNumber, roomType, floor, pricePerNight, capacity, amenities, status, description } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) {
      res.statusCode = 404;
      throw new Error('Room not found');
    }

    // Check if room number is changed and overlaps with another
    if (roomNumber && roomNumber !== room.roomNumber) {
      const roomExists = await Room.findOne({ roomNumber });
      if (roomExists) {
        res.statusCode = 400;
        throw new Error(`Room number ${roomNumber} already exists`);
      }
      room.roomNumber = roomNumber;
    }

    if (roomType) room.roomType = roomType;
    if (floor !== undefined) room.floor = parseInt(floor);
    if (pricePerNight !== undefined) room.pricePerNight = parseFloat(pricePerNight);
    if (capacity !== undefined) room.capacity = parseInt(capacity);
    if (amenities) room.amenities = amenities;
    if (status) room.status = status;
    if (description !== undefined) room.description = description;

    const updatedRoom = await room.save();

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a room
 * @route   DELETE /api/rooms/:id
 * @access  Private / Admin
 */
export const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      res.statusCode = 404;
      throw new Error('Room not found');
    }

    // Check if there are active bookings on this room
    const activeBooking = await Booking.findOne({
      room: room._id,
      bookingStatus: { $in: ['Confirmed', 'CheckedIn'] }
    });

    if (activeBooking) {
      res.statusCode = 400;
      throw new Error('Cannot delete room as it has an active booking associated with it');
    }

    await Room.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload room images
 * @route   POST /api/rooms/:id/images
 * @access  Private / Admin
 */
export const uploadRoomImages = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      res.statusCode = 404;
      throw new Error('Room not found');
    }

    if (!req.files || req.files.length === 0) {
      res.statusCode = 400;
      throw new Error('Please upload at least one image file');
    }

    // Map uploaded files to relative URLs/paths
    const filePaths = req.files.map(file => `/uploads/${file.filename}`);
    room.images.push(...filePaths);
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: room.images,
    });
  } catch (error) {
    next(error);
  }
};
