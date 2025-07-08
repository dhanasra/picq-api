const depManager = require("../core/depManager");
const responser = require("../core/responser");
const { ObjectId } = require("mongodb");
const { getPayoutMonth } = require("../core/utils");
const { refundPayment, createRazorpayOrder } = require("./razorpay");

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

async function updateBooking(req, res) {
  try {

    const bookingID = req.params.id;

    const {
      dateTime,
      endDateTime,
      duration,
      amount,
      room,
      status,
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
    if(status){
      booking.status = status;
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

    const filterUserID = req.query?.userID;

    const filter =
      roleID === "admin" || roleID === "studio_owner"
        ? {}
        : { userID: new ObjectId(userID) };

    if (studioID) {
      filter.studioID = new ObjectId(studioID);
    }
    if (status) {
      filter.status = status=='upcoming' ? { $in: ['pending', 'confirmed'] } : status;
    }

    if(filterUserID){
      filter.userID = new ObjectId(filterUserID);
    }

    console.log(filter)

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
    const roleID = req.roleID;
    const userID = req.userID;
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

    if(roleID=='user'){
      data[0].review = await depManager.REVIEWS.getStudioReviewsModel().findOne({ userID, studioID: data[0].studioID })      
    }

    return responser.success(res, data[0], "BOOKINGS_S004");
  } catch (e) {
    console.log(e)
    return responser.error(res, "GLOBAL_E001");
  }
}


async function createOrderId(req, res) {
  try {
    const userID = req.userID;
    const { amount, studioID } = req.body

    const order = await createRazorpayOrder({
      amount: amount,
      receipt: `rcpt_${Date.now()}`,
      notes: { studioID, userID }
    });

    return responser.success(res, {orderId: order.id}, "BOOKINGS_S001");
  } catch (e) {
    console.error("Error in createOffline:", e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function create(req, res) {
  try {

    const { userID } = req;

    const {
      studioID,
      roomID,
      dateTime,
      endDateTime,
      duration,
      amount,
      coupon,
      total,
      extras,
      paymentMethod,
      paymentStatus,
      partialPayment,
      notes,
      paymentDate,
      orderID,
      transactionID
    } = req.body;

    const platformFee  = Math.round(total * 0.25);
    const payoutAmount = total - platformFee;

    // Prepare booking data
    const bookingData = {
      userID,
      studioID,
      roomID,
      dateTime,
      endDateTime,
      duration,
      amount,
      coupon,
      total,
      extras,
      status: "pending",
      paymentDetails: {
        status: paymentStatus,
        paymentMethod: paymentMethod,
        partialPayment: partialPayment,
        transactionID: transactionID,
        orderID: orderID,
        paymentDate: paymentDate
      },
      payout: {
        status: "pending",
        payoutAmount,
        platformFee,
        payoutMonth: getPayoutMonth(new Date())
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

async function cancelBooking(req, res) {
  try {
    const { id } = req.params;
    const { roleID, userID } = req;
    const { reason } = req.body;

    const booking = await depManager.BOOKINGS.getBookingsModel().findById(id);
    if (!booking) return responser.error(res, "BOOKING_NOT_FOUND");

    if (["completed", "cancelled"].includes(booking.status)) {
      return responser.error(res, "BOOKING_ALREADY_FINALIZED");
    }

    let cancelledBy = "user";
    if (roleID === "admin") cancelledBy = "admin";
    else if (String(booking.userID) !== userID) cancelledBy = "owner";

    // Refund logic: only if booking has a completed payment
    const paid = booking.paymentDetails?.status === "completed";
    const transactionID = booking.paymentDetails?.transactionID;

    if (paid && transactionID) {
      const refundAmount = booking.paymentDetails.partialPayment || booking.total;
      const refundAmountInPaise = refundAmount * 100;

      console.log(refundAmount);

      try {
        const refundRes = await refundPayment({
          paymentId: transactionID,
          amount: refundAmountInPaise
        });

        booking.paymentDetails.refund = {
          status: 'processed',
          refundId: refundRes.data.id,
          amount: refundAmount,
          refundedAt: new Date()
        };
      } catch (err) {
        console.log(err?.response?.data);
        booking.paymentDetails.refund = {
          status: 'failed',
          refundId: null,
          amount: 0,
          refundedAt: null,
          failureReason: err.message
        };
      }
    }

    booking.status = "cancelled";
    booking.cancellationReason = reason || null;
    booking.cancelledBy = cancelledBy;
    booking.updatedAt = new Date();

    await booking.save();

    return responser.success(res, booking, "BOOKING_CANCELLED");
  } catch (e) {
    console.error("Cancel booking error:", e);
    return responser.error(res, "GLOBAL_E001");
  }
}


async function refundBooking(req, res) {
  try{
    const { id } = req.params;

    const booking = await depManager.BOOKINGS.getBookingsModel().findById(id);
    if (!booking) return responser.error(res, "BOOKING_NOT_FOUND");

    if (booking.status !== 'cancelled')
      return responser.error(res, "BOOKING_NOT_CANCELLED");

    if (booking.paymentDetails?.refund?.status === 'processed') {
      return responser.error(res, "REFUND_ALREADY_PROCESSED");
    }
  
    const paymentId = booking.paymentDetails.transactionID;
    if (!paymentId)
      return responser.error(res, "NO_PAYMENT_FOUND");

    const refundAmount = booking.paymentDetails.partialPayment || booking.total;
    const refundAmountInPaise = refundAmount * 100;

    const refundRes = await refundPayment({ paymentId, amount: refundAmountInPaise })

    booking.paymentDetails.refund = {
      status: 'processed',
      refundId: refundRes.data.id,
      amount: refundAmount,
      refundedAt: new Date()
    };

    await booking.save();

    return responser.success(res, booking, "REFUND_SUCCESS");
  }catch(e){
    return responser.error(res, "REFUND_FAILED");
  }
}

module.exports = { 
  createOffline,
  updateBooking,
  paginate ,
  getBooking,
  create,
  createOrderId,
  cancelBooking,
  refundBooking
};
