const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const _payoutSchema = new Schema({
    ownerID: { 
        type: Schema.Types.ObjectId, 
        ref: 'Users', 
        required: true },
    studioID: { 
        type: Schema.Types.ObjectId, 
        ref: 'Studios', 
        required: true 
    },
    date: { 
        type: Date, 
        required: true 
    },
    totalPayout: { 
        type: Number, 
        required: true 
    },
    totalBookings: { 
        type: Number, 
        required: true 
    },
    transactionId: { 
        type: String 
    },
    status: { 
        type: String, 
        enum: ['requested', 'processing', 'completed', 'failed'],
        default: 'requested' 
    },
    payoutMonth: { 
        type: String, 
        required: true 
    },
    failedReason: { 
        type: String, 
        default: null 
    }
})

const getPayoutsModel = () => {
  return mongoose.model("Payouts", _payoutSchema, "Payouts");
};

module.exports = {
  getPayoutsModel
};