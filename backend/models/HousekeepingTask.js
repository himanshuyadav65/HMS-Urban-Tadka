import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { HotelInstance } from './Hotel.js';
import { RoomInstance } from './Room.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const HousekeepingTaskInstance = sequelize.define('HousekeepingTask', {
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
  roomId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: RoomInstance,
      key: 'id',
    },
  },
  staffId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Dirty', 'Cleaning', 'Clean', 'Inspected'),
    defaultValue: 'Dirty',
  },
  remarks: {
    type: DataTypes.STRING,
    defaultValue: '',
  }
}, {
  tableName: 'HousekeepingTasks',
});

HousekeepingTaskInstance.belongsTo(HotelInstance, { foreignKey: 'hotelId', as: 'hotel' });
HousekeepingTaskInstance.belongsTo(RoomInstance, { foreignKey: 'roomId', as: 'room' });

const HousekeepingTask = new MongooseModelWrapper(HousekeepingTaskInstance, 'HousekeepingTask');
export default HousekeepingTask;
export { HousekeepingTaskInstance };
