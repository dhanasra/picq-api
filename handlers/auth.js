
const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');
const { validateAccessToken } = require("../middlewares/authenticate");

const app = express();

const processHandler = require("../core/processHandler");

const service = require('../services/auth');
const cors_origin = require("../core/cors_origin");

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors_origin());

app.get("/ping", (req, res) => res.send('DONE'))

app.post("/signup", processHandler(service.signup))
app.post("/signin", processHandler(service.signin))

app.post("/auth_otp", processHandler(service.authOtp))
app.post("/auth_verify", processHandler(service.authVerify))

app.post("/auth_google", processHandler(service.authGoogle))

app.use(validateAccessToken);

app.post("/onboarding", processHandler(service.onboarding))


module.exports.handler = serverless(app, {
    callbackWaitsForEmptyEventLoop: false
});