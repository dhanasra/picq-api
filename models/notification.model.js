const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const _notificationSchema = new Schema({
  userID: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    default: null
  },
  category: {
    type: String,
    enum: ["promotion", "booking"],
    required: true
  },
  picture: {
    type: String,
    default: null
  },
  title: {
    type: String,
    default: null
  },
  content: {
    type: String,
    required: true
  },
  action: {
    type: {
      label: String,   
      url: String   
    },
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  created: {
    type: Date,
    default: Date.now,
  }
});

const getNotificationsModel = () => {
  return mongoose.model("Notifications", _notificationSchema, "Notifications");
};

module.exports = {
  getNotificationsModel
};
