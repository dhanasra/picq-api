const express = require("express");
const processHandler = require("../core/processHandler");
const bodyParser = require('body-parser');
const serverless = require("serverless-http");
const { validateAccessToken } = require("../middlewares/authenticate");
const service = require("../services/admin");
const cors_origin = require("../core/cors_origin");


const app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use(cors_origin());

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.roleID)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

app.use(validateAccessToken);

// Only superadmin can manage admins
app.post("/admins", allowRoles("admin"), processHandler(service.createAdmin));
app.get("/admins", allowRoles("admin"), processHandler(service.listAdmins));
app.put("/admins/:id", allowRoles("admin"), processHandler(service.updateAdmin));
app.delete("/admins/:id", allowRoles("admin"), processHandler(service.deleteAdmin));

module.exports.handler = serverless(app, {
    callbackWaitsForEmptyEventLoop: false
});
