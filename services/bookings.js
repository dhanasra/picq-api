const depManager = require("../core/depManager");
const responser = require("../core/responser");

async function createOffline(req, res) {
    try {
        const { name, phoneNumber, email, studioID, dateTime, endDateTime, duration, amount, room, paymentMethod, paymentStatus, notes } = req.body;

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
                    loginType: "offline"
                }
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
            amount,
            status: "confirmed",
            paymentDetails: {
                status: paymentStatus,
                method: paymentMethod
            },
            notes,
            createdAt: Date.now()
        };

        // Create booking
        const booking = await depManager.BOOKINGS.getBookingsModel().create(bookingData);

        return responser.success(res, booking, "BOOKINGS_S001");
    } catch (e) {
        console.error("Error in createOffline:", e);
        return responser.error(res, "GLOBAL_E001");
    }
}

module.exports = { createOffline };
