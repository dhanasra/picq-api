const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');

const app = express();

const processHandler = require("../core/processHandler");

const service = require('../services/studio');
const cors_origin = require("../core/cors_origin");
const { validateAccessToken } = require("../middlewares/authenticate");

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors_origin());

app.use(validateAccessToken);

app.put("/studio/:id", processHandler(service.update))
app.get("/studio/:id", processHandler(service.details));
app.get("/studio", processHandler(service.paginate));

module.exports.handler = serverless(app, {
    callbackWaitsForEmptyEventLoop: false
});