const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const authMiddleware = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(401);
      throw new Error("Not Authorized");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (error) {
    res.json({
      message: error.message,
    });
  }
};

const authRoles = (role) => (req, res, next) => {
  try {
    if (role != req.user.role) {
      throw new Error("This resource can not accessed by this user");
    }
    next();
  } catch (error) {
    res.json({
      message: error.message,
    });
  }
};

module.exports = { authMiddleware, authRoles };
