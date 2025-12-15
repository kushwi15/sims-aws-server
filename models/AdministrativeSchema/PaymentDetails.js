const mongoose = require("mongoose");

const PaymentDetailsSchema = new mongoose.Schema({
  
  fee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fee",
    // required: true,
  },
  
  
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    // required: true,
  },
  
  student_name: {
    type: String,
    // required: true,
  },
  
  class: {
    type: String,
    // required: true,
  },
  
  section: {
    type: String,
    // required: true,
  },
  
  
  term: {
    type: String,
    enum: ["first", "second", "third"],
    // required: true,
  },
  
  term_name: {
    type: String,
    enum: ["1st Term", "2nd Term", "3rd Term"],
    // required: true,
  },
  
  amount_paid: {
    type: Number,
    // required: true,
  },
  
  payment_date: {
    type: Date,
    // required: true,
    default: Date.now,
  },
  
  payment_method: {
    type: String,
    enum: ["Cash", "Cheque", "Online", "Card", "Bank Transfer", "UPI"],
    // required: true,
  },
  
  transaction_id: {
    type: String,
    // required: true,
    unique: true,
  },
  
  invoice_id: {
    type: String,
    // required: true,
    unique: true,
  },
  
  
  status: {
    type: String,
    enum: ["Pending", "Verified", "Rejected"],
    default: "Pending",
  },
  
  
  receipt_url: {
    type: String,
    default: "",
  },
  
  
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null,
  },
  
  verified_at: {
    type: Date,
    default: null,
  },
  
  verification_notes: {
    type: String,
    default: "",
  },
  
  
  paid_by: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'paid_by_model', 
    // required: true,
  },
  
  paid_by_model: {
    type: String,
    enum: ["Parent", "Student", "User","Admin"],
    // required: true,
  },
  
  paid_by_name: {
    type: String,
    // required: true,
  },
  
  paid_by_role: {
    type: String,
    enum: ["parent", "student"],
    // required: true,
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
}, {
  timestamps: true
});


PaymentDetailsSchema.index({ student_id: 1, payment_date: -1 });
PaymentDetailsSchema.index({ transaction_id: 1 });
PaymentDetailsSchema.index({ invoice_id: 1 });
PaymentDetailsSchema.index({ status: 1 });

module.exports = PaymentDetailsSchema;