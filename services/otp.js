const depManager = require("../core/depManager");
const responser = require("../core/responser");
const { sendSms } = require("../core/utils");

async function sendOtp(req, res) {
  try {
    const { phoneNumber } = req.body;

    phoneNumber = phoneNumber.replace(/\D/g, '');

    if (phoneNumber.length === 12 && phoneNumber.startsWith("91")) {
      phoneNumber = `${phoneNumber}`;
    }
    else if (phoneNumber.length === 10) {
      phoneNumber = `91${phoneNumber}`;
    }
    else {
      return responser.error(res, "OTP_E003");
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Promise.all([
        depManager.OTP.getOtpModel().create({
            phoneNumber, code, expiresAt
        }),
        sendSms({ phoneNumber, otp: code })
    ])

    return responser.success(res, true, "OTP_S001");
  }catch(e){
    console.log(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function verifyOtp(req, res) {
  try {
    const { phoneNumber, code } = req.body;

    phoneNumber = phoneNumber.replace(/\D/g, '');

    if (phoneNumber.length === 12 && phoneNumber.startsWith("91")) {
      phoneNumber = `${phoneNumber}`;
    }
    else if (phoneNumber.length === 10) {
      phoneNumber = `91${phoneNumber}`;
    }
    else {
      return responser.error(res, "OTP_E003");
    }

    const otpRecord = await depManager.OTP.getOtpModel().findOne({ phoneNumber, code, verified: false });

    if (!otpRecord) {
        return responser.error(res, "OTP_E001");
    }

    if (otpRecord.expiresAt < new Date()) {
        return responser.error(res, "OTP_E002");
    }
    
    otpRecord.verified = true;
    await otpRecord.save();

    return responser.success(res, true, "OTP_S002");
  }catch(e){
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

module.exports = {
  sendOtp,
  verifyOtp
}