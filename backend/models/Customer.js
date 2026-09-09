import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const CustomerInstance = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    validate: {
      isEmail: true,
    },
  },
  address: {
    type: DataTypes.STRING,
  },
  governmentId: {
    type: DataTypes.JSON,
    defaultValue: {},
  },
  idProofImage: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
}, {
  tableName: 'Customers',
});

const Customer = new MongooseModelWrapper(CustomerInstance, 'Customer');
export default Customer;
export { CustomerInstance };
