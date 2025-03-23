// DB
const USER = require("../models/user.model");
const ADDRESS = require("../models/address.model");
const STUDIO = require("../models/studio.model");

const depManager = {
  USER,
  ADDRESS,
  STUDIO
};

module.exports = depManager;
