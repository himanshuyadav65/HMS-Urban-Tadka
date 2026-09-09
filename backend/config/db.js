import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbName = process.env.DB_NAME || 'hotel_db';
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = process.env.DB_PORT || 3306;

// Automatically create database if not exists
try {
  const connection = await mysql.createConnection({
    host: dbHost,
    port: parseInt(dbPort),
    user: dbUser,
    password: dbPassword
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  await connection.end();
  console.log(`Database '${dbName}' verified or created successfully.`);
} catch (err) {
  console.warn(`Could not verify/create database automatically: ${err.message}`);
}

const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: parseInt(dbPort),
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: true,
    },
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connected successfully (via Sequelize)...');

    // Dynamically import models to set up associations
    const { default: User } = await import('../models/User.js');
    const { default: Customer } = await import('../models/Customer.js');
    const { default: Room } = await import('../models/Room.js');
    const { default: Booking } = await import('../models/Booking.js');
    const { default: Payment } = await import('../models/Payment.js');
    const { default: Invoice } = await import('../models/Invoice.js');
    const { default: SupportTicket } = await import('../models/SupportTicket.js');

    const { default: Hotel } = await import('../models/Hotel.js');
    const { default: RoomType } = await import('../models/RoomType.js');
    const { default: BookingRoom } = await import('../models/BookingRoom.js');
    const { default: HousekeepingTask } = await import('../models/HousekeepingTask.js');
    const { default: MaintenanceRequest } = await import('../models/MaintenanceRequest.js');
    const { default: Coupon } = await import('../models/Coupon.js');
    const { default: Offer } = await import('../models/Offer.js');
    const { default: AuditLog } = await import('../models/AuditLog.js');
    const { default: OwnerHotel } = await import('../models/OwnerHotel.js');
    const { default: InternalMessage } = await import('../models/InternalMessage.js');
    const { default: Review } = await import('../models/Review.js');

    const forceSync = process.env.FORCE_SYNC === 'true';
    if (forceSync) {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await sequelize.sync({ force: true });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } else {
      try {
        await sequelize.sync();
      } catch (syncErr) {
        console.warn('Sequelize sync warning, trying base sync:', syncErr.message);
        await sequelize.sync({ alter: false });
      }
    }
    console.log(`Database tables synchronized successfully.`);
  } catch (error) {
    console.error(`Database connection or sync error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
export { sequelize };
