import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { HotelInstance } from './Hotel.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const CouponInstance = sequelize.define('Coupon', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  hotelId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: HotelInstance,
      key: 'id',
    },
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  discountType: {
    type: DataTypes.ENUM('Percentage', 'Flat'),
    defaultValue: 'Percentage',
  },
  discountValue: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  expiryDate: {
    type: DataTypes.DATE,
  },
  minBookingAmount: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: 'Coupons',
});

CouponInstance.belongsTo(HotelInstance, { foreignKey: 'hotelId', as: 'hotel' });

const Coupon = new MongooseModelWrapper(CouponInstance, 'Coupon');
export default Coupon;
export { CouponInstance };
