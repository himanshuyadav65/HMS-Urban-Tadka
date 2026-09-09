import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const AuditLogInstance = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  details: {
    type: DataTypes.TEXT,
    defaultValue: '',
  }
}, {
  tableName: 'AuditLogs',
});

const AuditLog = new MongooseModelWrapper(AuditLogInstance, 'AuditLog');
export default AuditLog;
export { AuditLogInstance };
