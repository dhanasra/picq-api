const fileUpload = require("express-fileupload");

module.exports.upload = fileUpload({
  limits: { fileSize: 2 * 1024 * 1024 },
  createParentPath: true,
  abortOnLimit: true,
  limitHandler: function (req, res, next) {
    res.status(413).send({
      status: "error",
      message: "The file has exceeded the maximum file limit 2MB",
      messageCode: "PRO_E001",
    });
  },
  debug: true,
});