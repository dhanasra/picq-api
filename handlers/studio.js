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

app.put("/studio/:studioId", processHandler(service.update))
app.get("/studio/:studioId", processHandler(service.details));
app.get("/studios", processHandler(service.paginate));
app.put("/studio/:studioId/room/:roomId", processHandler(service.updateRoom))
app.delete("/studio/:studioId/room/:roomId", processHandler(service.deleteRoom))
app.post("/studio/:studioId/room", processHandler(service.createRoom))

module.exports.handler = serverless(app, {
    callbackWaitsForEmptyEventLoop: false
});