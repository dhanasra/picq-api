const depManager = require("../dependencies");

async function createAdmin(req, res) {
  const UserModel = depManager.USER.getUserModel();
  const { firstName, lastName, email, phoneNumber, password, roleID } = req.body;

  if (!["admin", "support"].includes(roleID)) {
    return responser.error(res, null, "ADMIN_E001");
  }

  const exists = await UserModel.findOne({ $or: [{ email }, { phoneNumber }] });
  if (exists) return responser.error(res, null, "ADMIN_E002");

  const { hashed, salt } = await hash(password);

  const user = await UserModel.create({
    firstName,
    lastName,
    email,
    phoneNumber,
    roleID,
    password: { hashed, salt },
    registrationStatus: "approved",
  });

  return responser.success(res, user, "ADMIN_S001");
}

async function listAdmins(req, res) {
  const UserModel = depManager.USER.getUserModel();
  const admins = await UserModel.find({ roleID: { $in: ["admin", "support"] } });
  return responser.success(res, admins, "ADMIN_S002");
}

async function updateAdmin(req, res) {
  const UserModel = depManager.USER.getUserModel();
  const { id } = req.params;
  const updated = await UserModel.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) return responser.error(res, null, "ADMIN_E003");
  return responser.success(res, updated, "ADMIN_S003");
}

async function deleteAdmin(req, res) {
  const UserModel = depManager.USER.getUserModel();
  const { id } = req.params;
  const deleted = await UserModel.findByIdAndDelete(id);
  if (!deleted) return responser.error(res, null, "ADMIN_E004");
  return responser.success(res, true, "ADMIN_S004");
}

module.exports = {
  createAdmin,
  listAdmins,
  updateAdmin,
  deleteAdmin
};
