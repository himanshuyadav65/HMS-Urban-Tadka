import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { BookingInstance } from './Booking.js';
import { RoomInstance } from './Room.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const BookingRoomInstance = sequelize.define('BookingRoom', {
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
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: RoomInstance,
      key: 'id',
    },
  },
  pricePerNight: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  }
}, {
  tableName: 'BookingRooms',
});

BookingRoomInstance.belongsTo(BookingInstance, { foreignKey: 'bookingId', as: 'booking' });
BookingRoomInstance.belongsTo(RoomInstance, { foreignKey: 'roomId', as: 'room' });

const BookingRoom = new MongooseModelWrapper(BookingRoomInstance, 'BookingRoom');
export default BookingRoom;
export { BookingRoomInstance };
