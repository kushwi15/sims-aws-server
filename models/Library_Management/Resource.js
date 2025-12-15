const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  topic: { type: String },
  classes: [{ type: String }], 
  description: { type: String },
  type: { type: String, enum: ['pdf', 'image', 'video', 'link'], required: true },
  url: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
});

module.exports = ResourceSchema;