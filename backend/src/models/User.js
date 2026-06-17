import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  branch: {
    type: String,
    trim: true,
    default: ''
  },
  graduationYear: {
    type: String,
    trim: true,
    default: ''
  },
  cgpa: {
    type: String,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  college: {
    type: String,
    default: ''
  },
  codeforcesHandle: {
    type: String,
    default: ''
  },
  codechefHandle: {
    type: String,
    default: ''
  },
  leetcodeHandle: {
    type: String,
    default: ''
  },
  friends: {
    type: [String], // Array of handles or user IDs
    default: []
  },
  credentials: [{
    platform: String,
    handle: String,
    token: String,
    linkedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
