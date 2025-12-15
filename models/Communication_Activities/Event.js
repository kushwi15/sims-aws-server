const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  eventName: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  eventType: [{
    type: String,
    enum: ['Academic', 'Sport', 'Cultural', 'Meeting', 'Other'],
    default: 'Other',
  }],
  targetGroups: [{
    type: String,
    enum: ['all', 'all_students', 'all_teachers', 'all_parents'],
  }],
  targetAudience: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  status: {
    type: String,
    enum: ["upcoming", "ongoing", "completed", "cancelled"],
    default: "upcoming"
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
}, { timestamps: true });

module.exports = EventSchema;
