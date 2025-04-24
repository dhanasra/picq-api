const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const _bookingsSchema = new Schema({
  userID: { 
    type: Schema.Types.ObjectId, 
    ref: 'Users', 
    required: true 
  },
  studioID: { 
    type: Schema.Types.ObjectId, 
    ref: 'Studios', 
    required: true 
  },
  roomID: { 
    type: Schema.Types.ObjectId, 
    default: null 
  },
  paymentID: { 
    type: Schema.Types.ObjectId, 
    ref: 'Payments', 
    default: null,
  },
  bookingType: { 
    type: String, 
    enum: ['online', 'offline'], 
    default: "online",
  },
  dateTime: { 
    type: Date, 
    required: true 
  },
  endDateTime: { 
    type: Date,
    default: null 
  },
  duration: { 
    type: Number,
    default: null 
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  total: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  extras: { 
    type: Object, 
    default: []
  },
  paymentDetails: {
    status: { 
        type: String, 
        enum: ['pending', 'partial', 'completed'], 
        default: 'pending' 
    },
    partialPayment: {
      type: Number, 
      default: null,
      min: 0 
    },
    paymentMethod: {
      type: String,
      enum: ['Card', 'UPI', 'Net Banking', 'Cash', 'Online'],
      default: 'Online'
    },
    transactionID: { 
      type: String,
      default: null
    },
    paymentDate: { 
      type: Date,
      default: null
    },
  },
  notes: { 
    type: String,
    default: null 
  },
  adminNotes: { 
    type: String,
    default: null 
  },
  cancellationReason: { 
    type: String,
    default: null 
  },
  cancelledBy: { 
    enum: ['admin', 'owner', 'user'],
    type: String,
    default: null 
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


const getBookingsModel = () => {
  return mongoose.model("Bookings", _bookingsSchema, "Bookings");
};

module.exports = {
  getBookingsModel
};
