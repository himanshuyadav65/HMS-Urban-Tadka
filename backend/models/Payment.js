import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { BookingInstance } from './Booking.js';
import { CustomerInstance } from './Customer.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const PaymentInstance = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
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
  paymentMethod: {
    type: DataTypes.ENUM('Cash', 'Card', 'UPI', 'Stripe', 'Razorpay', 'Other'),
    defaultValue: 'Cash',
  },
  amount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'INR',
  },
  paymentId: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  transactionId: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  paidAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  paymentStatus: {
    type: DataTypes.ENUM('Pending', 'Completed', 'Failed', 'Refunded'),
    defaultValue: 'Pending',
  },
  refundStatus: {
    type: DataTypes.ENUM('None', 'Pending', 'Processed', 'Failed'),
    defaultValue: 'None',
  },
  refundHistory: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
}, {
  tableName: 'Payments',
});

// Setup Associations
PaymentInstance.belongsTo(BookingInstance, { foreignKey: 'bookingId', as: 'booking' });
PaymentInstance.belongsTo(CustomerInstance, { foreignKey: 'customerId', as: 'customer' });

const Payment = new MongooseModelWrapper(PaymentInstance, 'Payment');
export default Payment;
export { PaymentInstance };
