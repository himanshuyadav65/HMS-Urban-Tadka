import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { CustomerInstance } from './Customer.js';
import { RoomInstance } from './Room.js';
import { HotelInstance } from './Hotel.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const BookingInstance = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bookingId: {
    type: DataTypes.STRING,
    unique: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: CustomerInstance,
      key: 'id',
    },
  },
  hotelId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: RoomInstance,
      key: 'id',
    },
  },
  checkIn: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  checkOut: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  totalDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  pricePerNight: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  subtotal: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  tax: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
  },
  discount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
  },
  totalAmount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  advanceAmount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
  },
  paidAmount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
  },
  originalCheckOut: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  extensionNights: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  extensionAmount: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  isExtended: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  bookingStatus: {
    type: DataTypes.ENUM('Pending', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled'),
    defaultValue: 'Pending',
  },
  paymentStatus: {
    type: DataTypes.ENUM('Unpaid', 'PartiallyPaid', 'Paid', 'Failed'),
    defaultValue: 'Unpaid',
  },
}, {
  tableName: 'Bookings',
});

// Setup Associations (naming keys uniquely to prevent collision)
BookingInstance.belongsTo(CustomerInstance, { foreignKey: 'customerId', as: 'customer' });
BookingInstance.belongsTo(RoomInstance, { foreignKey: 'roomId', as: 'room' });
BookingInstance.belongsTo(HotelInstance, { foreignKey: 'hotelId', as: 'hotel' });

// Pre-save hook to generate user-friendly bookingId if not provided
BookingInstance.beforeSave((booking) => {
  if (!booking.bookingId) {
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    booking.bookingId = `BK-${randomHex}`;
  }
});

const Booking = new MongooseModelWrapper(BookingInstance, 'Booking');
export default Booking;
export { BookingInstance };
