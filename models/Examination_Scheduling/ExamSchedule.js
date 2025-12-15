
const mongoose = require('mongoose');

const subjectSlotSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: String,  
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/ 
  },
  time: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ 
  }
});
const classEnum = [
  'Nursery',
  'LKG',
  'UKG',
  ...Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`) 
];

const examScheduleSchema = new mongoose.Schema({
  classId: {
    type: String,
    required: true,
    enum: classEnum 
  },
  examType: {
    type: String,
    required: true,
    enum: [
      "Formative Assessment 1", "Formative Assessment 2", "Formative Assessment 3",
      "Summative Assessment 1", "Summative Assessment 2", "Summative Assessment 3"
    ]
  },
  subjectSlots: {
    type: [subjectSlotSchema],
    required: true,
    validate: {
      validator: function(v) {
        return v.length > 0; 
      },
      message: 'At least one subject slot is required.'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
});

module.exports = examScheduleSchema;
