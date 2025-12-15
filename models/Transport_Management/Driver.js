const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  license_number: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String, 
    required: false,
  },
}, { timestamps: true });

// module.exports = mongoose.model('Driver', DriverSchema);
module.exports = DriverSchema;
