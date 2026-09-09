import dotenv from 'dotenv';
import connectDB, { sequelize } from '../config/db.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Customer from '../models/Customer.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import SupportTicket from '../models/SupportTicket.js';
import Hotel from '../models/Hotel.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    process.env.FORCE_SYNC = 'true';
    await connectDB();
    console.log('Database connected for seeding...');

    // Temporarily disable foreign key checks to safely truncate tables
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear existing data
    await User.deleteMany();
    await Room.deleteMany();
    await Customer.deleteMany();
    await Booking.deleteMany();
    await Payment.deleteMany();
    await Invoice.deleteMany();
    await SupportTicket.deleteMany();
    await Hotel.deleteMany();

    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Cleared all collections.');

    // 0. Seed Hotel
    const hotel = await Hotel.create({
      name: 'Urban Tadka',
      email: 'contact@Urban Tadkahotel.com',
      phone: '+1 (555) 019-2834',
      address: '123 Luxury Way, Paradise Valley, CA 90210',
      city: 'Paradise Valley',
      status: 'Active',
    });

    // 1. Seed Users
    const admin = await User.create({
      name: 'System Super Admin',
      email: 'superadmin@system.com',
      phone: '+1 (555) 011-2233',
      password: 'superadminpassword',
      role: 'SuperAdmin',
      hotelId: hotel.id,
    });

    const owner = await User.create({
      name: 'Devendra Owner',
      email: 'owner@hotel.com',
      phone: '+1 (555) 011-9988',
      password: 'ownerpassword',
      role: 'HotelOwner',
      hotelId: hotel.id,
    });

    const receptionist = await User.create({
      name: 'Sarah Receptionist',
      email: 'receptionist@hotel.com',
      phone: '+1 (555) 011-4455',
      password: 'receptionistpassword',
      role: 'Receptionist',
      hotelId: hotel.id,
    });

    const housekeeper = await User.create({
      name: 'Ramesh Housekeeper',
      email: 'housekeeper@hotel.com',
      phone: '+1 (555) 011-7766',
      password: 'housekeeperpassword',
      role: 'Housekeeping',
      hotelId: hotel.id,
    });

    const customerUser = await User.create({
      name: 'Alice Guest',
      email: 'alice@guest.com',
      phone: '+1 (555) 011-8899',
      password: 'guestpassword',
      role: 'Customer',
      documents: [
        {
          _id: 'doc-alice-aadhaar-101',
          docType: 'Aadhaar Card',
          docPath: '/uploads/documents/document-1785495234724-567423124.jpeg',
          status: 'Verified',
          uploadedAt: new Date(Date.now() - 3600000), // 1 hour ago
        }
      ]
    });

    const johnUser = await User.create({
      name: 'John Doe',
      email: 'john.doe@gmail.com',
      phone: '+1 (555) 123-4567',
      password: 'guestpassword',
      role: 'Customer',
      documents: [
        {
          _id: 'doc-john-passport-102',
          docType: 'Passport',
          docPath: '/uploads/documents/document-1784717279735-206737079.jpeg',
          status: 'Verified',
          uploadedAt: new Date(Date.now() - 7200000), // 2 hours ago
        }
      ]
    });

    const janeUser = await User.create({
      name: 'Jane Smith',
      email: 'jane.smith@yahoo.com',
      phone: '+1 (555) 765-4321',
      password: 'guestpassword',
      role: 'Customer',
      documents: [
        {
          _id: 'doc-jane-license-103',
          docType: 'Driver License',
          docPath: '/uploads/documents/document-1784787757852-227176343.jpeg',
          status: 'Verified',
          uploadedAt: new Date(Date.now() - 10800000), // 3 hours ago
        }
      ]
    });

    console.log('Seeded Users: SuperAdmin, HotelOwner, Receptionist, Housekeeping, Customer.');

    // 2. Seed Rooms
    const rooms = await Room.insertMany([
      {
        roomNumber: '101',
        roomType: 'Single',
        floor: 1,
        pricePerNight: 80.00,
        capacity: 1,
        amenities: ['Free WiFi', 'Flat TV', 'Air Conditioning', 'Shower'],
        description: 'Cozy room for solo travelers, featuring standard single bed.',
        status: 'Available',
      },
      {
        roomNumber: '102',
        roomType: 'Double',
        floor: 1,
        pricePerNight: 120.00,
        capacity: 2,
        amenities: ['Free WiFi', 'Flat TV', 'Air Conditioning', 'Shower', 'Mini Fridge'],
        description: 'Standard double bed configuration, perfect for couples.',
        status: 'Available',
      },
      {
        roomNumber: '201',
        roomType: 'Deluxe',
        floor: 2,
        pricePerNight: 180.00,
        capacity: 2,
        amenities: ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Bathtub', 'Balcony', 'Coffee Maker'],
        description: 'Elegant deluxe room with beautiful garden view.',
        status: 'Available',
      },
      {
        roomNumber: '202',
        roomType: 'Deluxe',
        floor: 2,
        pricePerNight: 180.00,
        capacity: 2,
        amenities: ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Bathtub', 'Balcony', 'Coffee Maker'],
        description: 'Elegant deluxe room with beautiful garden view.',
        status: 'Available',
      },
      {
        roomNumber: '301',
        roomType: 'Suite',
        floor: 3,
        pricePerNight: 280.00,
        capacity: 4,
        amenities: ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Jacuzzi', 'Ocean View', 'Mini Bar', 'Living Area'],
        description: 'Executive family suite offering panoramic ocean scenery.',
        status: 'Booked', // We will link this to a seeded booking
      },
      {
        roomNumber: '302',
        roomType: 'Suite',
        floor: 3,
        pricePerNight: 300.00,
        capacity: 4,
        amenities: ['Free WiFi', 'Smart TV', 'Air Conditioning', 'Jacuzzi', 'Ocean View', 'Mini Bar', 'Living Area'],
        description: 'Executive family suite offering panoramic ocean scenery.',
        status: 'Maintenance',
      },
      {
        roomNumber: '104',
        roomType: 'Single',
        floor: 1,
        pricePerNight: 85.00,
        capacity: 1,
        amenities: ['Free WiFi', 'Flat TV', 'Air Conditioning'],
        description: 'Simple cozy room for business travel.',
        status: 'Cleaning',
      }
    ].map(r => ({ ...r, hotelId: hotel.id })));

    console.log(`Seeded ${rooms.length} Rooms.`);

    // 3. Seed Customers
    const customer1 = await Customer.create({
      name: 'John Doe',
      phone: '+1 (555) 123-4567',
      email: 'john.doe@gmail.com',
      address: '456 Elm Street, Seattle, WA',
      governmentId: {
        idType: 'Driver License',
        idNumber: 'WA-9876-XP',
      },
    });

    const customer2 = await Customer.create({
      name: 'Jane Smith',
      phone: '+1 (555) 765-4321',
      email: 'jane.smith@yahoo.com',
      address: '789 Pine Road, San Francisco, CA',
      governmentId: {
        idType: 'Passport',
        idNumber: 'US-PASS-102938',
      },
    });

    const customerAlice = await Customer.create({
      name: 'Alice Guest',
      phone: '+1 (555) 011-8899',
      email: 'alice@guest.com',
      address: '100 Beach Boulevard, Miami, FL',
      governmentId: {
        idType: 'Aadhaar',
        idNumber: 'VERIFIED_VIA_PROFILE',
      },
    });

    console.log('Seeded Customers: John Doe, Jane Smith.');

    // 4. Seed Booking & Payments (Historical and active)
    // Active booking in 301 (Suite, Price: 280, booked status)
    const checkInDate = new Date();
    checkInDate.setDate(checkInDate.getDate() - 2); // 2 days ago
    const checkOutDate = new Date();
    checkOutDate.setDate(checkOutDate.getDate() + 3); // 3 days from now
    
    // totalDays = 5
    const pricePerNight = 280.00;
    const totalDays = 5;
    const subtotal = pricePerNight * totalDays; // 1400
    const tax = subtotal * 0.18; // 252
    const discount = 100.00;
    const totalAmount = subtotal + tax - discount; // 1552

    const activeBooking = await Booking.create({
      customer: customer1._id,
      room: rooms.find(r => r.roomNumber === '301')._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalDays,
      pricePerNight,
      subtotal,
      tax,
      discount,
      totalAmount,
      bookingStatus: 'CheckedIn',
      paymentStatus: 'Paid',
    });

    // Create Invoice for booking
    const invoice = await Invoice.create({
      booking: activeBooking._id,
      subtotal,
      tax,
      discount,
      total: totalAmount,
    });

    // Create Payment for booking
    const payment = await Payment.create({
      booking: activeBooking._id,
      customer: customer1._id,
      paymentMethod: 'Card',
      amount: totalAmount,
      transactionId: 'TXN-9988776655',
      paymentDate: new Date(checkInDate),
      paymentStatus: 'Completed',
    });

    // Create a historical booking (finished) to show in charts
    const oldCheckIn = new Date();
    oldCheckIn.setDate(oldCheckIn.getDate() - 30);
    const oldCheckOut = new Date();
    oldCheckOut.setDate(oldCheckOut.getDate() - 25);

    const pastBooking = await Booking.create({
      customer: customer2._id,
      room: rooms.find(r => r.roomNumber === '201')._id, // Deluxe, 180
      checkIn: oldCheckIn,
      checkOut: oldCheckOut,
      totalDays: 5,
      pricePerNight: 180,
      subtotal: 900,
      tax: 162,
      discount: 0,
      totalAmount: 1062,
      bookingStatus: 'CheckedOut',
      paymentStatus: 'Paid',
    });

    await Invoice.create({
      booking: pastBooking._id,
      subtotal: 900,
      tax: 162,
      discount: 0,
      total: 1062,
    });

    await Payment.create({
      booking: pastBooking._id,
      customer: customer2._id,
      paymentMethod: 'UPI',
      amount: 1062,
      transactionId: 'TXN-5544332211',
      paymentDate: oldCheckIn,
      paymentStatus: 'Completed',
    });

    // Seed Support Tickets
    await SupportTicket.create([
      {
        ticketId: 'TKT-1001',
        customer: customerAlice._id,
        subject: 'Refund Request for Double Charge',
        category: 'Refund',
        description: 'I was charged twice on my credit card when checkout failed during payment reservation. Please refund the secondary charge of Rs 1552.',
        status: 'Open',
        priority: 'High',
        isReadByCustomer: true,
        isReadByAdmin: false,
        messages: [
          {
            senderType: 'Customer',
            senderId: customerUser._id,
            message: 'I was charged twice on my credit card when checkout failed during payment reservation. Please refund the secondary charge of Rs 1552.',
          }
        ]
      },
      {
        ticketId: 'TKT-1002',
        customer: customerAlice._id,
        subject: 'Late check-out request',
        category: 'Check-out',
        description: 'My flight is delayed, can I check out at 3:00 PM instead of 11:00 AM tomorrow?',
        status: 'In Progress',
        priority: 'Medium',
        isReadByCustomer: false,
        isReadByAdmin: true,
        messages: [
          {
            senderType: 'Customer',
            senderId: customerUser._id,
            message: 'My flight is delayed, can I check out at 3:00 PM instead of 11:00 AM tomorrow?',
          },
          {
            senderType: 'Admin',
            senderId: admin._id,
            message: 'Hi Alice, let us look into this with the reception desk to see if the room is booked for tomorrow. We will update you shortly.',
          }
        ]
      }
    ]);

    console.log('Seeded Active and Historical Booking Records.');
    console.log('Seeded Support Tickets.');
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Database seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
