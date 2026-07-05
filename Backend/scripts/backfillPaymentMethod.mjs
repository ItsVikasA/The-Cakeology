// One-time migration: backfill `paymentMethod` on orders created before the
// field existed. These predate the WhatsApp checkout feature, when Razorpay was
// the only payment path — so they are 'razorpay'. Idempotent: only touches rows
// where the field is missing or null.
//
// Run from the Backend/ directory:  node scripts/backfillPaymentMethod.mjs
import 'dotenv/config';
import mongoose from 'mongoose';
import orderModel from '../src/models/orderModel.js';

await mongoose.connect(process.env.MONGO_URI);

const filter = { $or: [{ paymentMethod: { $exists: false } }, { paymentMethod: null }] };
const toFix = await orderModel.countDocuments(filter);

const result = await orderModel.updateMany(filter, { $set: { paymentMethod: 'razorpay' } });

console.log(`Legacy orders needing backfill: ${toFix}`);
console.log(`Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}`);

const remaining = await orderModel.countDocuments(filter);
console.log(`Remaining without paymentMethod: ${remaining}`);

await mongoose.disconnect();
