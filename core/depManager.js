// DB
const USER = require("../models/user.model");
const ADDRESS = require("../models/address.model");
const STUDIO = require("../models/studio.model");
const DOCUMENTS = require("../models/documents.model");

const depManager = {
  USER,
  ADDRESS,
  STUDIO,
  DOCUMENTS
};

module.exports = depManager;
