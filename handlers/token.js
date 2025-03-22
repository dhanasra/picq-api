
const express = require("express");
const processHandler = require("../core/processHandler");
const service = require("../services/token");

// app.use(validateAccessToken);
const router = express.Router();

router.post("/accessToken", processHandler(service.getAccessToken));

module.exports = router;