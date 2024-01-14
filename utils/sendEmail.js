const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "coflinx@gmail.com",
      pass: "Yarri@1234",
    },
    secure: true, // Use a secure connection
    tls: {
      rejectUnauthorized: false, // Ignore certificate verification for testing purposes
    },
  });
  const mailOptions = {
    from: "coflinx@gmail.com",
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
