const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const panCardSchema = new Schema({
  number: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid PAN card number!`
    }
  },
  picture: { type: String, default: null }
});

const identitySchema = new Schema({
  type: {
    type: String,
    required: true,
  },
  picture: { type: String, default: null }
});

const gstinSchema = new Schema({
  isRegistered: { type: Boolean, default: false },
  number: {
    type: String,
    default: null,
    validate: {
      validator: function (v) {
        return v ? /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(v) : true; // GSTIN format
      },
      message: (props) => `${props.value} is not a valid GSTIN number!`
    }
  }
});

const bankSchema = new Schema({
  accountHolder: { type: String, required: true },
  accountNumber: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[0-9]{9,18}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid account number!`
    }
  },
  ifscCode: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid IFSC code!`
    }
  },
  bankName: { type: String, required: true },
  branch: { type: String, default: null }
});

const documentsSchema = new Schema({
  userID: {
    type: Schema.Types.ObjectId,
    default: null,
    ref: "Users"
  },
  identity: {
    type: identitySchema,
    default: null
  },
  panCard: { type: panCardSchema, default: null },
  gstin: { type: gstinSchema, default: null },
  businessCertificate: {
    type: String,
    default: null
  },
  bankInfo: { type: bankSchema, default: null },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const getDocumentsModel = () => {
  return mongoose.model("Documents", documentsSchema, "Documents");
};

module.exports = {
  getDocumentsModel
};