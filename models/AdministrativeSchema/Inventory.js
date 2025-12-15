const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    item_id: {
      type: String,
      required: true,
      unique: true,
    },
    item_name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ["Books", "Stationery", "Lab"],
      required: true,
    },
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "assigned_model",
      default: null,
    },
    assigned_model: {
      type: String,
      enum: ["Student", "Teacher"],
    },
    image_url: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// module.exports = mongoose.model("Inventory", InventorySchema);
module.exports = InventorySchema;
