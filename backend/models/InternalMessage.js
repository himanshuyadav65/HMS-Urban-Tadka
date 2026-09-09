import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { UserInstance } from './User.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const InternalMessageInstance = sequelize.define('InternalMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  senderId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: UserInstance,
      key: 'id',
    },
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: UserInstance,
      key: 'id',
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: 'InternalMessages',
});

InternalMessageInstance.belongsTo(UserInstance, { foreignKey: 'senderId', as: 'sender' });
InternalMessageInstance.belongsTo(UserInstance, { foreignKey: 'receiverId', as: 'receiver' });

const InternalMessage = new MongooseModelWrapper(InternalMessageInstance, 'InternalMessage');
export default InternalMessage;
export { InternalMessageInstance };
