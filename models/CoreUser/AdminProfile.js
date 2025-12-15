const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  profileImage: { type: String, default: '/avatar.png' },
  bio: { type: String },
  role: { type: String, default: 'admin' },
  password: { type: String, required: true },
}, { timestamps: true });


AdminProfileSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


AdminProfileSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = AdminProfileSchema;
