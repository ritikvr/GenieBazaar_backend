const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.processPayment = async (req, res) => {
  try {
    const myPayment = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "inr",
      description: "amount deposited",
      metadata: {
        company: "Ecommerce",
      },
    });
    res.status(200).json({ client_secret: myPayment.client_secret });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.sendStripeApiKey = (req, res) => {
  res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
};
