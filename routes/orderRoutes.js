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
router.route("/order/:id").get(authMiddleware, getOrderDetails);
router.route("/me/orders").get(authMiddleware, myOrders);

router
  .route("/admin/orders")
  .get(authMiddleware, authRoles("admin"), getAllOrders);

router
  .route("/admin/order/:id")
  .put(authMiddleware, authRoles("admin"), updateOrder)
  .delete(authMiddleware, authRoles("admin"), deleteOrder);

module.exports = router;
