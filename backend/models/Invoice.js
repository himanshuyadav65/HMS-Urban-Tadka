import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { BookingInstance } from './Booking.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const InvoiceInstance = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true,
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: BookingInstance,
      key: 'id',
    },
  },
  invoiceDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  subtotal: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  tax: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  discount: {
    type: DataTypes.DOUBLE,
    allowNull: false,
    defaultValue: 0,
  },
  total: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
}, {
  tableName: 'Invoices',
});

// Setup Associations
InvoiceInstance.belongsTo(BookingInstance, { foreignKey: 'bookingId', as: 'booking' });

// Pre-save hook to generate user-friendly invoiceNumber
InvoiceInstance.beforeSave((invoice) => {
  if (!invoice.invoiceNumber) {
    const randomHex = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    invoice.invoiceNumber = `INV-${randomHex}`;
  }
});

const Invoice = new MongooseModelWrapper(InvoiceInstance, 'Invoice');
export default Invoice;
export { InvoiceInstance };
