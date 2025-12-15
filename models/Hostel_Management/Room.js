const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  hostel_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  room_number: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  current_occupancy: {
    type: Number,
    default: 0,
    min: 0
  },
  floor_number: {
    type: Number,
    required: true
  },
  room_type: {
    type: String,
    enum: ['AC', 'Non-AC'],
    required: true
  },
  image: {
    public_id: String,
    url: String
  }
}, {
  timestamps: true
});


RoomSchema.index({ hostel_id: 1, room_number: 1 }, { unique: true });

// module.exports = mongoose.model('Room', RoomSchema);
module.exports = RoomSchema;
