const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");

const app = express();
const cors_origin = require("../core/cors_origin");
const processHandler = require("../core/processHandler");
const { validateAccessToken } = require("../middlewares/authenticate");

const service = require("../services/coupons");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors_origin());

app.use(validateAccessToken);

app.post("/coupons", processHandler(service.create));
app.get("/coupons", processHandler(service.list));
app.get("/coupons/me", processHandler(service.getMyCoupons));
app.get("/coupons/applicable", processHandler(service.getApplicableCoupons));
app.get("/coupons/code/:code", processHandler(service.getByCode));
app.put("/coupons/:id", processHandler(service.update));
app.delete("/coupons/:id", processHandler(service.remove));

module.exports.handler = serverless(app, {
  callbackWaitsForEmptyEventLoop: false
});
