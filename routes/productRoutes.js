const express = require("express");
const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetails,
  createProductReview,
  getProductReviews,
  deleteReview,
  getAdminProducts,
} = require("../controllers/productController");
const { authMiddleware, authRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/products", getAllProducts);

router.get(
  "/admin/products",
  authMiddleware,
  authRoles("admin"),
  getAdminProducts
);
router.post(
  "/admin/product/new",
  authMiddleware,
  authRoles("admin"),
  createProduct
);
router.put(
  "/admin/product/:id",
  authMiddleware,
  authRoles("admin"),
  updateProduct
);
router.delete(
  "/admin/product/:id",
  authMiddleware,
  authRoles("admin"),
  deleteProduct
);
router.get("/product/:id", getProductDetails);
router.put("/review", authMiddleware, createProductReview);
router
  .route("/reviews")
  .get(getProductReviews)
  .delete(authMiddleware, deleteReview);

module.exports = router;
