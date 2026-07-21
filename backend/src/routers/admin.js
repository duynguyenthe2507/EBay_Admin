const express = require("express");
const router = express.Router();

// Import middleware xác thực và phân quyền
const {
  authMiddleware,
  authorizeRoles,
  isAdmin,
} = require("../middleware/auth.middleware");
const adminAccessGuard = require('../middleware/adminAccessGuard');

// Import các controller functions từ adminController
const {
  // User Management
  getAllUsers,
  getUserDetails,
  updateUserByAdmin,
  deleteUserByAdmin,

  // Store Management
  getAllStoresAdmin,
  getStoreDetails,
  updateStoreStatusByAdmin,
  updateStoreByAdmin,
  deleteStoreByAdmin,

  // Category Management
  createCategoryAdmin,
  getCategoriesAdmin,
  updateCategoryAdmin,
  deleteCategoryAdmin,

  // Dispute Management
  getAllDisputesAdmin,
  updateDisputeByAdmin,

  // Coupon Management
  createCouponAdmin,
  getAllCouponsAdmin,
  updateCouponAdmin,
  deleteCouponAdmin,

  // Product Management by Admin
  getAllProductsAdmin,
  getProductDetailsAdmin,
  deleteProductAdmin,
  deleteReviewAdmin,
  getProductStatsAdmin,
  updateProductStatusAdmin,

  getProductReviewsAndStats,

  // Order Management by Admin
  getAllOrdersAdmin,
  getOrderDetailsAdmin,
  updateOrderStatusAdmin,

  // User Approval
  approveUser,

  // Review and Feedback Moderation
  getAllReviewsAdmin,
  deleteReviewByAdmin,
  getAllSellerFeedbackAdmin,

  // Admin Dashboard
  getAdminReport,
  createAdminUser,
  updateUserRole,
} = require("../controllers/adminController");

const {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  toggleVoucherActive,
} = require('../controllers/voucherController');

// Áp dụng middleware xác thực và phân quyền admin-level (admin, monitor, support, finance)
const { ADMIN_ROLES } = require('../middleware/rbac');
router.use(authMiddleware);
router.use(authorizeRoles(...ADMIN_ROLES));
router.use(adminAccessGuard);
// --- User Management Routes ---
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.put("/users/:userId", updateUserByAdmin);
router.put("/users/:userId/approve", approveUser); // Approve/Reject user account
router.put("/users/:userId/role", updateUserRole); // Update user role
router.post("/create-admin-user", createAdminUser); // Create new admin user with specific role
router.delete("/users/:userId", deleteUserByAdmin);
// --- Store Management Routes ---
router.get("/stores", getAllStoresAdmin);
router.get("/stores/:storeId", getStoreDetails);
router.put("/stores/:storeId", updateStoreByAdmin);
router.put("/stores/:storeId/status", updateStoreStatusByAdmin);

// // --- Category Management Routes ---
// router.post("/categories", createCategoryAdmin);
// router.get("/categories", getCategoriesAdmin);
// router.put("/categories/:categoryId", updateCategoryAdmin);
// router.delete("/categories/:categoryId", deleteCategoryAdmin);

// // --- Dispute Management Routes ---
// --- Dispute Management Routes ---
router.get("/disputes", getAllDisputesAdmin);
router.put("/disputes/:disputeId", updateDisputeByAdmin);

// --- Product Management by Admin Routes ---
router.get("/products", getAllProductsAdmin); // danh sách
router.get("/products/:id", getProductDetailsAdmin); // chi tiết sản phẩm
router.put("/products/:id/status", updateProductStatusAdmin); // cập nhật trạng thái
router.delete("/products/:id", deleteProductAdmin); // xoá sản phẩm
router.get("/products/stats", getProductStatsAdmin); // thống kê sản phẩm
router.get("/products/:id/reviews", getProductReviewsAndStats);

// --- Order Management by Admin Routes ---
router.get("/orders", getAllOrdersAdmin);
router.get("/orders/:orderId", getOrderDetailsAdmin);
router.put("/orders/:orderId/status", updateOrderStatusAdmin);

// --- Review and Feedback Moderation Routes ---
router.get("/reviews", getAllReviewsAdmin); // danh sách đánh giá
router.delete("/reviews/:id", deleteReviewAdmin); // xoá đánh giá theo ID
router.get('/seller-feedbacks', getAllSellerFeedbackAdmin); // danh sách feedback của seller

// --- Admin Dashboard Routes ---
router.get("/report", getAdminReport);

// Voucher Management Routes
router.post('/vouchers', createVoucher);
router.get('/vouchers', getVouchers);
router.get('/vouchers/:id', getVoucherById);
router.put('/vouchers/:id', updateVoucher);
router.delete('/vouchers/:id', deleteVoucher);
router.put('/vouchers/:id/toggle-active', toggleVoucherActive);

module.exports = router;