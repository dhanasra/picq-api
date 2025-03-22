const depManager = require("../core/depManager");
const { hash, checkHash } = require("../core/helper");
const responser = require("../core/responser");
const { generateTokens } = require("./token");

async function signin(req, res){

  try{
    const { phoneNumber, password, roleID } = req.body;

    const conditions = { phoneNumber };
    if (roleID) {
      conditions.roleID = roleID;
    }

    const user = await depManager.USER.getUserModel().findOne(
      conditions, 
      { password: 1, firstName: 1, lastName: 1, roleID: 1 }
    ).lean();

    if (!user) {
      return responser.error(res, null, "AUTH_E002");
    }

    console.log(password);
    console.log(user.password.hashed);
    

    const isPasswordValid = await checkHash(password, user.password.hashed);


    if (!isPasswordValid) {
      return responser.error(res, null, "AUTH_E001");
    }

    const displayName = `${user.firstName} ${user.lastName}`;

    const { accessToken } = generateTokens({
      userID: user._id,
      roleID: user.roleID
    });

    return responser.success(res, { accessToken, displayName, roleID: user.roleID }, "AUTH_S001");
  }catch(e){
    return responser.error(res, null, "R001");
  }
}

async function signup(req, res){

  try{
    
    const { firstName, lastName, emailAddress, phoneNumber, password } = req.body;

    const data = { 
      firstName,
      lastName,
      emailAddress,
      phoneNumber,
      roleID: "studio_owner",
      registrationStatus: "pending",
      createdAt: Date.now(),
    };

    const { hashed, salt } = await hash(password);

    data.password = {
      hashed,
      salt
    };

    const user = await depManager.USER.getUserModel().create(data);

    const displayName = `${user.firstName} ${user.lastName}`;

    const { accessToken } = generateTokens({
      userID: user._id,
      roleID: user.roleID
    });

    return responser.success(res, { accessToken, displayName, roleID: user.roleID }, "AUTH_S001");
  }catch(e){
    return responser.error(res, null, "R001");
  }
}

module.exports = {
  signin,
  signup
}