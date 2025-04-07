const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema({
  phoneNumber: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{12}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  code: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000)
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// TTL index to automatically delete documents after 'expiresAt'
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const getOtpModel = () => {
  return mongoose.model("Otp", otpSchema, "Otp");
};

module.exports = {
    getOtpModel
};
