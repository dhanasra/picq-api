const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');

const { upload } = require("../core/upload-config");

const app = express();

const processHandler = require("../core/processHandler");

const service = require('../services/documents');
const cors_origin = require("../core/cors_origin");
const { validateAccessToken } = require("../middlewares/authenticate");

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors_origin());

app.use(validateAccessToken);

app.post("/documents", upload, processHandler(service.create));
app.put("/documents/:documentID", upload, processHandler(service.update));

module.exports.handler = serverless(app, {
    callbackWaitsForEmptyEventLoop: false
});