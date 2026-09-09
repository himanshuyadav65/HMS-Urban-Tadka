import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { HotelInstance } from './Hotel.js';
import { RoomTypeInstance } from './RoomType.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const RoomInstance = sequelize.define('Room', {
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
  roomTypeId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: RoomTypeInstance,
      key: 'id',
    },
  },
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  roomType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  pricePerNight: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amenities: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('Available', 'Booked', 'Occupied', 'Cleaning', 'Maintenance'),
    defaultValue: 'Available',
  },
  description: {
    type: DataTypes.STRING,
  },
}, {
  tableName: 'Rooms',
});

RoomInstance.belongsTo(HotelInstance, { foreignKey: 'hotelId', as: 'hotel' });
RoomInstance.belongsTo(RoomTypeInstance, { foreignKey: 'roomTypeId', as: 'category' });

const Room = new MongooseModelWrapper(RoomInstance, 'Room');
export default Room;
export { RoomInstance };
