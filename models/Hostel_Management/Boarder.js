const mongoose = require("mongoose");

const BoarderSchema = new mongoose.Schema({
  allocation_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    index: true,
  },
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room",
    required: true,
  },
  check_in_date: {
    type: Date,
    required: true,
  },
  check_out_date: {
    type: Date,
    default: null,
  },
  annual_fee: {
    type: Number,
    required: true,
  },
  emergency_contact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    document_url: { type: String }, 
  },
}, {
  timestamps: true,
});

// module.exports = mongoose.model("Boarder", BoarderSchema);
module.exports = BoarderSchema;
