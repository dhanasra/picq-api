const depManager = require("../core/depManager");
const responser = require("../core/responser");
const { ObjectId } = require("mongodb");

async function createOffline(req, res) {
  try {
    const {
      name,
      phoneNumber,
      email,
      studioID,
      dateTime,
      endDateTime,
      duration,
      amount,
      room,
      category,
      service,
      paymentMethod,
      paymentStatus,
      partialPayment,
      notes,
    } = req.body;

    // Split name into first and last name
    const [firstName, ...lastNameParts] = name.trim().split(" ");
    const lastName = lastNameParts.join(" ") || "";

    // Find or create user
    const user = await depManager.USER.getUserModel().findOneAndUpdate(
      { phoneNumber },
      {
        $setOnInsert: {
          firstName,
          lastName,
          phoneNumber,
          email,
          registrationStatus: "invited",
          loginType: "offline",
        },
      },
      { new: true, upsert: true }
    );

    // Prepare booking data
    const bookingData = {
      userID: user._id,
      studioID,
      dateTime,
      endDateTime,
      duration,
      room,
      service,
      category,
      amount,
      status: "confirmed",
      bookingType: "offline",
      paymentDetails: {
        status: paymentStatus,
        paymentMethod: paymentMethod,
        partialPayment: partialPayment
      },
      notes,
      createdAt: Date.now(),
    };

    // Create booking
    const booking = await depManager.BOOKINGS.getBookingsModel().create(
      bookingData
    );

    return responser.success(res, booking, "BOOKINGS_S001");
  } catch (e) {
    console.error("Error in createOffline:", e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function updateOffline(req, res) {
  try {

    const bookingID = req.params.id;

    const {
      dateTime,
      endDateTime,
      duration,
      amount,
      room,
      service,
      category,
      paymentMethod,
      paymentStatus,
      partialPayment,
      notes,
    } = req.body;

    const booking = await depManager.BOOKINGS.getBookingsModel().findById(bookingID)

    if(!booking){
      return responser.error(res, "BOOKINGS_E001");
    }

    if(dateTime){
      booking.dateTime = dateTime;
    }
    if(endDateTime){
      booking.endDateTime = endDateTime;
    }
    if(category){
      booking.category = category;
    }
    if(service){
      booking.service = service;
    }
    if(duration){
      booking.duration = duration;
    }
    if(amount){
      booking.amount = amount;
    }
    if(room){
      booking.room = room;
    }
    if(paymentMethod){
      booking.paymentDetails = { ...booking.paymentDetails, paymentMethod }
    }
    if(partialPayment){
      booking.partialPayment = { ...booking.paymentDetails, partialPayment }
    }
    if(paymentStatus){
      booking.paymentDetails = { ...booking.paymentDetails, status: paymentStatus }
    }
    if(notes){
      booking.notes = notes;
    }

    booking.updatedAt = Date.now();

    await booking.save();

    return responser.success(res, booking, "BOOKINGS_S002");
  } catch (e) {
    console.error("Error in createOffline:", e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function paginate(req, res) {
  try {
    const { userID, roleID } = req;
    const { page = 1, limit = 10, query, studioID, status } = req.query;

    const filter =
      roleID === "admin" || roleID === "studio_owner"
        ? {}
        : { userID: new ObjectId(userID) };

    if (studioID) {
      filter.studioID = new ObjectId(studioID);
    }
    if (status) {
      filter.status = status;
    }

    const totalCountPromise = depManager.BOOKINGS.getBookingsModel().aggregate([
      { $match: filter },
      { $count: "totalCount" },
    ]);

    const bookingsPromise = depManager.BOOKINGS.getBookingsModel().aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "Users",
          localField: "userID",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 1, firstName: 1, lastName: 1, email: 1, phoneNumber: 1 } }
          ],
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "Studios",
          localField: "studioID",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 1, studioName: 1 } }
          ],
          as: "studio",
        },
      },
      { $unwind: "$studio" },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) },
    ]);

    const [totalCountResult, bookings] = await Promise.all([
      totalCountPromise,
      bookingsPromise,
    ]);
    const total = totalCountResult[0]?.totalCount || 0;

    return responser.success(res, { bookings, total }, "BOOKINGS_S003");
  } catch (e) {
    console.error("Error fetching bookings:", error);
    return responser.error(res, "GLOBAL_E001");
  }
}


async function getBooking(req, res) {
  try {
    const bookingID = req.params.id;

    const data = await depManager.BOOKINGS.getBookingsModel().aggregate([
      { $match: { _id: new ObjectId(bookingID) } },
      {
        $lookup: {
          from: "Users",
          localField: "userID",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 1, firstName: 1, lastName: 1, email: 1, phoneNumber: 1 } }
          ],
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "Studios",
          localField: "studioID",
          foreignField: "_id",
          pipeline: [
            { $project: { _id: 1, studioName: 1 } }
          ],
          as: "studio",
        },
      },
      { $unwind: "$studio" },
      { $sort: { createdAt: -1 } }
    ]);

    if(!data){
      return responser.error(res, "BOOKINGS_E001");
    }

    return responser.success(res, data[0], "BOOKINGS_S004");
  } catch (e) {
    console.log(e)
    return responser.error(res, "GLOBAL_E001");
  }
}

module.exports = { 
  createOffline,
  updateOffline,
  paginate ,
  getBooking
};
