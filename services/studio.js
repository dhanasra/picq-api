const depManager = require("../core/depManager");
const responser = require("../core/responser");
const { ObjectId } = require("mongodb");

async function search(req, res) {
  try {
    const { query, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    const { status, category, facilities, services } = req.body;

    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit) || 10, 1);

    // ---------- Top-level Studio Filter ----------
    const filter = {};
    if (status) {
      filter.registrationStatus = status;
    }
    if (query) {
      filter.studioName = { $regex: query, $options: "i" };
    }
    if (facilities) {
      const facilitiesArray = Array.isArray(facilities) ? facilities : [facilities];
      filter.facilities = { $all: facilitiesArray };
    }

    // ---------- Room-Level Filter ----------
    const matchRoomsConditions = [];

    if (category) {
      matchRoomsConditions.push({ $eq: ["$$room.category", category] });
    }

    if (services) {
      const serviceArray = Array.isArray(services) ? services : [services];
      matchRoomsConditions.push({ $setIsSubset: [serviceArray, "$$room.services"] });
    }

    const priceRangeCond = [];
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);

    if (!isNaN(min)) {
      priceRangeCond.push({ $gte: ["$$room.price", min] });
    }

    if (!isNaN(max)) {
      priceRangeCond.push({ $lte: ["$$room.price", max] });
    }

    if (priceRangeCond.length) {
      matchRoomsConditions.push({ $and: priceRangeCond });
    }

    const filterRoomsStage = {
      $addFields: {
        filteredRooms: {
          $filter: {
            input: "$rooms",
            as: "room",
            cond: {
              $and: matchRoomsConditions.length ? matchRoomsConditions : [{ $const: true }]
            }
          }
        }
      }
    };

    const nonEmptyFilteredRoomsMatch = {
      $match: {
        $expr: {
          $gt: [{ $size: "$filteredRooms" }, 0]
        }
      }
    };

    const lookups = [
      {
        $lookup: {
          from: "Addresses",
          localField: "address",
          foreignField: "_id",
          as: "address"
        }
      },
      { $unwind: { path: "$address", preserveNullAndEmptyArrays: true } }
    ];

    // ---------- Aggregation Pipelines ----------
    const totalCountPromise = depManager.STUDIO.getStudioModel().aggregate([
      { $match: filter },
      filterRoomsStage,
      nonEmptyFilteredRoomsMatch,
      { $count: "totalCount" }
    ]);

    const studiosPromise = depManager.STUDIO.getStudioModel().aggregate([
      { $match: filter },
      filterRoomsStage,
      nonEmptyFilteredRoomsMatch,
      ...lookups,
      { $sort: { createdAt: -1 } },
      { $skip: (parsedPage - 1) * parsedLimit },
      { $limit: parsedLimit },
    ]);

    // ---------- Final Response ----------
    const [totalCountResult, studios] = await Promise.all([
      totalCountPromise,
      studiosPromise,
    ]);
    const total = totalCountResult[0]?.totalCount || 0;

    return responser.success(res, { studios, total }, "STUDIO_S001");

  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

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

async function fetchFeatured(req, res) {
  try {

    const featured = await depManager.STUDIO.getStudioModel().aggregate([
      { $match: { featured: true }},
      { 
          $lookup: {
              from: "Addresses",
              localField: "address",
              foreignField: "_id",
              as: "address"
          }
      },
      { 
          $unwind: { path: "$address", preserveNullAndEmptyArrays: true } 
      },
      { $sort: { priority: -1, createdAt: -1 } }
    ]);

    return responser.success(res, featured, "STUDIO_S001");
  }catch(e){
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function fetchMostRated(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;

    const featured = await depManager.STUDIO.getStudioModel().aggregate([
      { 
          $lookup: {
              from: "Addresses",
              localField: "address",
              foreignField: "_id",
              as: "address"
          }
      },
      { 
          $unwind: { path: "$address", preserveNullAndEmptyArrays: true } 
      },
      { $sort: { ratings: -1, reviewsCount: -1, createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
    ]);

    return responser.success(res, featured, "STUDIO_S001");
  }catch(e){
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}


async function fetchFavourites(req, res) {
  try {

    const { userID } = req;
    const { page = 1, limit = 10 } = req.query;

    const favIds = (await depManager.USER.getUserModel().findById(userID))?.favourites || [];
    const objectIdFavs = favIds.map(id => new ObjectId(id));

    const totalCountPromise = depManager.STUDIO.getStudioModel().aggregate([
      { $match: { _id: { $in: objectIdFavs } } },
      { $count: "totalCount" },
    ]);

    const studiosPromise = depManager.STUDIO.getStudioModel().aggregate([
      { $match: { _id: { $in: objectIdFavs } } },
      { 
          $lookup: {
              from: "Addresses",
              localField: "address",
              foreignField: "_id",
              as: "address"
          }
      },
      { 
          $unwind: { path: "$address", preserveNullAndEmptyArrays: true } 
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

    const studioID = req.params.studioId;

    const { userID, roleID } = req;

    var lookups = [
      { 
        $lookup: {
            from: "Addresses",
            localField: "address",
            foreignField: "_id",
            as: "address"
        }
      },
      { 
        $unwind: { path: "$address", preserveNullAndEmptyArrays: true } 
      },
    ]

    if(roleID!='admin' && roleID!='studio_owner'){
      lookups = [
        ...lookups,
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
          $unwind: { path: "$documents", preserveNullAndEmptyArrays: true } 
        },
        { 
            $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } 
        },
      ]
    }

    const result = await depManager.STUDIO.getStudioModel().aggregate([
      {
        $match: { _id: new ObjectId(studioID) }
      },
      ...lookups
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

    const studioID = req.params.studioId;

    const { userID, roleID } = req;

    if(roleID!='admin' && roleID!='studio_owner'){
      return responser.error(res, "STUDIO_E001");
    }

    const { studioName, email, documents, noOfRooms, featured, priority, frontDeskPhoneVerified, ownerPhoneNumberVerified, rooms, operationalHours, openDays, closedDaysOverride, openDaysOverride, ownerPhoneNumber, ownerEmail, ownerType, address, frontDeskPhone, about, tc, facilities, adminNotes, cancelReason, registrationStatus } = req.body;
    const studio = await depManager.STUDIO.getStudioModel().findById(studioID);

    if(!studio){
      return responser.error(res, "STUDIO_E002");
    }

    if(roleID=='admin'){
      if(featured!=null){
        studio.featured = featured;
      }
      if(priority!=null){
        studio.priority = priority;
      }
    }

    if(studioName){
      studio.studioName = studioName;
    }
    if(address){
      studio.address = address;
    }
    if(frontDeskPhoneVerified!=null){
      studio.frontDeskPhoneVerified = frontDeskPhoneVerified;
    }
    if(ownerPhoneNumberVerified!=null){
      studio.ownerPhoneNumberVerified = ownerPhoneNumberVerified;
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

async function createRoom(req, res) {
  try {

    const studioID = req.params.studioId;

    const { room } = req.body;

    const studio = await depManager.STUDIO.getStudioModel().findByIdAndUpdate(
      studioID,
      { $push: { rooms: room } },
      { new: true }
    );
 
    return responser.success(res, studio, "STUDIO_S004");
  }catch(e){
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function updateRoom(req, res) {
  try {

    const studioID = req.params.studioId;
    const roomID = req.params.roomId;

    const { room } = req.body;

    const studio = await depManager.STUDIO.getStudioModel().findOneAndUpdate(
      { _id: studioID, "rooms._id": roomID },
      {
        $set: {
          "rooms.$": room 
        }
      },
      { new: true } 
    );

    return responser.success(res, studio, "STUDIO_S005");
  }catch(e){
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function deleteRoom(req, res) {
  try {
    const studioID = req.params.studioId;
    const roomID = req.params.roomId;

    const studio = await depManager.STUDIO.getStudioModel().findOneAndUpdate(
      { _id: studioID }, 
      {
        $pull: { "rooms": { _id: roomID } } 
      },
      { new: true }
    );

    return responser.success(res, studio, "STUDIO_S006");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function addReview(req, res) {
  try {
    const studioID = req.params.studioId;
    const { userID } = req;
    const { rating, review } = req.body;

    const [user, studio] = await Promise.all([
      depManager.USER.getUserModel().findById(userID).lean(),
      depManager.STUDIO.getStudioModel().findById(studioID).lean()
    ]);

    if (!user || !studio) {
      return responser.error(res, "GLOBAL_E001");
    }

    // Create the review
    await depManager.REVIEWS.getStudioReviewsModel().create({
      studio: studioID,
      user: userID,
      username: `${user.firstName} ${user.lastName}`,
      picture: user.picture,
      rating,
      review,
      createdAt: Date.now()
    });

    // Compute new average rating
    const oldRating = studio.ratings || 0;
    const oldCount = studio.reviewsCount || 0;

    const newCount = oldCount + 1;
    const newAvg = ((oldRating * oldCount) + rating) / newCount;

    // Update studio
    const updatedStudio = await depManager.STUDIO.getStudioModel().findByIdAndUpdate(
      studioID,
      {
        $set: {
          ratings: parseFloat(newAvg.toFixed(1)),
          reviewsCount: newCount
        }
      },
      { new: true }
    );

    return responser.success(res, updatedStudio, "STUDIO_S006");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}


async function getReviews(req, res) {
  try {

    const userID = req.userID;
    const studioID = req.params.studioId;

    const mine = req.query.mine;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const filer = { studioID, userID };

    if(mine){
      filer['userID'] = userID;
    }

    const [reviews, totalCount] = await Promise.all([
      depManager.REVIEWS.getStudioReviewsModel()
        .find( filer )
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      depManager.REVIEWS.getStudioReviewsModel().countDocuments({ studio: studioID })
    ]);

    return responser.success(res, {
      reviews,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    }, "STUDIO_S006");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}


module.exports = {
  search,
  paginate,
  details,
  update,
  createRoom,
  updateRoom,
  deleteRoom,
  fetchFavourites,
  fetchFeatured,
  fetchMostRated,
  addReview,
  getReviews
}