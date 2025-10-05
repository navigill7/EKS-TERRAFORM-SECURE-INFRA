// backend/models/OTP.js
import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: true,
  },
  userData: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Auto-delete after 10 minutes
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5,
  },
}, { timestamps: true });

OTPSchema.index({ email: 1 });

const OTP = mongoose.model('OTP', OTPSchema);

export default OTP;