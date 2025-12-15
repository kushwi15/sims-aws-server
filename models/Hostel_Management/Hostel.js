const mongoose = require('mongoose');

const HostelSchema = new mongoose.Schema({
  hostel_name: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
  },
  total_rooms: {
    type: Number,
    required: true,
    min: 1,
  },
  warden_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher', 
    required: true,
  },
  contact_number: {
    type: String,
    required: true,
  },
  hostel_image: {
    public_id: String,
    url: String
  }
}, { timestamps: true });

// module.exports = mongoose.model('Hostel', HostelSchema);
module.exports = HostelSchema;
