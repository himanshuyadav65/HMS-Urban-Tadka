import dotenv from 'dotenv';
dotenv.config();

import Room from './models/Room.js';

async function check() {
  try {
    const rooms = await Room.find({});
    console.log("ROOMS RESPONSE FORMAT:");
    for (let r of rooms) {
      console.log(`- Room ${r.roomNumber}: amenities type: ${typeof r.amenities}, isArray: ${Array.isArray(r.amenities)}, value:`, r.amenities);
    }
  } catch (error) {
    console.error("Error during check:", error);
  }
  process.exit(0);
}

check();
