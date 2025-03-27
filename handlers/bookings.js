const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');

const app = express();

const processHandler = require("../core/processHandler");

const service = require('../services/bookings');
const cors_origin = require("../core/cors_origin");
const { validateAccessToken } = require("../middlewares/authenticate");

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors_origin());

app.use(validateAccessToken);

app.post("/bookings/offline", processHandler(service.createOffline))
app.put("/bookings/offline/:id", processHandler(service.updateOffline))
app.get("/bookings/:id", processHandler(service.getBooking));
app.get("/bookings", processHandler(service.paginate));

module.exports.handler = serverless(app, {
    callbackWaitsForEmptyEventLoop: false
});