// DB
const USER = require("../models/user.model");
const STUDIO = require("../models/studio.model");
const ADDRESS = require("../models/address.model");

const depManager = {
  USER,
  STUDIO,
  ADDRESS
};

module.exports = depManager;
