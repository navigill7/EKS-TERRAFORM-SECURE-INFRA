// backend/routes/otp.js
import express from 'express';
import bcrypt from 'bcrypt';
import OTP from '../models/OTP.js';
import User from '../models/User.js';
import { generateOTP, sendOTPEmail } from '../controllers/emailService.js';

const router = express.Router();

// Send OTP
router.post('/send', async (req, res) => {
  try {
    const { email, firstName, lastName, password, picturePath, location, Year } = req.body;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log(`🔐 Generated OTP for ${email}: ${otp}`);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Delete existing OTP
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Store OTP with user data
    const otpDoc = new OTP({
      email: email.toLowerCase(),
      otp: otp,
      userData: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: passwordHash,
        picturePath: picturePath || '',
        location: location || '',
        Year: Year || '',
      },
    });

    await otpDoc.save();

    // Send email
    await sendOTPEmail(email, otp, firstName);

    res.status(200).json({
      message: 'OTP sent successfully',
      email: email,
    });
  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const otpDoc = await OTP.findOne({ email: email.toLowerCase() });

    if (!otpDoc) {
      return res.status(400).json({ message: 'OTP expired or not found' });
    }

    if (otpDoc.attempts >= 5) {
      await OTP.deleteOne({ email: email.toLowerCase() });
      return res.status(400).json({ message: 'Too many failed attempts' });
    }

    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({ 
        message: 'Invalid OTP',
        attemptsLeft: 5 - otpDoc.attempts
      });
    }

    // Create user
    const { userData } = otpDoc;
    const newUser = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      picturePath: userData.picturePath,
      location: userData.location,
      Year: userData.Year,
      friends: [],
      viewedProfile: Math.floor(Math.random() * 10000),
      impressions: Math.floor(Math.random() * 10000),
    });

    const savedUser = await newUser.save();
    await OTP.deleteOne({ email: email.toLowerCase() });

    const { password, ...userWithoutPassword } = savedUser.toObject();

    res.status(201).json({
      message: 'Account created successfully',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
});

// Resend OTP
router.post('/resend', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const otpDoc = await OTP.findOne({ email: email.toLowerCase() });

    if (!otpDoc) {
      return res.status(400).json({ message: 'No pending verification found' });
    }

    const newOTP = generateOTP();
    console.log(`🔐 Resent OTP for ${email}: ${newOTP}`);

    otpDoc.otp = newOTP;
    otpDoc.attempts = 0;
    otpDoc.createdAt = new Date();
    await otpDoc.save();

    await sendOTPEmail(email, newOTP, otpDoc.userData.firstName);

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('❌ Error resending OTP:', error);
    res.status(500).json({ message: 'Failed to resend OTP', error: error.message });
  }
});

export default router;