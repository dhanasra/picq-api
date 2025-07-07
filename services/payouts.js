const { default: mongoose } = require("mongoose");
const depManager = require("../core/depManager");
const responser = require("../core/responser");
const { getPayoutMonth } = require("../core/utils");
const { createPayout } = require("./razorpay");

async function listPayouts(req, res) {
  try {
    const { userID, roleID } = req;

    const {
      status,           // 'completed', 'processing', etc.
      payoutMonth,      // '2025-07'
      from,             // ISO start date
      to,               // ISO end date
      page = 1,
      limit = 10
    } = req.query;

    const filters = {};

    // Admin can see all payouts, others only their own
    if (roleID !== 'admin') {
      filters.ownerID = userID;
    }

    if (status) filters.status = status;
    if (payoutMonth) filters.payoutMonth = payoutMonth;

    if (from || to) {
      filters.date = {};
      if (from) filters.date.$gte = new Date(from);
      if (to) filters.date.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payouts, total] = await Promise.all([
      depManager.PAYOUTS.getPayoutsModel()
        .find(filters)
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      depManager.PAYOUTS.getPayoutsModel().countDocuments(filters)
    ]);

    return responser.success(res, { payouts, total }, "PAYOUTS_S001");
  } catch (err) {
    console.error("Payout list error:", err);
    return responser.error(res, "GLOBAL_E001");
  }
}


async function requestPayout(req, res) {
  try {
    const { userID } = req;

    const studio = await depManager.STUDIO.getStudioModel().findOne({ owner: userID });
    if (!studio) return responser.error(res, "STUDIO_NOT_FOUND");

    const monthKey = getPayoutMonth(new Date());

    const existing = await depManager.PAYOUTS.getPayoutsModel().findOne({
      ownerID: userID,
      payoutMonth: monthKey,
      status: { $in: ['processing', 'completed'] }
    });
    if (existing) return responser.error(res, 'PAYOUT_ALREADY_REQUESTED');


    // Get all unpaid, completed bookings for this studio
    const unpaidBookings = await depManager.BOOKINGS.getBookingsModel().find({
      studioID: studio._id,
      status: "completed",
      "payout.status": "pending",
      "payout.payoutMonth": monthKey
    });

    if (!unpaidBookings.length)
      return responser.error(res, "NO_BOOKINGS_TO_PAY");

    const totalPayout = unpaidBookings.reduce(
      (sum, b) => sum + b.payout.payoutAmount,
      0
    );

    const payout = await depManager.PAYOUTS.getPayoutsModel().create({
      ownerID: userID,
      studioID: studio._id,
      date: new Date(),
      payoutMonth: monthKey,
      totalPayout,
      totalBookings: unpaidBookings.length,
      status: "processing"
    });

    // Update related bookings as processing
    await depManager.BOOKINGS.getBookingsModel().updateMany(
      {
        _id: { $in: unpaidBookings.map(b => b._id) }
      },
      {
        $set: {
          "payout.status": "processing"
        }
      }
    );

    return responser.success(res, payout, "PAYOUT_REQUESTED");
  } catch (err) {
    console.error("Payout request error:", err);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function settlePayout(req, res) {
  
  try{

    if (req.roleID !== 'admin')
      return responser.error(res, 'FORBIDDEN');

    const { payoutId } = req.body;

    const payout = await depManager.PAYOUTS.getPayoutsModel().findById(payoutId);
    if (!payout || payout.status !== "processing")
      throw new Error("Invalid payout request");

    const studioOwner = await depManager.USER.getUserModel().findById(payout.ownerID)

    const fundAccountId = studioOwner.razorpay?.fundAccountId;
    if (!fundAccountId){
      return responser.error(res, "FUND_ACCOUNT_NOT_FOUND");
    }

    let razorpayRes;
    try {
      razorpayRes = await createPayout({
        fundAccountId,
        amount: payout.totalPayout,
        purpose: "payout",
        referenceId: `MONTHLY-${payout.payoutMonth}-${payout.ownerID}`
      });
    } catch (err) {
      payout.status = "failed";
      payout.failedReason = err?.response?.data?.error?.description || err.message;
      await payout.save();
      return responser.error(res, "RAZORPAY_PAYOUT_FAILED");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try{
      payout.status = "completed";
      payout.transactionId = razorpayRes.id;
      payout.payoutDate = new Date();
      await payout.save();
      await depManager.BOOKINGS.getBookingsModel().updateMany(
        {
          studioID: payout.studioID,
          "payout.status": "processing",
          "payout.payoutMonth": payout.payoutMonth
        },
        {
          $set: {
            "payout.status": "completed",
            "payout.transactionId": razorpayRes.id,
            "payout.payoutDate": new Date()
          }
        }
      );
      await session.commitTransaction();
    }catch(e){
      await session.abortTransaction();
      throw e;
    }finally{
      session.endSession();
    }
    
    return responser.success(res, payout, "PAYOUT_SETTLED");
    
  }catch(e){
    console.error("Payout request error:", err);
    return responser.error(res, "GLOBAL_E001");
  }
}



module.exports = {
    listPayouts,
    requestPayout,
    settlePayout
}