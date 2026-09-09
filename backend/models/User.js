import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config/db.js';
import { MongooseModelWrapper } from '../config/mongoose-compat.js';

const UserInstance = sequelize.define('User', {
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
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('SuperAdmin', 'HotelOwner', 'Receptionist', 'Housekeeping', 'Customer'),
    defaultValue: 'Customer',
  },
  hotelId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  profileImage: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  address: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  dateOfBirth: {
    type: DataTypes.DATE,
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
  },
  emergencyContact: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  nationality: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  aadhaar: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  passport: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  drivingLicense: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  kycStatus: {
    type: DataTypes.ENUM('None', 'Pending', 'Verified', 'Rejected'),
    defaultValue: 'None',
  },
  kycVerificationDate: {
    type: DataTypes.DATE,
  },
  kycVerifiedBy: {
    type: DataTypes.UUID,
  },
  documents: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  isBlocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  resetPasswordOTP: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
  resetPasswordOTPExpires: {
    type: DataTypes.DATE,
  },
}, {
  tableName: 'Users',
});

// Hooks: password hashing
UserInstance.beforeSave(async (user) => {
  if (user.changed('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

// Instance Method
UserInstance.prototype.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = new MongooseModelWrapper(UserInstance, 'User');
export default User;
export { UserInstance };
