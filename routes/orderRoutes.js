const express = require("express");
const { authMiddleware, authRoles } = require("../middleware/auth");
const {
  newOrder,
  getOrderDetails,
  myOrders,
  getAllOrders,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController");

const router = express.Router();

router.route("/order/new").post(authMiddleware, newOrder);
router.route("/order/:id").post(authMiddleware, getOrderDetails);
router.route("/me/orders").post(authMiddleware, myOrders);

router
  .route("/admin/orders")
  .post(authMiddleware, authRoles("admin"), getAllOrders);

router
  .route("/admin/order/:id")
  .put(authMiddleware, authRoles("admin"), updateOrder)
  .post(authMiddleware, authRoles("admin"), deleteOrder);

module.exports = router;
