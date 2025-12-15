

const mongoose = require("mongoose");
const { Schema } = mongoose;

const SalarySlipSchema = new Schema(
  {
    slip_id: {
      type: Schema.Types.ObjectId,
      auto: true,
    },
    payment_id: {
      type: Schema.Types.ObjectId,
      ref: "SalaryPayment",
      required: true,
    },
    generated_by: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    download_url: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// module.exports = mongoose.model("SalarySlip", SalarySlipSchema);
module.exports = SalarySlipSchema;
