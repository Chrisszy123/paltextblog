const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  brevoContactId: {
    type: String
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['hero', 'cta', 'other'],
    default: 'other'
  }
});

// Index for faster queries
waitlistSchema.index({ email: 1 });
waitlistSchema.index({ createdAt: -1 });

const Waitlist = mongoose.model('Waitlist', waitlistSchema);

module.exports = Waitlist;

