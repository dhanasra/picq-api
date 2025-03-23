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

    await depManager.STUDIO.getStudioModel().create({
      owner: user._id,
      registrationStatus: "pending",
      createdBy: user._id,
      createdAt: Date.now(),
    })

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


async function onboarding(req, res){

  try{

    const userID = req.userID;
    const roleID = req.roleID;

    if(roleID !== "studio_owner"){
      return responser.error(res, null, "AUTH_E003");
    }
    
    const { studioName, address, frontDeskPhone, minTime, category, services, price, offer, images, about, tc, equipments, facilities, products, status } = req.body;

    const studio = await depManager.STUDIO.getStudioModel().findOne({ owner: userID });

    if(!studio){
      return responser.error(res, null, "AUTH_E004");
    }

    if(studioName){
      studio.studioName = studioName;
    }
    if(address){
      studio.address = address;
    }
    if(frontDeskPhone){
      studio.frontDeskPhone = frontDeskPhone;
    }
    if(minTime){
      studio.minTime = minTime;
    }
    if(category){
      studio.category = category;
    }
    if(services){
      studio.services = services;
    }
    if(price){
      studio.price = price;
    }
    if(offer){
      studio.offer = offer;
    }
    if(images){
      studio.images = images;
    }
    if(about){
      studio.about = about;
    }
    if(tc){
      studio.tc = tc;
    }
    if(equipments){
      studio.equipments = equipments;
    }
    if(facilities){
      studio.facilities = facilities
    }
    if(products){
      studio.products = products;
    }

    if(status === "completed"){
      studio.registrationStatus = "completed";
    }

    studio.updatedAt = Date.now();

    await studio.save();

    return responser.success(res, studio, "AUTH_S001");
  }catch(e){
    return responser.error(res, null, "R001");
  }
}

module.exports = {
  signin,
  signup,
  onboarding
}