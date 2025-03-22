const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const _addressSchema = new Schema({
  userID: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: "Users"
  },
  addressLine1: {
    type: String,
    default: null
  },
  addressLine2: {
    type: String,
    default: null
  },
  addressType: {
    type: String,
    default: null
  },
  landmark: {
    type: String,
    default: null
  },
  region: {
    type: String,
    default: null
  },
  country: {
    type: String,
    default: null
  },
  city: {
    type: String,
    default: null
  },
  zipcode: {
    type: String,
    default: null
  },
  locationLink: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const getAddressModel = () => {
  return mongoose.model("Addresses", _addressSchema, "Addresses");
};

module.exports = {
  getAddressModel
};
