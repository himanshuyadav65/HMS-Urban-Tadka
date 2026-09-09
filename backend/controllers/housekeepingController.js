import HousekeepingTask from '../models/HousekeepingTask.js';
import Room from '../models/Room.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';

/**
 * Assign Cleaning Task to a Housekeeper
 */
export const createHousekeepingTask = async (req, res, next) => {
  try {
    const { hotelId, roomId, staffId, remarks } = req.body;

    const task = await HousekeepingTask.create({
      hotelId,
      roomId,
      staffId,
      remarks,
      status: 'Dirty'
    });

    // Automatically flag the room status to Cleaning
    const room = await Room.findById(roomId);
    if (room) {
      room.status = 'Cleaning';
      await room.save();
    }

    res.status(201).json({
      success: true,
      message: 'Housekeeping task assigned',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Housekeeping Status (Housekeeping Cleaner action)
 */
export const updateCleaningStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body; // Dirty | Cleaning | Clean | Inspected

    const task = await HousekeepingTask.findById(id);
    if (!task) {
      res.statusCode = 404;
      throw new Error('Housekeeping task not found');
    }

    task.status = status;
    if (remarks !== undefined) task.remarks = remarks;
    await task.save();

    // If status is 'Inspected' or 'Clean', set Room status to Available; if 'Cleaning', set to Cleaning
    if (task.roomId) {
      const room = await Room.findById(task.roomId);
      if (room) {
        if (status === 'Inspected' || status === 'Clean') {
          room.status = 'Available';
        } else if (status === 'Cleaning' || status === 'Dirty') {
          room.status = 'Cleaning';
        }
        await room.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Cleaning status updated successfully',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

/**
 * File room repair maintenance request
 */
export const fileMaintenanceRequest = async (req, res, next) => {
  try {
    const { hotelId, roomId, subject, description, priority } = req.body;

    const request = await MaintenanceRequest.create({
      hotelId,
      roomId,
      subject,
      description,
      priority,
      status: 'Pending',
      reportedBy: req.user.id
    });

    // Mark the room status as Maintenance
    const room = await Room.findById(roomId);
    if (room) {
      room.status = 'Maintenance';
      await room.save();
    }

    res.status(201).json({
      success: true,
      message: 'Maintenance request filed and room status updated to Maintenance',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get assigned cleaning tasks for a specific Housekeeper
 */
export const getAssignedHousekeepingTasks = async (req, res, next) => {
  try {
    const tasks = await HousekeepingTask.find({ staffId: req.user.id }).populate('room');
    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all housekeeping tasks (Admin/Receptionist view)
 */
export const getAllHousekeepingTasks = async (req, res, next) => {
  try {
    const tasks = await HousekeepingTask.find({}).populate('room');
    res.status(200).json({
      success: true,
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};
