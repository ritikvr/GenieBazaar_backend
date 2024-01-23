const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  getUserDetails,
  updatePassword,
  updateProfile,
  getAllUsers,
  getUserForAdmin,
  updateUserRole,
  deleteUser,
} = require("../controllers/userController");
const { authMiddleware, authRoles } = require("../middleware/auth");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logoutUser);
router.post("/password/forgot", forgotPassword);
router.post("/me", authMiddleware, getUserDetails);
router.put("/password/update", authMiddleware, updatePassword);
router.put("/me/update", authMiddleware, updateProfile);

router.post("/admin/users", authMiddleware, authRoles("admin"), getAllUsers);
router
  .route("/admin/user/:id")
  .post(authMiddleware, authRoles("admin"), getUserForAdmin)
  .put(authMiddleware, authRoles("admin"), updateUserRole);

router
  .route("/admin/user/delete/:id")
  .post(authMiddleware, authRoles("admin"), deleteUser);

module.exports = router;
