const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const _couponSchema = new Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true 
    },
    type: { 
        type: String, 
        enum: ['flat', 'percent'], 
        required: true 
    },
    discount: { 
        type: Number, 
        required: true 
    },
    maxDiscount: { 
        type: Number, 
        default: null 
    },
    minBookingAmount: { 
        type: Number, 
        default: 0 
    },
    validFrom: { 
        type: Date, 
        required: true 
    },
    validTill: { 
        type: Date, 
        required: true 
    },
    maxUsage: { 
        type: Number, 
        default: null 
    },
    usageCount: { 
        type: Number, 
        default: 0 
    },
    perUserLimit: { 
        type: Number, 
        default: 1 
    },
    target: {
        type: String,
        enum: ['all', 'new_users', 'specific_users', 'prime'],
        default: 'all',
    },
    allowedUsers: [
        { 
            type: Schema.Types.ObjectId, 
            ref: 'Users' 
        }],
    active: { 
        type: Boolean, 
        default: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
})

const _couponUsageSchema = new Schema({
  couponID: {
    type: Schema.Types.ObjectId,
    ref: "Coupons",
    required: true
  },
  userID: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
  usedAt: {
    type: Date,
    default: Date.now
  }
});

const getCouponsModel = () => {
  return mongoose.model("Coupons", _couponSchema, "Coupons");
};

const getCouponUsagesModel = () => {
  return mongoose.model("CouponUsages", _couponUsageSchema, "CouponUsages");
};

module.exports = {
  getCouponsModel,
  getCouponUsagesModel
};