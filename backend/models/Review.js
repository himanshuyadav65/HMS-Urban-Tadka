import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { CustomerInstance } from './Customer.js';
import { BookingInstance } from './Booking.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const ReviewInstance = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: BookingInstance,
      key: 'id',
    },
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: CustomerInstance,
      key: 'id',
    },
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
  reviewText: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '',
  },
  category: {
    type: DataTypes.ENUM('Overall', 'Room', 'Service', 'Food', 'Cleanliness', 'Staff'),
    defaultValue: 'Overall',
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  adminReply: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: '',
  },
  adminReplyAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'Reviews',
});

// Associations
ReviewInstance.belongsTo(CustomerInstance, { foreignKey: 'customerId', as: 'customer' });
ReviewInstance.belongsTo(BookingInstance, { foreignKey: 'bookingId', as: 'booking' });

const Review = new MongooseModelWrapper(ReviewInstance, 'Review');
export default Review;
export { ReviewInstance };
