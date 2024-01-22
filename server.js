const express = require("express");

const app = express();
const cookieParser = require("cookie-parser");
const cloudinary = require("cloudinary");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");

const dotenv = require("dotenv");
dotenv.config();
const connectDb = require("./config/db");

app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));
app.use(fileUpload({ limits: { fileSize: 100 * 1024 * 1024 } }));
app.use(
  cors({
    origin: ["https://genie-bazaar-frontend.vercel.app"],
  })
);
connectDb();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const product = require("./routes/productRoutes");
const user = require("./routes/userRoutes");
const order = require("./routes/orderRoutes");
const payment = require("./routes/paymentRoutes");

app.use("/api/v1", product);
app.use("/api/v1", user);
app.use("/api/v1", order);
app.use("/api/v1", payment);

app.listen(process.env.PORT, () => {
  console.log(`server is running on http://localhost:${process.env.PORT}`);
});
