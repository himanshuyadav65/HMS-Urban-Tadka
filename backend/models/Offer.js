import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { HotelInstance } from './Hotel.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const OfferInstance = sequelize.define('Offer', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  discountPercentage: {
    type: DataTypes.DOUBLE,
    defaultValue: 0,
  },
  bannerImage: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  startDate: {
    type: DataTypes.DATE,
  },
  endDate: {
    type: DataTypes.DATE,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
}, {
  tableName: 'Offers',
});

OfferInstance.belongsTo(HotelInstance, { foreignKey: 'hotelId', as: 'hotel' });

const Offer = new MongooseModelWrapper(OfferInstance, 'Offer');
export default Offer;
export { OfferInstance };
