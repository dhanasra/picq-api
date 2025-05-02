// DB
const USER = require("../models/user.model");
const ADDRESS = require("../models/address.model");
const STUDIO = require("../models/studio.model");
const DOCUMENTS = require("../models/documents.model");
const BOOKINGS = require("../models/bookings.model");
const OTP = require("../models/otp.model");
const REVIEWS = require("../models/reviews.model");

const depManager = {
  USER,
  ADDRESS,
  STUDIO,
  DOCUMENTS,
  BOOKINGS,
  OTP,
  REVIEWS
};

module.exports = depManager;
