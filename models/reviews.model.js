const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studioReviewSchema = new Schema({
  studioID: {
    type: Schema.Types.ObjectId,
    ref: "Studios",
    required: true
  },
  userID: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
  username: {
    type: String,
    default: null
  },
  picture: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    required: true,
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"]
  },
  review: {
    type: String,
    default: null,
    trim: true,
    maxlength: [1000, "Review cannot exceed 1000 characters"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

studioReviewSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const getStudioReviewsModel = () => {
  return mongoose.model("StudioReviews", studioReviewSchema, "StudioReviews");
};

module.exports = {
  getStudioReviewsModel
};
