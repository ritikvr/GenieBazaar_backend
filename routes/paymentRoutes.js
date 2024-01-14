const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  processPayment,
  sendStripeApiKey,
} = require("../controllers/paymentController");

const router = express.Router();

router.route("/process/payment").post(authMiddleware, processPayment);

router.route("/stripeapikey").get(authMiddleware, sendStripeApiKey);

module.exports = router;
