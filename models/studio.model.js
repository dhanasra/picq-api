const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const individualRoomsSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  minTime: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: true,
  },
  services: {
    type: [String],
    default: []
  },
  price: {
    type: String,
    required: true,
  },
  offer: {
    type: Object,
    default: null
  },
  images: {
    type: [String],
    default: []
  },
  equipments: {
    type: [String],
    default: []
  },
  products: {
    type: [Object],
    default: []
  }
}, { _id: true });

const studioSchema = new Schema({
  studioName: {
    type: String,
    default: null,
    trim: true,
    minlength: [2, 'Studio name must be at least 2 characters long'],
    maxlength: [50, 'Studio name cannot exceed 50 characters'],
  },
  ownerType: {
    type: String,
    default: null
  },
  frontDeskPhone: {
    type: String,
    default: null
  },
  frontDeskPhoneVerified: {
    type: Boolean,
    default: false
  },
  noOfRooms: {
    type: String,
    default: null
  },
  rooms: {
    type: [individualRoomsSchema],
    default: []
  },
  about: {
    type: String,
    default: null
  },
  tc: {
    type: String,
    default: null
  },
  facilities: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: []
  },
  email: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        return v === null || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v); // Basic email validation
      },
      message: (props) => `${props.value} is not a valid email!`
    }
  },
  phoneNumber: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        return v === null || /^[0-9]{10}$/.test(v); // 10-digit phone number validation
      },
      message: (props) => `${props.value} is not a valid phone number!`
    }
  },
  ownerEmail: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        return v === null || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v); // Basic email validation
      },
      message: (props) => `${props.value} is not a valid email!`
    }
  },
  ownerPhoneNumber: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        return v === null || /^[0-9]{10}$/.test(v); // 10-digit phone number validation
      },
      message: (props) => `${props.value} is not a valid phone number!`
    }
  },
  ownerPhoneNumberVerified: {
    type: Boolean,
    default: false
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
  closedDaysOverride: {
    type: [String], 
    default: []
  },
  openDaysOverride: {
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
  adminNotes: {
    type: String, 
    default: null
  },
  cancelReason: {
    type: String, 
    default: null
  },
  registrationStatus: {
    type: String,
    enum: ["pending", "completed", "awaiting_approval", "approved", "paused", "rejected", "invited"],
    default: "pending"
  },

  featured: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: null
  },
  ratings: {
    type: Number,
    default: 4.5
  },
  reviewsCount: {
    type: Number,
    default: 25
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