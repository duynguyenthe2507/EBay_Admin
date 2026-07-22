const express = require("express");
const router = express.Router();

// Import middleware xác thực và phân quyền
const {
  authMiddleware,
  authorizeRoles,
  isAdmin,
} = require("../middleware/auth.middleware");
const adminAccessGuard = require('../middleware/adminAccessGuard');
const monitorGuard = require('../middleware/monitorGuard');

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

  // Email
  sendAdminEmail,
} = require("../controllers/adminController");

const {
  createVoucher,
  getVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher,
  toggleVoucherActive,
} = require('../controllers/voucherController');

const { authorize, PERMISSIONS, ADMIN_ROLES } = require('../middleware/rbac');

router.use(authMiddleware);
router.use(authorizeRoles(...ADMIN_ROLES));
router.use(adminAccessGuard);
router.use(monitorGuard); // monitor role: read-only, block POST/PUT/PATCH/DELETE
// --- User Management Routes ---
router.get("/users", authorize(PERMISSIONS.MANAGE_USERS), getAllUsers);
router.get("/users/:userId", authorize(PERMISSIONS.MANAGE_USERS), getUserDetails);
router.put("/users/:userId", authorize(PERMISSIONS.MANAGE_USERS), updateUserByAdmin);
router.put("/users/:userId/approve", authorize(PERMISSIONS.MANAGE_USERS), approveUser); 
router.put("/users/:userId/role", authorize(PERMISSIONS.MANAGE_USERS), updateUserRole); 
router.post("/create-admin-user", authorize(PERMISSIONS.MANAGE_USERS), createAdminUser); 
router.delete("/users/:userId", authorize(PERMISSIONS.MANAGE_USERS), deleteUserByAdmin);

// --- Store Management Routes ---
router.get("/stores", authorize(PERMISSIONS.MANAGE_USERS), getAllStoresAdmin);
router.get("/stores/:storeId", authorize(PERMISSIONS.MANAGE_USERS), getStoreDetails);
router.put("/stores/:storeId", authorize(PERMISSIONS.MANAGE_USERS), updateStoreByAdmin);
router.put("/stores/:storeId/status", authorize(PERMISSIONS.MANAGE_USERS), updateStoreStatusByAdmin);

// --- Dispute Management Routes ---
router.get("/disputes", authorize(PERMISSIONS.MANAGE_DISPUTES), getAllDisputesAdmin);
router.put("/disputes/:disputeId", authorize(PERMISSIONS.MANAGE_DISPUTES), updateDisputeByAdmin);

// --- Product Management by Admin Routes ---
router.get("/products", authorize(PERMISSIONS.MANAGE_PRODUCTS), getAllProductsAdmin);
router.get("/products/:id", authorize(PERMISSIONS.MANAGE_PRODUCTS), getProductDetailsAdmin);
router.put("/products/:id/status", authorize(PERMISSIONS.MANAGE_PRODUCTS), updateProductStatusAdmin);
router.delete("/products/:id", authorize(PERMISSIONS.MANAGE_PRODUCTS), deleteProductAdmin);
router.get("/products/stats", authorize(PERMISSIONS.MANAGE_PRODUCTS), getProductStatsAdmin);
router.get("/products/:id/reviews", authorize(PERMISSIONS.MANAGE_PRODUCTS), getProductReviewsAndStats);

// --- Order Management by Admin Routes ---
router.get("/orders", authorize(PERMISSIONS.MANAGE_ORDERS), getAllOrdersAdmin);
router.get("/orders/:orderId", authorize(PERMISSIONS.MANAGE_ORDERS), getOrderDetailsAdmin);
router.put("/orders/:orderId/status", authorize(PERMISSIONS.MANAGE_ORDERS), updateOrderStatusAdmin);

// --- Review and Feedback Moderation Routes ---
router.get("/reviews", authorize(PERMISSIONS.MANAGE_REVIEWS), getAllReviewsAdmin);
router.delete("/reviews/:id", authorize(PERMISSIONS.MANAGE_REVIEWS), deleteReviewAdmin);
router.get('/seller-feedbacks', authorize(PERMISSIONS.MANAGE_REVIEWS), getAllSellerFeedbackAdmin);

// --- Admin Dashboard Routes ---
router.get("/report", authorize(PERMISSIONS.VIEW_REPORTS), getAdminReport);

// --- Email Routes ---
router.post('/send-email', sendAdminEmail);

// Voucher Management Routes
router.post('/vouchers', authorize(PERMISSIONS.MANAGE_VOUCHERS), createVoucher);
router.get('/vouchers', authorize(PERMISSIONS.MANAGE_VOUCHERS), getVouchers);
router.get('/vouchers/:id', authorize(PERMISSIONS.MANAGE_VOUCHERS), getVoucherById);
router.put('/vouchers/:id', authorize(PERMISSIONS.MANAGE_VOUCHERS), updateVoucher);
router.delete('/vouchers/:id', authorize(PERMISSIONS.MANAGE_VOUCHERS), deleteVoucher);
router.put('/vouchers/:id/toggle-active', authorize(PERMISSIONS.MANAGE_VOUCHERS), toggleVoucherActive);

module.exports = router;