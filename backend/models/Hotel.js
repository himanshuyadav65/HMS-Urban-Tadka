import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const HotelInstance = sequelize.define('Hotel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  rating: {
    type: DataTypes.DOUBLE,
    defaultValue: 5.0,
  },
  images: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Active', 'Suspended'),
    defaultValue: 'Pending',
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: true,
  }
}, {
  tableName: 'Hotels',
});

const Hotel = new MongooseModelWrapper(HotelInstance, 'Hotel');
export default Hotel;
export { HotelInstance };
