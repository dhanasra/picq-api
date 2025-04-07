const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');

const app = express();

const processHandler = require("../core/processHandler");

const service = require('../services/otp');
const cors_origin = require("../core/cors_origin");
const { validateAccessToken } = require("../middlewares/authenticate");

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors_origin());

app.use(validateAccessToken);

app.post("/send_otp", processHandler(service.sendOtp))
app.post("/verify_otp", processHandler(service.verifyOtp));

module.exports.handler = serverless(app, {
    callbackWaitsForEmptyEventLoop: false
});