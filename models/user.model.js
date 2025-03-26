const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: {
    type: String,
    default: null,
    trim: true,
    minlength: [2, 'First name must be at least 2 characters long'],
    maxlength: [50, 'First name cannot exceed 50 characters'],
    validate: {
      validator: function (v) {
        return /^[A-Za-z]+$/.test(v); 
      },
      message: (props) => `${props.value} is not a valid name! Only letters are allowed.`
    }
  },
  lastName: {
    type: String,
    default: null,
    trim: true,
    validate: {
      validator: function (v) {
        return /^[A-Za-z]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid name! Only letters are allowed.`
    }
  },
  companyName: {
    type: String,
    default: null,
    trim: true
  },
  picture: {
    type: String,
    default: null
  },
  dob: {
    type: String,
    default: null
  },
  gender: {
    enum: ["male", "female", "other", "prefer_not_to_say"],
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null,
    trim: true,
    validate: {
      validator: function (v) {
        return v === null || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email!`
    }
  },
  phoneNumber: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        return v === null || /^\+?[0-9]{10,15}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number!`
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  roleID: {
    type: String,
    enum: ["studio_owner", "print_provider", "vendor_partner", "admin", "user"],
    default: "user"
  },
  registrationStatus: {
    type: String,
    enum: ["pending", "completed", "awaiting_approval", "approved", "paused", "rejected", "invited"],
    default: null
  },
  address: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: "Addresses"
  },
  area: {
    type: String,
    default: null
  },
  pincode: {
    type: String,
    default: null
  },
  password: {
    hashed: {
      type: String,
      default: null
    },
    salt: {
      type: String,
      default: null
    }
  },
  loginType: {
    type: String,
    enum: ["phone", "google", "password", "offline"],
    default: "phone"
  },
  authId: {
    type: String,
    default: null
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

const getUserModel = () => {
  return mongoose.model("Users", userSchema, "Users");
};

module.exports = {
  getUserModel
};