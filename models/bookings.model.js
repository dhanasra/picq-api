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
  paymentID: { 
    type: Schema.Types.ObjectId, 
    ref: 'Payments', 
    default: null,
  },
  category: { 
    type: String, 
    default: null,
  },
  service: { 
    type: String, 
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
  room: { 
    type: String, 
    default: null 
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
  paymentDetails: {
    status: { 
        type: String, 
        enum: ['pending', 'partial', 'completed'], 
        default: 'pending' 
    },
    paymentMethod: {
      type: String,
      enum: ['Card', 'UPI', 'Net Banking', 'Cash on Delivery', 'Online'],
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
