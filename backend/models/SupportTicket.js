import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { CustomerInstance } from './Customer.js';
import { BookingInstance } from './Booking.js';
import { UserInstance } from './User.js';
import { HotelInstance } from './Hotel.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const SupportTicketInstance = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ticketId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: CustomerInstance,
      key: 'id',
    },
  },
  bookingId: {
    type: DataTypes.UUID,
    references: {
      model: BookingInstance,
      key: 'id',
    },
  },
  hotelId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM(
      'Room Booking',
      'Payment',
      'Refund',
      'Check-in',
      'Check-out',
      'Documents',
      'Complaint',
      'Technical Issue',
      'Suggestion',
      'Other'
    ),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  attachment: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  status: {
    type: DataTypes.ENUM('Open', 'In Progress', 'Resolved', 'Closed'),
    defaultValue: 'Open',
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
    defaultValue: 'Medium',
  },
  assignedAdminId: {
    type: DataTypes.UUID,
    references: {
      model: UserInstance,
      key: 'id',
    },
  },
  internalNotes: {
    type: DataTypes.TEXT,
    defaultValue: '',
  },
  isReadByCustomer: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isReadByAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  messages: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  tableName: 'SupportTickets',
});

// Setup Associations
SupportTicketInstance.belongsTo(CustomerInstance, { foreignKey: 'customerId', as: 'customer' });
SupportTicketInstance.belongsTo(BookingInstance, { foreignKey: 'bookingId', as: 'booking' });
SupportTicketInstance.belongsTo(UserInstance, { foreignKey: 'assignedAdminId', as: 'assignedAdmin' });
SupportTicketInstance.belongsTo(HotelInstance, { foreignKey: 'hotelId', as: 'hotel' });

const SupportTicket = new MongooseModelWrapper(SupportTicketInstance, 'SupportTicket');
export default SupportTicket;
export { SupportTicketInstance };
