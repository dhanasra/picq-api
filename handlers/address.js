const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');

const app = express();

const processHandler = require("../core/processHandler");

const service = require('../services/address');
const cors_origin = require("../core/cors_origin");
const { validateAccessToken } = require("../middlewares/authenticate");

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors_origin());

app.use(validateAccessToken);

app.post("/address", processHandler(service.create))
app.put("/address/:addressID", processHandler(service.update))
app.get("/address/:addressID", processHandler(service.get))
app.delete("/address/:addressID", processHandler(service.clear))


module.exports.handler = serverless(app, {
    callbackWaitsForEmptyEventLoop: false
});