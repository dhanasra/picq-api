const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studioSchema = new Schema({
  studioName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v); // Basic email validation
      },
      message: (props) => `${props.value} is not a valid email!`
    }
  },
  phoneNumber: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        return /^[0-9]{10}$/.test(v); // 10-digit phone number validation
      },
      message: (props) => `${props.value} is not a valid phone number!`
    }
  },
  address: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: "Addresses"
  },
  picture: {
    type: String, 
    default: null
  },
  banner: {
    type: String,
    default: null
  },  
  ownerType: {
    type: String,
    enum: ["individual", "company"],
    default: null
  },
  images: {
    type: [String],
    default: []
  },
  operationalHours: {
    opensAt: {
      type: Number,
      default: null
    },
    closesAt: {
      type: Number,
      default: null
    }
  },
  openDays: {
    type: [Number],
    validate: {
      validator: function (v) {
        return v.every(day => day >= 0 && day <= 6);
      },
      message: (props) => `${props.value} contains an invalid day. Days must be integers between 0 and 6.`
    },
    default: []
  },
  studioType: { 
    type: String, 
    enum: ["rentals", "shoots", "both"],
    default: null
  },  
  services: { 
    type: String, 
    enum: ["photography", "videography", "both"],
    default: null
  },  
  offerings: { 
    type: [String], 
    default: [] 
  },
  documents: {
    type: Schema.Types.ObjectId,
    ref: "Documents",
    default: null
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
  registrationStatus: {
    type: String,
    enum: ["pending", "completed", "awaiting_approval", "approved", "paused", "rejected", "invited"],
    default: "pending"
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const getStudioModel = () => {
  return mongoose.model("Studios", studioSchema, "Studios");
};

module.exports = {
  getStudioModel
};