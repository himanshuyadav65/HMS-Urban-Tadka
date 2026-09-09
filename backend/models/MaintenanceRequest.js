import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { HotelInstance } from './Hotel.js';
import { RoomInstance } from './Room.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const MaintenanceRequestInstance = sequelize.define('MaintenanceRequest', {
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
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
    defaultValue: 'Medium',
  },
  status: {
    type: DataTypes.ENUM('Pending', 'InProgress', 'Resolved', 'Cancelled'),
    defaultValue: 'Pending',
  },
  reportedBy: {
    type: DataTypes.UUID,
    allowNull: true,
  }
}, {
  tableName: 'MaintenanceRequests',
});

MaintenanceRequestInstance.belongsTo(HotelInstance, { foreignKey: 'hotelId', as: 'hotel' });
MaintenanceRequestInstance.belongsTo(RoomInstance, { foreignKey: 'roomId', as: 'room' });

const MaintenanceRequest = new MongooseModelWrapper(MaintenanceRequestInstance, 'MaintenanceRequest');
export default MaintenanceRequest;
export { MaintenanceRequestInstance };
