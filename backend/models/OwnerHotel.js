import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { HotelInstance } from './Hotel.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const OwnerHotelInstance = sequelize.define('OwnerHotel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  hotelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: HotelInstance,
      key: 'id',
    },
  },
}, {
  tableName: 'OwnerHotels',
});

OwnerHotelInstance.belongsTo(HotelInstance, { foreignKey: 'hotelId', as: 'hotel' });

const OwnerHotel = new MongooseModelWrapper(OwnerHotelInstance, 'OwnerHotel');
export default OwnerHotel;
export { OwnerHotelInstance };
