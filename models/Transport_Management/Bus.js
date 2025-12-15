
const mongoose = require("mongoose");

const BusSchema = new mongoose.Schema({
  bus_number: {
    type: String,
    unique: true,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  driver_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver",
    required: true,
  },
  route_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BusRoute",
    required: true,
  },
  contact_number: {
    type: String,
    required: true,
  },
  bus_image: {
    type: String, 
    default: null,
  },
}, { timestamps: true });

// module.exports = mongoose.model("Bus", BusSchema);
module.exports = BusSchema;
