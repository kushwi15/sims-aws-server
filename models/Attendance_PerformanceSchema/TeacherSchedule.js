const mongoose = require('mongoose');

const TeacherScheduleSchema = new mongoose.Schema({
  teacherId: { 
    type: String, 
    required: [true, 'Teacher ID is required'],
    trim: true
  },
  dayOfWeek: { 
    type: String, 
    required: [true, 'Day of week is required'],
    enum: {
      values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      message: 'Day of week must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday'
    }
  },
  startTime: { 
    type: String, 
    required: [true, 'Start time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
  },
  endTime: { 
    type: String, 
    required: [true, 'End time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
  },
  subject: { 
    type: String, 
    required: [true, 'Subject is required'],
    trim: true
  },
  period: { 
    type: String, 
    required: [true, 'Class ID is required'],
    trim: true
  },
  className: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true
  },
  sectionName: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true
  },
  createdAt:{
    type: Date,
    default: Date.now
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  teacher_id:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    reqquired: true
  },
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Custom validation to ensure end time is after start time
TeacherScheduleSchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    const start = new Date(`2000-01-01T${this.startTime}:00`);
    const end = new Date(`2000-01-01T${this.endTime}:00`);
    
    if (end <= start) {
      return next(new Error('End time must be after start time'));
    }
  }
  next();
});

// Index for better query performance
TeacherScheduleSchema.index({ teacherId: 1, dayOfWeek: 1 });
TeacherScheduleSchema.index({ classId: 1, dayOfWeek: 1 });

module.exports = TeacherScheduleSchema;