

const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    media_url: {
      type: String, 
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false }
  }
);

// module.exports = mongoose.model("Notification", NotificationSchema);
module.exports = NotificationSchema;
