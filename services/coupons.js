const depManager = require("../core/depManager");
const responser = require("../core/responser");
const { ObjectId } = require("mongodb");

async function create(req, res) {
  const {
    code,
    type, // "flat" or "percentage"
    discount,
    maxDiscount,
    validFrom,
    validTill,
    usageLimit,
    target, // "all", "new_users", "specific_users"
    users = []
  } = req.body;

  const CouponModel = depManager.COUPONS.getCouponsModel();

  const existing = await CouponModel.findOne({ code });
  if (existing) {
    return responser.error(res, null, "COUPON_E001"); // Coupon already exists
  }

  const newCoupon = await CouponModel.create({
    code: code.toUpperCase(),
    type,
    discount,
    maxDiscount,
    validFrom,
    validTill,
    usageLimit,
    target,
    users,
    createdAt: new Date()
  });

  return responser.success(res, newCoupon, "COUPON_S001");
}

async function list(req, res) {
  const CouponModel = depManager.COUPONS.getCouponsModel();

  const coupons = await CouponModel.find().sort({ createdAt: -1 });

  return responser.success(res, coupons, "COUPON_S002");
}

async function getMyCoupons(req, res) {
  try {
    const userID = req.userID;

    const CouponModel = depManager.COUPONS.getCouponsModel();
    const UsageModel = depManager.COUPONS.getCouponUsagesModel();
    const BookingModel = depManager.BOOKINGS.getBookingsModel();

    const now = new Date();

    // Get all valid coupons
    const coupons = await CouponModel.find({
      active: true,
      validFrom: { $lte: now },
      validTill: { $gte: now }
    }).lean();

    const userBookings = await BookingModel.countDocuments({ userID });

    // Use Promise.all to check all coupons in parallel
    const availableCoupons = await Promise.all(
      coupons.map(async (coupon) => {
        const usedCount = await UsageModel.countDocuments({
          couponID: coupon._id,
          userID
        });

        if (coupon.usageLimit && usedCount >= coupon.usageLimit) return null;
        if (coupon.target === "new_users" && userBookings > 0) return null;
        if (
          coupon.target === "specific_users" &&
          !coupon.users?.map(String).includes(userID.toString())
        )
          return null;

        return coupon;
      })
    );

    // Filter out nulls
    const filteredCoupons = availableCoupons.filter(Boolean);

    return responser.success(res, filteredCoupons, "COUPON_S002");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function getApplicableCoupons(req, res) {
  try {
    const { userID } = req;
    const { totalAmount } = req.query;

    const CouponModel = depManager.COUPONS.getCouponsModel();
    const UsageModel = depManager.COUPONS.getCouponUsagesModel();
    const BookingModel = depManager.BOOKINGS.getBookingsModel();

    const now = new Date();
    const userBookings = await BookingModel.countDocuments({ userID });

    const allCoupons = await CouponModel.find({
      active: true,
      validFrom: { $lte: now },
      validTill: { $gte: now },
      $or: [
        { minBookingAmount: { $exists: false } },
        { minBookingAmount: { $lte: totalAmount } }
      ]
    }).lean();

    const applicable = await Promise.all(
      allCoupons.map(async (coupon) => {
        const usedCount = await UsageModel.countDocuments({
          couponID: coupon._id,
          userID,
        });

        if (coupon.perUserLimit && usedCount >= coupon.perUserLimit) return null;

        if (coupon.target === "new_users" && userBookings > 0) return null;

        if (
          coupon.target === "specific_users" &&
          !coupon.users?.map(String).includes(userID.toString())
        ) return null;

        return coupon;
      })
    );

    const filtered = applicable.filter(Boolean);
    return responser.success(res, filtered, "COUPON_S002");
  } catch (e) {
    console.error(e);
    return responser.error(res, "GLOBAL_E001");
  }
}


async function getByCode(req, res) {
    try{
        const { code } = req.params;
        const CouponModel = depManager.COUPONS.getCouponsModel();

        const coupon = await CouponModel.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return responser.error(res, null, "COUPON_E002");
        }

        return responser.success(res, coupon, "COUPON_S003");
    }catch(e){
        console.error(e);
        return responser.error(res, "GLOBAL_E001");
    }
}

async function update(req, res) {
  try {
    const { id } = req.params;

    const CouponModel = depManager.COUPONS.getCouponsModel();
    const coupon = await CouponModel.findById(id);

    if (!coupon) {
      return responser.error(res, null, "COUPON_E007"); // Not found
    }

    const {
      code,
      type,
      discount,
      maxDiscount,
      minBookingAmount,
      validFrom,
      validTill,
      maxUsage,
      perUserLimit,
      target,
      allowedUsers,
      active,
    } = req.body;

    if (code) coupon.code = code;
    if (type) coupon.type = type;
    if (discount != null) coupon.discount = discount;
    if (maxDiscount != null) coupon.maxDiscount = maxDiscount;
    if (minBookingAmount != null) coupon.minBookingAmount = minBookingAmount;
    if (validFrom) coupon.validFrom = validFrom;
    if (validTill) coupon.validTill = validTill;
    if (maxUsage != null) coupon.maxUsage = maxUsage;
    if (perUserLimit != null) coupon.perUserLimit = perUserLimit;
    if (target) coupon.target = target;
    if (allowedUsers) coupon.allowedUsers = allowedUsers;
    if (active != null) coupon.active = active;

    coupon.updatedAt = Date.now();

    await coupon.save();

    return responser.success(res, coupon, "COUPON_S005");
  } catch (e) {
    console.error("Error in update coupon:", e);
    return responser.error(res, "GLOBAL_E001");
  }
}

async function remove(req, res) {
    try{

        const { id } = req.params;

        const CouponModel = depManager.COUPONS.getCouponsModel();
        const UsageModel = depManager.COUPONS.getCouponUsagesModel();

        // Check if the coupon exists
        const coupon = await CouponModel.findById(id);
        if (!coupon) {
            return responser.error(res, "COUPON_E001"); // Coupon not found
        }

        // Check if the coupon has been used
        const usageCount = await UsageModel.countDocuments({ couponID: id });

        if (usageCount > 0) {
            // Soft delete
            coupon.active = false;
            await coupon.save();
            return responser.success(res, true, "COUPON_S006");
        } else {
            // Hard delete
            await CouponModel.findByIdAndDelete(id);
            return responser.success(res, true, "COUPON_S006");
        }
    }catch(e){
        console.error(e);
        return responser.error(res, "GLOBAL_E001");
    }
}


module.exports = {
  create,
  list,
  getByCode,
  getMyCoupons,
  getApplicableCoupons,
  update,
  remove
};
