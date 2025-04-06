const depManager = require("../core/depManager");
const responser = require("../core/responser");
const { ObjectId } = require("mongodb");

async function paginate(req, res) {
  try {

    const { userID, roleID } = req;
    const { page = 1, limit = 10, query, status } = req.query;

    if(roleID!='admin'){
      return responser.error(res, "STUDIO_E001");
    }

    const filter = {}
    if(status){
      filter.registrationStatus = status;
    }
    if(query){
      filter.studioName = { $regex: query, $options: "i" };
    }

    const totalCountPromise = depManager.STUDIO.getStudioModel().aggregate([
      { $match: filter },
      { $count: "totalCount" },
    ]);

    const studiosPromise = depManager.STUDIO.getStudioModel().aggregate([
      {
        $match: filter
      },
      { 
          $lookup: {
              from: "Addresses",
              localField: "address",
              foreignField: "_id",
              as: "address"
          }
      },
      { 
          $lookup: {
              from: "Documents",
              localField: "documents",
              foreignField: "_id",
              as: "documents"
          }
      },
      { 
        $lookup: {
            from: "Users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }
      },
      { 
          $unwind: { path: "$address", preserveNullAndEmptyArrays: true } 
      },
      { 
          $unwind: { path: "$documents", preserveNullAndEmptyArrays: true } 
      },
      { 
          $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } 
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
    ]);

    const [totalCountResult, studios] = await Promise.all([
      totalCountPromise,
      studiosPromise,
    ]);
    const total = totalCountResult[0]?.totalCount || 0;

    return responser.success(res, { studios, total }, "STUDIO_S001");
  }catch(e){
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function details(req, res) {
  try {

    const studioID = req.params.id;

    const { userID, roleID } = req;

    if(roleID!='admin' && roleID!='studio_owner'){
      return responser.error(res, "STUDIO_E001");
    }

    const result = await depManager.STUDIO.getStudioModel().aggregate([
      {
        $match: { _id: new ObjectId(studioID) }
      },
      { 
          $lookup: {
              from: "Addresses",
              localField: "address",
              foreignField: "_id",
              as: "address"
          }
      },
      { 
          $lookup: {
              from: "Documents",
              localField: "documents",
              foreignField: "_id",
              as: "documents"
          }
      },
      { 
        $lookup: {
            from: "Users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }
      },
      { 
          $unwind: { path: "$address", preserveNullAndEmptyArrays: true } 
      },
      { 
          $unwind: { path: "$documents", preserveNullAndEmptyArrays: true } 
      },
      { 
          $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } 
      },
    ]);

    if(!result || result.length==0){
      return responser.error(res, "STUDIO_E002");
    }

    return responser.success(res, result[0], "STUDIO_S002");
  }catch(e){
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function update(req, res) {
  try {

    const studioID = req.params.id;

    const { userID, roleID } = req;

    if(roleID!='admin' && roleID!='studio_owner'){
      return responser.error(res, "STUDIO_E001");
    }

    const { studioName, email, documents, noOfRooms, rooms, operationalHours, openDays, closedDaysOverride, openDaysOverride, ownerPhoneNumber, ownerEmail, ownerType, address, frontDeskPhone, about, tc, facilities, adminNotes, cancelReason, registrationStatus } = req.body;
    const studio = await depManager.STUDIO.getStudioModel().findById(studioID);

    if(!studio){
      return responser.error(res, "STUDIO_E002");
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
    if(noOfRooms){
      studio.noOfRooms = noOfRooms;
    }
    if(rooms){
      studio.rooms = rooms;
    }
    if(about){
      studio.about = about;
    }
    if(tc){
      studio.tc = tc;
    }
    if(facilities){
      studio.facilities = facilities
    }
    if(ownerType){
      studio.ownerType = ownerType;
    }
    if(email){
      studio.email = email;
    }
    if(ownerEmail){
      studio.ownerEmail = ownerEmail;
    }
    if(ownerPhoneNumber){
      studio.ownerPhoneNumber = ownerPhoneNumber;
    }
    if(documents){
      studio.documents = documents;
    }
    if(operationalHours){
      studio.operationalHours = operationalHours;
    }
    if(openDays){
      studio.openDays = openDays;
    }
    if(openDaysOverride){
      studio.openDaysOverride = openDaysOverride;
    }
    if(closedDaysOverride){
      studio.closedDaysOverride = closedDaysOverride;
    }
    if(adminNotes){
      studio.adminNotes = adminNotes;
    }
    if(cancelReason){
      studio.cancelReason = cancelReason;
    }
    if(registrationStatus){

      if(registrationStatus!="rejected"){
        studio.cancelReason = null;
      }

      studio.registrationStatus = registrationStatus;
    }

    studio.updatedAt = Date.now();

    await studio.save();

    return responser.success(res, studio, "STUDIO_S003");
  }catch(e){
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

module.exports = {
  paginate,
  details,
  update
}