
const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');
const processHandler = require("../core/processHandler");
const { validateAccessToken } = require("../middlewares/authenticate");

const corsOrigin = require("../core/cors_origin");
const service = require("../services/notification");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(corsOrigin());

app.use(validateAccessToken);

app.post("/save-fcm", processHandler(service.saveFcm));
app.get("/notifications", processHandler(service.getNotifications));
app.get("/notifications/:id", processHandler(service.getNotificationDetails));
app.put("/notifications/read", processHandler(service.updateRead));
app.delete("/notifications/:id", processHandler(service.deleteNotification));

module.exports.handler = serverless(app, {
    callbackWaitsForEmptyEventLoop: false
});