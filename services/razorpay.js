const axios = require("axios");

const razorpayAuth = {
  username: process.env.RAZORPAY_KEY_ID,
  password: process.env.RAZORPAY_KEY_SECRET,
};

async function createRazorpayContact(user) {
  const payload = {
    name: `${user.firstName || 'Studio'} ${user.lastName || ''}`.trim() || user.phoneNumber,
    email: user.email,
    contact: user.phoneNumber,
    type: 'vendor',
    reference_id: user._id.toString(),
  };

  const res = await axios.post(
    'https://api.razorpay.com/v1/contacts',
    payload,
    { auth: razorpayAuth }
  );

  return res.data.id;
}

async function createFundAccount(contactId, bankInfo) {
  const response = await axios.post(
    "https://api.razorpay.com/v1/fund_accounts",
    {
      contact_id: contactId,
      account_type: "bank_account",
      bank_account: {
        name: bankInfo.accountHolder,
        ifsc: bankInfo.ifscCode,
        account_number: bankInfo.accountNumber
      }
    },
    { auth: razorpayAuth }
  );

  return response.data.id;
}

async function createPayout({ fundAccountId, amount, currency = "INR", purpose = "payout", narration = "Studio Owner Payout", referenceId }) {
  return axios
    .post("https://api.razorpay.com/v1/payouts", {
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id: fundAccountId,
      amount: amount * 100,
      currency,
      mode: "IMPS",
      purpose,
      narration,
      reference_id: referenceId
    }, {
      auth: razorpayAuth
    })
    .then(res => res.data)
    .catch(err => {
      console.error("RazorpayX payout failed:", err?.response?.data || err.message);
      throw err;
    });
}

module.exports = { 
    createPayout,
    createRazorpayContact,
    createFundAccount
};