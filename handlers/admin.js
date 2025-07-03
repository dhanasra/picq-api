const express = require("express");
const router = express.Router();
const processHandler = require("../core/processHandler");
const { validateAccessToken } = require("../middlewares/authenticate");
const service = require("../services/admin"); // You’ll define admin services here

// Middleware to restrict access to superadmins only
function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.roleID)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
}

router.use(validateAccessToken);

// Only superadmin can manage admins
router.post("/admins", allowRoles("superadmin"), processHandler(service.createAdmin));
router.get("/admins", allowRoles("superadmin"), processHandler(service.listAdmins));
router.put("/admins/:id", allowRoles("superadmin"), processHandler(service.updateAdmin));
router.delete("/admins/:id", allowRoles("superadmin"), processHandler(service.deleteAdmin));

module.exports = router;
