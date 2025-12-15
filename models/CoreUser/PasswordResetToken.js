const mongoose = require('mongoose');

const PasswordResetTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired tokens
  },
  used: {
    type: Boolean,
    default: false
  },
  userType: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'parent'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
PasswordResetTokenSchema.index({ email: 1, token: 1 });
PasswordResetTokenSchema.index({ email: 1, otp: 1 });

// module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
module.exports = PasswordResetTokenSchema;
