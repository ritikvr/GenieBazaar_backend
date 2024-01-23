const generateToken = require("../config/generateToken");
const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("cloudinary");

exports.registerUser = async (req, res) => {
  const { name, email, password, avatar, role } = req.body;
  try {
    let myCloud;
    if (avatar) {
      myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatar",
        width: 150,
        crop: "scale",
      });
    }
    const user = await User.create({
      name: name,
      email: email,
      password: password,
      avatar: avatar
        ? {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          }
        : undefined,
      role: role,
    });
    if (user) {
      const token = generateToken(user._id);
      res
        .status(201)
        .cookie("token", token, {
          expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
          ),
          // httpOnly: true,
        })
        .json({ user, token });
    } else {
      res.status(400);
      throw new Error("Failed to create user");
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400);
      throw new Error("Plese provide all the details");
    }
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res
        .status(200)
        .cookie("token", token, {
          expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
          ),
          sameSite: "None",
          secure: true,
          httpOnly: true,
        })
        .json({
          user,
          token,
        });
    } else {
      res.status(400);
      throw new Error("Unauthorised user");
    }
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.logoutUser = async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    message: "Logged Out Successfully",
  });
};

exports.forgotPassword = async (req, res) => {
  let user;
  try {
    const email = req.body.email;
    if (!email) {
      throw new Error("Please provide the registered email");
    }
    user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("User not exist");
    }
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetPasswordUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/password/reset/${resetToken}`;

    const message = `Your Password reset token is \n\n ${resetPasswordUrl} \n\n If you have not requested this 
    email then, please ignore it`;
    await sendEmail({
      email: email,
      subject: `Ecommerce Password Recovery`,
      message,
    });
    res.status(200).json({
      message: `Email sent to ${email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const isPasswordMatched = await user.matchPassword(
      req.body.passwords.oldPassword
    );
    if (!isPasswordMatched) {
      throw new Error("Old password is not matched");
    }
    if (req.body.passwords.newPassword != req.body.passwords.confirmPassword) {
      throw new Error("new password and confirm password not matched");
    }
    user.password = req.body.passwords.newPassword;
    await user.save();
    res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const newUserData = {
      name: req.body.userData.name,
      email: req.body.userData.email,
    };
    if (typeof req.body.userData.avatar === "string") {
      const user = await User.findById(req.user.id);
      if (user.avatar && user.avatar.public_id) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      }
      const myCloud = await cloudinary.v2.uploader.upload(
        req.body.userData.avatar,
        {
          folder: "avatar",
          width: 150,
          crop: "scale",
        }
      );
      newUserData.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
    const user = await User.findOneAndUpdate(
      { _id: req.user.id },
      newUserData,
      {
        new: true,
      }
    );
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Admin controllers

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getUserForAdmin = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      throw new Error("Please provide the user id");
    }
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("user not exists");
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const newUserData = {
      name: req.body.userData.name,
      email: req.body.userData.email,
      role: req.body.userData.role,
    };
    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      newUserData,
      {
        new: true,
      }
    );
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new Error("user not exists");
    }
    if (user.avatar && user.avatar.public_id) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    }
    await user.deleteOne();
    res.status(200).json({
      message: "user deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};
