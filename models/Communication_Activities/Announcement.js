const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  target:[{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  targetGroups: [{
    type: String,
    enum: ['all', 'all_students', 'all_teachers', 'all_parents', 'staff'],
  }],
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  section: {
    type: String,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String, 
    enum: ["active","draft"],
    default: "active"
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
});

module.exports = AnnouncementSchema;
