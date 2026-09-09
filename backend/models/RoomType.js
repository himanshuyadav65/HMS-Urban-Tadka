import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { HotelInstance } from './Hotel.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const RoomTypeInstance = sequelize.define('RoomType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  hotelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: HotelInstance,
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  basePrice: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
  },
  amenities: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  description: {
    type: DataTypes.TEXT,
  }
}, {
  tableName: 'RoomTypes',
});

RoomTypeInstance.belongsTo(HotelInstance, { foreignKey: 'hotelId', as: 'hotel' });

const RoomType = new MongooseModelWrapper(RoomTypeInstance, 'RoomType');
export default RoomType;
export { RoomTypeInstance };
