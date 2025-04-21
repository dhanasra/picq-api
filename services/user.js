const depManager = require("../core/depManager");
const responser = require("../core/responser");

async function update(req, res) {
  try {
    const { userID } = req;
    console.log(userID)
    const {
      firstName,
      lastName,
      companyName,
      picture,
      dob,
      gender,
      email,
      phoneNumber,
      address,
      area,
      pincode
    } = req.body;

    const user = await depManager.USER.getUserModel().findById(userID);

    if (!user) {
      return responser.error(res, "USER_E002");
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (companyName) user.companyName = companyName;
    if (picture) user.picture = picture;
    if (dob) user.dob = dob;
    if (gender) user.gender = gender;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (address) user.address = address;
    if (area) user.area = area;
    if (pincode) user.pincode = pincode;

    user.updatedAt = Date.now();

    await user.save();

    return responser.success(res, user, "USER_S003");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}


module.exports ={
    update
}