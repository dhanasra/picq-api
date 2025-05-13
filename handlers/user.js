const express = require("express");
const serverless = require("serverless-http");
const bodyParser = require('body-parser');

const app = express();

const processHandler = require("../core/processHandler");

const service = require('../services/user');
const cors_origin = require("../core/cors_origin");
const { validateAccessToken } = require("../middlewares/authenticate");

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors_origin());

app.use(validateAccessToken);

app.put("/user", processHandler(service.update))
app.put("/user/premier", processHandler(service.premiemMember))
app.put("/favourite", processHandler(service.updateFavourite))
app.get("/user/reviews", processHandler(service.getReviews))
app.get("/users", processHandler(service.paginate))
app.get("/user", processHandler(service.details))

module.exports.handler = serverless(app, {
    callbackWaitsForEmptyEventLoop: false
});