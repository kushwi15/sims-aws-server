
const mongoose = require("mongoose");

const BankDetailsSchema = new mongoose.Schema({
  bankName: { type: String, required: true },
  accountHolderName: { type: String, required: true },
  accountNumber:{type:String,required:true},
  ifscCode: { type: String, required: true },
  upiId:{type:String},
  qrFileName: {
    type:String
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
}, { timestamps: true });

module.exports = BankDetailsSchema;
