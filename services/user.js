const depManager = require("../core/depManager");
const responser = require("../core/responser");
const { ObjectId } = require("mongodb");


async function details(req, res) {
  try {

    const { userID } = req.query;
    const user = await depManager.USER.getUserModel().findById(userID)

    return responser.success(res, user, "USER_S001");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function paginate(req, res) {
  try {
    const { roleID } = req;
    if (roleID !== 'admin') {
      return responser.error(res, "USER_E002");
    }

    const { page = 1, limit = 10, query, premier } = req.query;

    const filter = {
      roleID: 'user'
    };

    if (premier != null) {
      filter["membership.isPremier"] = premier === 'true'; 
    }

    if (query) {
      filter["$or"] = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } }
      ];
    }

    const userModel = depManager.USER.getUserModel();

    const totalCountPromise = userModel.aggregate([
      { $match: filter },
      { $count: "totalCount" },
    ]);

    const usersPromise = userModel.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
    ]);

    const [totalCountResult, users] = await Promise.all([
      totalCountPromise,
      usersPromise,
    ]);

    const total = totalCountResult[0]?.totalCount || 0;

    return responser.success(res, { users, total }, "USER_S001");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

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
      return responser.error(res, "USER_E001");
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

    return responser.success(res, user, "USER_S001");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function premiemMember(req, res) {
  try {
    const { userID } = req;
    const  { isPremier } = req.body;

    const user = await depManager.USER.getUserModel().findById(userID);

    if (!user) {
      return responser.error(res, "USER_E001");
    }

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);

    const membership = {
      isPremier,
      tier: 'silver',
      startDate,
      expiryDate
    };

    user.membership = membership;
    user.updatedAt = Date.now();

    await user.save();

    return responser.success(res, user, "USER_S001");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}


async function updateFavourite(req, res) {
  try {
    const { userID } = req; 
    const { studioID, isFavourite } = req.body;

    const user = await depManager.USER.getUserModel().findById(userID);

    if (!user) {
      return responser.error(res, "USER_E001");
    }

    if (isFavourite) {
      if (!user.favourites.includes(studioID)) {
        user.favourites.push(studioID);
      }
    } 
    else {
      user.favourites = user.favourites.filter(fav => fav.toString() !== studioID);
    }

    await user.save();

    return responser.success(res, user, "USER_S002");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}


async function getReviews(req, res) {
  try {
    const userID = req.userID;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const ReviewModel = depManager.REVIEWS.getStudioReviewsModel();

    const [results, totalCount] = await Promise.all([
      ReviewModel.aggregate([
        { $match: { userID: new ObjectId(userID) } },
        { $sort: { createdAt: -1 } },
        {
          $lookup: {
            from: "Studios",
            localField: "studioID",
            foreignField: "_id",
            pipeline: [
              { $project: { _id: 1, studioName: 1 } }
            ],
            as: "studio"
          }
        },
        { $unwind: "$studio" },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ]),
      ReviewModel.countDocuments({ userID })
    ]);

    return responser.success(res, {
      reviews: results,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    }, "STUDIO_S006");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

module.exports ={
    update,
    updateFavourite,
    premiemMember,
    getReviews,
    paginate,
    details
}