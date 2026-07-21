const {
  User,
  Store,
  Category,
  Product,
  Order,
  OrderItem,
  Dispute,
  Coupon,
  Feedback,
  Review,
  Address,
  Bid,
  Inventory,
  Message,
  Payment,
  ReturnRequest,
  ShippingInfo,
} = require("../models");
const { sendEmail } = require("../utils/email");
const logger = require("../utils/logger");
const mongoose = require("mongoose");

// --- Hàm Hỗ Trợ Xử Lý Lỗi (Helper Function for Error Responses) ---
// Hàm này giúp chuẩn hóa việc xử lý và phản hồi lỗi.
const handleError = (res, error, message = "Lỗi Máy Chủ", statusCode = 500) => {
  logger.error(`${message}: `, error); // Ghi log lỗi chi tiết
  // Trả về phản hồi JSON với mã trạng thái và thông báo lỗi.
  res
    .status(statusCode)
    .json({ success: false, message, error: error.message });
};

// --- Quản Lý Người Dùng (User Management) ---

/**
 * @desc Lấy tất cả người dùng với phân trang và lọc
 * @route GET /api/admin/users?page=<page>&limit=<limit>
 * @access Riêng tư (Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let query = {};

    // Exclude admin users from the list
    query.role = { $ne: 'admin' };

    // Filter by search
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: "i" };

      // Try to find users by username/email (excluding admin)
      const foundUsers = await User.find({
        $or: [
          { username: searchRegex },
          { email: searchRegex }
        ],
        role: { $ne: 'admin' } // Exclude admin in search
      }).select('_id');

      // Build search query
      const searchConditions = [];

      // Search by user ID (if it's a valid ObjectId)
      if (mongoose.Types.ObjectId.isValid(req.query.search)) {
        const searchId = new mongoose.Types.ObjectId(req.query.search);
        // Verify it's not an admin
        const userCheck = await User.findById(searchId).select('role');
        if (userCheck && userCheck.role !== 'admin') {
          searchConditions.push({ _id: searchId });
        }
      }

      // Search by found user IDs
      if (foundUsers.length > 0) {
        const userIds = foundUsers.map(u => u._id);
        searchConditions.push({ _id: { $in: userIds } });
      }

      if (searchConditions.length > 0) {
        // Use $and to combine role exclusion with search
        query.$and = [
          { role: { $ne: 'admin' } },
          { $or: searchConditions }
        ];
        delete query.role; // Remove direct role assignment since we use $and
      } else {
        // No search results found, but still exclude admin
        query.role = { $ne: 'admin' };
      }
    }

    // Filter by role (but exclude admin)
    if (req.query.role && req.query.role !== 'admin') {
      if (query.$and) {
        // If $and exists, update the role condition in $and
        const roleCondition = query.$and.find(c => c.role);
        if (roleCondition) {
          roleCondition.role = req.query.role;
        } else {
          query.$and.push({ role: req.query.role });
        }
      } else {
        query.role = req.query.role;
      }
    }

    // Filter by action (lock/unlock)
    if (req.query.action && req.query.action !== 'all') {
      query.action = req.query.action;
    }

    // Filter by new users (tài khoản mới trong 2 tuần / 14 ngày)
    if (req.query.newUsers === 'true') {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      query.createdAt = { $gte: twoWeeksAgo };
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 }) // Mới nhất trước
      .skip(skip)
      .limit(limit);
    const totalUsers = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      total: totalUsers,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách người dùng");
  }
};

/**
 * @desc Lấy chi tiết một người dùng bằng ID
 * @route GET /api/admin/users/:userId
 * @access Riêng tư (Admin)
 */
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy chi tiết người dùng");
  }
};
/**
 * @desc Xóa một người dùng bởi Admin
 * @route DELETE /api/admin/users/:userId
 * @access Riêng tư (Admin)
 */
exports.deleteUserByAdmin = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }
    await User.findByIdAndDelete(userId);
    res
      .status(200)
      .json({ success: true, message: "Xóa người dùng thành công" });
  } catch (error) {
    handleError(res, error, "Lỗi khi xóa người dùng");
  }
};
/**
 * @desc Duyệt tài khoản mới (approve new account)
 * @route PUT /api/admin/users/:userId/approve
 * @access Riêng tư (Admin)
 * @body { approved: boolean, rejectionReason?: string }
 */
exports.approveUser = async (req, res) => {
  const { userId } = req.params;
  const { approved, rejectionReason } = req.body; // approved: true or false, rejectionReason: optional

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }

    // Set account status
    if (approved) {
      user.accountStatus = 'approved';
      user.approvedAt = new Date();
      user.approvedBy = req.user.id;
      user.rejectionReason = null; // Clear rejection reason when approved
    } else {
      // Nếu từ chối, set status = 'rejected'
      user.accountStatus = 'rejected';
      user.approvedAt = null;
      user.approvedBy = null;
      user.rejectionReason = rejectionReason || null; // Save rejection reason if provided
    }

    await user.save();

    // Send email notification
    if (user.email) {
      let emailSubject, emailText;

      if (approved) {
        // Email thông báo duyệt tài khoản
        emailSubject = "Tài khoản của bạn đã được duyệt";
        emailText = `Kính gửi ${user.username},\n\nTài khoản của bạn đã được duyệt bởi quản trị viên. Bạn có thể bắt đầu sử dụng dịch vụ của chúng tôi.\n\nTrân trọng,\nShopii Team`;
      } else {
        // Email thông báo từ chối tài khoản
        emailSubject = "Tài khoản của bạn chưa được duyệt";
        emailText = `Kính gửi ${user.username},\n\nRất tiếc, tài khoản của bạn chưa được duyệt bởi quản trị viên.`;

        if (rejectionReason) {
          emailText += `\n\nLý do: ${rejectionReason}`;
        }

        emailText += `\n\nVui lòng liên hệ hỗ trợ để biết thêm chi tiết hoặc yêu cầu xem xét lại.\n\nTrân trọng,\nShopii Team`;
      }

      try {
        await sendEmail(user.email, emailSubject, emailText);
      } catch (emailError) {
        console.error('Error sending approval/rejection email:', emailError);
        // Don't fail the request if email fails
      }
    }

    const userToReturn = user.toObject();
    delete userToReturn.password;

    res.status(200).json({
      success: true,
      message: approved
        ? "Duyệt tài khoản thành công"
        : "Từ chối tài khoản thành công",
      data: userToReturn,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi duyệt tài khoản");
  }
};

/**
 * @desc Cập nhật chi tiết người dùng (vai trò, trạng thái khóa/mở khóa) bởi Admin
 * @route PUT /api/admin/users/:userId
 * @access Riêng tư (Admin)
 */
exports.updateUserByAdmin = async (req, res) => {
  const { userId } = req.params;
  const { role, action, username, email } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });
    }

    const previousAction = user.action; // Lưu trạng thái trước để kiểm tra thay đổi

    if (username) user.username = username;
    if (email) user.email = email;
    if (role && ["buyer", "seller", "admin"].includes(role)) {
      user.role = role;
    }
    if (action && ["lock", "unlock"].includes(action)) {
      user.action = action;
      // Nếu lock seller, reject store nếu tồn tại
      if (action === "lock" && user.role === "seller") {
        const store = await Store.findOne({ sellerId: user._id });
        if (store) {
          store.status = "rejected";
          await store.save();
          // Gửi email thông báo store bị rejected
          await sendEmail(
            user.email,
            "Cửa hàng của bạn đã bị từ chối",
            `Kính gửi ${user.username},\n\nCửa hàng của bạn (${store.storeName}) đã bị từ chối do tài khoản của bạn bị khóa. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.\n\nTrân trọng,\nShopii Team`
          );
        }
      }
    }

    // Gửi email nếu action thay đổi
    if (action && action !== previousAction) {
      const emailSubject =
        action === "lock"
          ? "Tài khoản của bạn đã bị khóa"
          : "Tài khoản của bạn đã được mở khóa";
      const emailText =
        action === "lock"
          ? `Kính gửi ${user.username},\n\nTài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.\n\nTrân trọng,\nShopii Team`
          : `Kính gửi ${user.username},\n\nTài khoản của bạn đã được mở khóa. Bạn có thể tiếp tục sử dụng dịch vụ của chúng tôi.\n\nTrân trọng,\nShopii Team`;
      await sendEmail(user.email, emailSubject, emailText);
    }

    await user.save();
    const userToReturn = user.toObject();
    delete userToReturn.password;

    res.status(200).json({
      success: true,
      message: "Cập nhật người dùng thành công",
      data: userToReturn,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      return handleError(res, error, "Email đã được sử dụng.", 400);
    }
    handleError(res, error, "Lỗi khi cập nhật người dùng");
  }
};
// --- Quản Lý Cửa Hàng (Store Management) ---

/**
 * @desc Lấy tất cả cửa hàng (có thể lọc theo trạng thái, hỗ trợ pagination và tùy chọn tính rating từ Feedback)
 * @route GET /api/admin/stores
 * @query withRatings=true để bao gồm rating
 * @access Riêng tư (Admin)
 */
exports.getAllStoresAdmin = async (req, res) => {
  const { status, page = 1, limit = 10, withRatings = false } = req.query;
  try {
    const query = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      query.status = status;
    }
    let stores = await Store.find(query)
      .populate("sellerId", "username email")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Store.countDocuments(query);

    if (withRatings === "true") {
      // Thêm rating từ Feedback cho từng store
      stores = await Promise.all(
        stores.map(async (store) => {
          const storeObj = store.toObject(); // Chuyển sang object để thêm field

          // Lấy feedback của seller
          const feedback = await Feedback.findOne({ sellerId: store.sellerId });

          storeObj.averageRating = feedback ? feedback.averageRating : 0;
          storeObj.totalReviews = feedback ? feedback.totalReviews : 0;

          return storeObj;
        })
      );
    }

    res.status(200).json({
      success: true,
      count: stores.length,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: stores,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách cửa hàng");
  }
};

/**
 * @desc Lấy chi tiết một cửa hàng bằng ID
 * @route GET /api/admin/stores/:storeId
 * @access Riêng tư (Admin)
 */
exports.getStoreDetails = async (req, res) => {
  try {
    const store = await Store.findById(req.params.storeId).populate(
      "sellerId",
      "username email"
    );
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Cửa hàng không tồn tại" });
    }
    res.status(200).json({ success: true, data: store });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy chi tiết cửa hàng");
  }
};

/**
 * @desc Cập nhật trạng thái cửa hàng (duyệt, từ chối)
 * @route PUT /api/admin/stores/:storeId/status
 * @access Riêng tư (Admin)
 */
exports.updateStoreStatusByAdmin = async (req, res) => {
  const { storeId } = req.params;
  const { status } = req.body;

  if (!status || !["approved", "pending", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message:
        'Trạng thái không hợp lệ. Phải là "approved", "pending" hoặc "rejected".',
    });
  }

  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Cửa hàng không tồn tại" });
    }

    const previousStatus = store.status; // Lưu trạng thái trước để kiểm tra thay đổi

    if (status === "approved" && store.sellerId) {
      const seller = await User.findById(store.sellerId);
      if (!seller) {
        return res
          .status(404)
          .json({ success: false, message: "Người dùng không tồn tại" });
      }
      if (seller.action === "lock") {
        return res.status(400).json({
          success: false,
          message: "Không thể duyệt cửa hàng khi người dùng bị khóa",
        });
      }
      if (seller.role === "buyer") {
        seller.role = "seller";
        await seller.save();
      }
    }

    store.status = status;
    await store.save();

    // Gửi email nếu status thay đổi
    if (status !== previousStatus) {
      const seller = await User.findById(store.sellerId);
      if (seller) {
        let emailSubject, emailText;
        switch (status) {
          case "approved":
            emailSubject = "Cửa hàng của bạn đã được duyệt";
            emailText = `Kính gửi ${seller.username},\n\nCửa hàng của bạn (${store.storeName}) đã được duyệt thành công. Bạn có thể bắt đầu bán hàng ngay bây giờ!\n\nTrân trọng,\nShopii Team`;
            break;
          case "rejected":
            emailSubject = "Cửa hàng của bạn đã bị từ chối";
            emailText = `Kính gửi ${seller.username},\n\nCửa hàng của bạn (${store.storeName}) đã bị từ chối. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.\n\nTrân trọng,\nShopii Team`;
            break;
          case "pending":
            emailSubject = "Cửa hàng của bạn đang chờ duyệt";
            emailText = `Kính gửi ${seller.username},\n\nCửa hàng của bạn (${store.storeName}) hiện đang trong trạng thái chờ duyệt. Chúng tôi sẽ thông báo khi có cập nhật mới.\n\nTrân trọng,\nShopii Team`;
            break;
        }
        await sendEmail(seller.email, emailSubject, emailText);
      }
    }

    res.status(200).json({
      success: true,
      message: `Cửa hàng đã được ${status === "approved"
        ? "duyệt"
        : status === "rejected"
          ? "từ chối"
          : "chuyển sang chờ duyệt"
        } thành công`,
      data: store,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi cập nhật trạng thái cửa hàng");
  }
};
/**
 * @desc Cập nhật toàn bộ thông tin cửa hàng
 * @route PUT /api/admin/stores/:storeId
 * @access Riêng tư (Admin)
 */
exports.updateStoreByAdmin = async (req, res) => {
  const { storeId } = req.params;
  const {
    storeName,
    description,
    bannerImageURL,
    status,
    address,
    contactInfo,
  } = req.body;

  try {
    const store = await Store.findById(storeId);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Cửa hàng không tồn tại" });
    }

    if (storeName) store.storeName = storeName;
    if (description) store.description = description;
    if (bannerImageURL) store.bannerImageURL = bannerImageURL;
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      if (status === "approved" && store.sellerId) {
        const seller = await User.findById(store.sellerId);
        if (seller && seller.role === "user") {
          seller.role = "seller";
          await seller.save();
        }
      }
      store.status = status;
    }
    if (address) store.address = address;
    if (contactInfo) store.contactInfo = contactInfo;

    await store.save();
    res.status(200).json({
      success: true,
      message: "Cập nhật cửa hàng thành công",
      data: store,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi cập nhật cửa hàng");
  }
};
// --- Quản Lý Sản Phẩm (Product Management) ---

/**
 * @desc Lấy tất cả sản phẩm (có thể lọc theo sellerId, categoryId, status, hỗ trợ phân trang)
 * @route GET /api/admin/products
 * @access Riêng tư (Admin)
 */
exports.getAllProductsAdmin = async (req, res) => {
  const { sellerId, categoryId, status, page = 1, limit = 10 } = req.query;
  try {
    const query = {};
    if (sellerId) query.sellerId = sellerId;
    if (categoryId) query.categoryId = categoryId;
    if (status && ["available", "out_of_stock", "pending"].includes(status)) {
      // Điều chỉnh enum dựa trên DB mới
      query.status = status;
    }
    const products = await Product.find(query)
      .populate("sellerId", "username email")
      .populate("categoryId", "name")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Product.countDocuments(query);
    res.status(200).json({
      success: true,
      count: products.length,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: products,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách sản phẩm");
  }
};

/**
 * @desc Lấy chi tiết một sản phẩm bằng ID
 * @route GET /api/admin/products/:id
 * @access Riêng tư (Admin)
 */
exports.getProductDetailsAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("sellerId", "username email")
      .populate("categoryId", "name");
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy chi tiết sản phẩm");
  }
};

/**
 * @desc Cập nhật trạng thái sản phẩm
 * @route PUT /api/admin/products/:id/status
 * @access Riêng tư (Admin)
 */
exports.updateProductStatusAdmin = async (req, res) => {
  const { id } = req.params;
  const { title, description, price, isAuction, status } = req.body;

  try {
    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    // Update product fields if provided
    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (isAuction !== undefined) product.isAuction = isAuction;

    // Only update status if it's provided and valid
    if (status && ["available", "out_of_stock", "pending"].includes(status)) {
      product.status = status;
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Sản phẩm đã được cập nhật thành công",
      data: product,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi cập nhật sản phẩm");
  }
};

/**
 * @desc Xóa sản phẩm vi phạm
 * @route DELETE /api/admin/products/:id
 * @access Riêng tư (Admin)
 */
exports.deleteProductAdmin = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }
    // Có thể thêm logic xóa liên quan như reviews, inventory, etc. nếu cần
    res.status(200).json({ success: true, message: "Xóa sản phẩm thành công" });
  } catch (error) {
    handleError(res, error, "Lỗi khi xóa sản phẩm");
  }
};

/**
 * @desc Đếm và phân tích số lượng sản phẩm theo store (sellerId) hoặc trạng thái
 * @route GET /api/admin/products/stats
 * @access Riêng tư (Admin)
 */
exports.getProductStatsAdmin = async (req, res) => {
  try {
    const statsByStore = await Product.aggregate([
      { $group: { _id: "$sellerId", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "stores",
          localField: "_id",
          foreignField: "sellerId",
          as: "store",
        },
      },
      { $unwind: "$store" },
      { $project: { storeName: "$store.storeName", count: 1 } },
    ]);

    const statsByStatus = await Product.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      statsByStore,
      statsByStatus,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy thống kê sản phẩm");
  }
};

// --- Quản Lý Đơn Hàng (Order Management) ---

/**
 * @desc Lấy tất cả đơn hàng với phân trang và lọc
 * @route GET /api/admin/orders?page=<page>&limit=<limit>&status=<status>&search=<search>
 * @access Riêng tư (Admin)
 */
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let query = {};

    // Filter by status
    if (req.query.status && ['pending', 'processing', 'shipping', 'shipped', 'failed to ship', 'rejected'].includes(req.query.status)) {
      query.status = req.query.status;
    }

    // Filter by search (order ID, buyer username, buyer email)
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: "i" };

      // Try to find buyers by username/email
      const buyers = await User.find({
        $or: [
          { username: searchRegex },
          { email: searchRegex }
        ]
      }).select('_id');

      // Build search query
      const searchConditions = [];

      // Search by order ID (if it's a valid ObjectId)
      if (mongoose.Types.ObjectId.isValid(req.query.search)) {
        searchConditions.push({ _id: new mongoose.Types.ObjectId(req.query.search) });
      }

      // Search by buyer IDs
      if (buyers.length > 0) {
        const buyerIds = buyers.map(b => b._id);
        searchConditions.push({ buyerId: { $in: buyerIds } });
      }

      if (searchConditions.length > 0) {
        query.$or = searchConditions;
      }
    }

    // Filter by date range
    if (req.query.startDate || req.query.endDate) {
      query.orderDate = {};
      if (req.query.startDate) {
        query.orderDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.orderDate.$lte = new Date(req.query.endDate);
      }
    }

    // Get orders with populated buyer and address
    const orders = await Order.find(query)
      .populate('buyerId', 'username email fullname')
      .populate('addressId')
      .sort({ orderDate: -1 }) // Mới nhất trước
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);

    // Get order items and payment info for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        // Get order items with product details
        const items = await OrderItem.find({ orderId: order._id })
          .populate({
            path: 'productId',
            select: 'title image price sellerId',
            populate: {
              path: 'sellerId',
              select: 'username email'
            }
          })
          .lean();

        // Get payment info
        const payment = await Payment.findOne({ orderId: order._id })
          .select('method status amount transactionId paidAt')
          .lean();

        // Get shipping info for items
        const shippingInfos = await ShippingInfo.find({
          orderItemId: { $in: items.map(item => item._id) }
        }).lean();

        // Attach shipping info to items
        const itemsWithShipping = items.map(item => {
          const shipping = shippingInfos.find(s => s.orderItemId.toString() === item._id.toString());
          return {
            ...item,
            shippingInfo: shipping || null
          };
        });

        return {
          ...order,
          items: itemsWithShipping,
          payment: payment || null
        };
      })
    );

    res.status(200).json({
      success: true,
      data: ordersWithDetails,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      total: totalOrders,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách đơn hàng");
  }
};

/**
 * @desc Lấy chi tiết một đơn hàng bằng ID
 * @route GET /api/admin/orders/:orderId
 * @access Riêng tư (Admin)
 */
exports.getOrderDetailsAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find order with populated buyer and address
    const order = await Order.findById(orderId)
      .populate('buyerId', 'username email fullname phone avatarURL')
      .populate('addressId')
      .lean();

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Đơn hàng không tồn tại" });
    }

    // Get order items with product details
    const items = await OrderItem.find({ orderId })
      .populate({
        path: 'productId',
        select: 'title image price description sellerId categoryId',
        populate: [
          {
            path: 'sellerId',
            select: 'username email'
          },
          {
            path: 'categoryId',
            select: 'name'
          }
        ]
      })
      .lean();

    // Get payment info
    const payment = await Payment.findOne({ orderId })
      .select('method status amount transactionId paidAt createdAt')
      .lean();

    // Get shipping info for each item
    const shippingInfos = await ShippingInfo.find({
      orderItemId: { $in: items.map(item => item._id) }
    }).lean();

    // Attach shipping info to items
    const itemsWithShipping = items.map(item => {
      const shipping = shippingInfos.find(s => s.orderItemId.toString() === item._id.toString());
      return {
        ...item,
        shippingInfo: shipping || null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        ...order,
        items: itemsWithShipping,
        payment: payment || null
      },
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy chi tiết đơn hàng");
  }
};

/**
 * @desc Cập nhật trạng thái đơn hàng bởi Admin
 * @route PUT /api/admin/orders/:orderId/status
 * @access Riêng tư (Admin)
 */
exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['pending', 'processing', 'shipping', 'shipped', 'failed to ship', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(', ')}`
      });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Đơn hàng không tồn tại" });
    }

    // Update order status
    order.status = status;
    await order.save();

    // Get buyer info for email notification
    const buyer = await User.findById(order.buyerId).select('email username');

    // Send email notification if status changed
    if (buyer && buyer.email) {
      const statusMessages = {
        'pending': 'đang chờ xử lý',
        'processing': 'đang được xử lý',
        'shipping': 'đang được vận chuyển',
        'shipped': 'đã được giao',
        'failed to ship': 'giao hàng thất bại',
        'rejected': 'đã bị từ chối'
      };

      const emailSubject = `Cập nhật trạng thái đơn hàng #${orderId}`;
      const emailText = `Kính gửi ${buyer.username},\n\nĐơn hàng #${orderId} của bạn đã được cập nhật trạng thái thành: ${statusMessages[status] || status}.\n\nTổng giá trị đơn hàng: ${order.totalPrice.toLocaleString('vi-VN')} VNĐ\n\nTrân trọng,\nShopii Team`;

      try {
        await sendEmail(buyer.email, emailSubject, emailText);
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi cập nhật trạng thái đơn hàng");
  }
};

/**
 * @desc Lấy tất cả đánh giá (lọc theo productId, reviewerId, hoặc storeId, hỗ trợ phân trang)
 * @route GET /api/admin/reviews
 * @access Riêng tư (Admin)
 */
exports.getAllReviewsAdmin = async (req, res) => {
  const { productId, reviewerId, storeId, page = 1, limit = 10, search, rating } = req.query;
  try {
    let match = {};
    if (productId) match.productId = new mongoose.Types.ObjectId(productId);
    if (reviewerId) match.reviewerId = new mongoose.Types.ObjectId(reviewerId);
    if (storeId) {
      // Lọc theo storeId: review -> product -> sellerId (store.sellerId == storeId)
      const seller = await Store.findById(storeId).select("sellerId");
      if (!seller)
        return res
          .status(404)
          .json({ success: false, message: "Cửa hàng không tồn tại" });
      const products = await Product.find({ sellerId: seller.sellerId }).select(
        "_id"
      );
      match.productId = { $in: products.map((p) => p._id) };
    }

    // Build aggregation pipeline supporting optional search and rating filters
    const pipeline = [];

    // Initial match for productId/reviewerId/storeId
    pipeline.push({ $match: match });

    // Lookup product and reviewer first to allow searching by their fields
    pipeline.push({
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    });
    pipeline.push({ $unwind: "$product" });
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "reviewerId",
        foreignField: "_id",
        as: "reviewer",
      },
    });
    pipeline.push({ $unwind: "$reviewer" });

    // Apply search filter if provided (searches comment, product title, reviewer username)
    if (search) {
      const regex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: [
            { comment: { $regex: regex } },
            { "product.title": { $regex: regex } },
            { "reviewer.username": { $regex: regex } },
          ],
        },
      });
    }

    // Apply rating filter if provided
    if (rating) {
      const r = parseInt(rating);
      if (!isNaN(r)) pipeline.push({ $match: { rating: r } });
    }

    // Project fields
    pipeline.push({
      $project: {
        rating: 1,
        comment: 1,
        createdAt: 1,
        "product.title": 1,
        "reviewer.username": 1,
      },
    });

    // Pagination
    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: (parseInt(page) - 1) * parseInt(limit) });
    pipeline.push({ $limit: parseInt(limit) });

    const reviews = await Review.aggregate(pipeline);

    // For total we need to run a similar pipeline without skip/limit to count
    const countPipeline = pipeline.slice(0, -3); // remove sort/skip/limit
    countPipeline.push({ $count: 'total' });
    const countRes = await Review.aggregate(countPipeline);
    const total = countRes[0] ? countRes[0].total : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: reviews,
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy danh sách đánh giá");
  }
};
/**
 * @desc Xóa đánh giá không hợp lệ
 * @route DELETE /api/admin/reviews/:id
 * @access Riêng tư (Admin)
 */
exports.deleteReviewAdmin = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Đánh giá không tồn tại" });
    }
    // Có thể cập nhật lại feedback của seller nếu cần
    res.status(200).json({ success: true, message: "Xóa đánh giá thành công" });
  } catch (error) {
    handleError(res, error, "Lỗi khi xóa đánh giá");
  }
};

/**
 * @desc Lấy tất cả khiếu nại cho Admin (lọc, phân trang)
 * @route GET /api/admin/disputes
 * @access Riêng tư (Admin)
 */
exports.getAllDisputesAdmin = async (req, res) => {
  const { status, page = 1, limit = 10, search } = req.query;
  try {
    const query = {};
    if (status && ["open", "under_review", "resolved", "closed"].includes(status)) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // If search provided, attempt to match description, raisedBy username, or orderItemId
    if (search) {
      const regex = new RegExp(search, 'i');
      // find users matching username
      const users = await User.find({ username: { $regex: regex } }).select('_id');
      const userIds = users.map(u => u._id);
      const orClauses = [ { description: { $regex: regex } } ];
      if (userIds.length) orClauses.push({ raisedBy: { $in: userIds } });
      // if search looks like an ObjectId, include orderItemId match
      if (mongoose.Types.ObjectId.isValid(search)) {
        orClauses.push({ orderItemId: mongoose.Types.ObjectId(search) });
      }
      query.$or = orClauses;
    }

    const disputes = await Dispute.find(query)
      .populate({ path: 'orderItemId', populate: { path: 'productId', select: 'title' } })
      .populate({ path: 'raisedBy', select: 'username email' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Dispute.countDocuments(query);

    res.status(200).json({
      success: true,
      count: disputes.length,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: disputes,
    });
  } catch (error) {
    handleError(res, error, 'Lỗi khi lấy danh sách khiếu nại');
  }
};

/**
 * @desc Cập nhật / thao tác khiếu nại bởi Admin (assign / adjudicate / close)
 * @route PUT /api/admin/disputes/:disputeId
 * @access Riêng tư (Admin)
 */
exports.updateDisputeByAdmin = async (req, res) => {
  const { disputeId } = req.params;
  const { action, note } = req.body;

  try {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) {
      return res.status(404).json({ success: false, message: 'Dispute not found' });
    }

    // Allow updating status and resolution directly
    const { status: newStatus, resolution: newResolution } = req.body;

    let changed = false;
    if (newStatus && ["open", "under_review", "resolved", "closed"].includes(newStatus)) {
      dispute.status = newStatus;
      changed = true;
    }

    if (newResolution !== undefined) {
      dispute.resolution = newResolution;
      changed = true;
    }

    // Support legacy 'close' action for backward compatibility
    if (action === 'close') {
      dispute.status = 'closed';
      if (note) {
        dispute.resolution = `${dispute.resolution || ''}\n[Admin Note] ${note}`.trim();
      }
      changed = true;
    }

    if (!changed) {
      return res.status(400).json({ success: false, message: 'No valid update provided' });
    }

    await dispute.save();
    return res.status(200).json({ success: true, message: 'Dispute updated', data: dispute });
  } catch (error) {
    handleError(res, error, 'Error updating dispute');
  }
};

/**
 * @desc Lấy thống kê/feedback của các seller (Feedback collection)
 * @route GET /api/admin/seller-feedbacks
 * @access Riêng tư (Admin)
 */
exports.getAllSellerFeedbackAdmin = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('sellerId', 'username email')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, count: feedbacks.length, data: feedbacks });
  } catch (error) {
    handleError(res, error, 'Lỗi khi lấy feedback của seller');
  }
};

/**
 * @desc Lấy tất cả đánh giá của một sản phẩm và tính trung bình rating, tổng lượt review
 * @route GET /api/admin/products/:id/reviews
 * @access Công khai hoặc Riêng tư tùy theo yêu cầu (ở đây giả sử Admin hoặc công khai)
 */
exports.getProductReviewsAndStats = async (req, res) => {
  const { id } = req.params;
  console.info(`Starting getProductReviewsAndStats for product ID: ${id}`);

  try {
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findById(id);
    if (!product) {
      console.warn(`Product not found for ID: ${id}`);
      return res
        .status(404)
        .json({ success: false, message: "Sản phẩm không tồn tại" });
    }

    console.info(`Product found for ID: ${id}`);

    // Lấy tất cả reviews của sản phẩm
    const reviews = await Review.find({ productId: id })
      .populate("reviewerId", "username fullname")
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất trước

    // Tính toán trung bình rating và tổng lượt review sử dụng aggregation
    const stats = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats.length > 0 ? stats[0].averageRating : 0;
    const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

    res.status(200).json({
      success: true,
      averageRating: averageRating.toFixed(1), // Làm tròn 1 chữ số thập phân
      totalReviews,
      data: reviews,
    });
  } catch (error) {
    console.error(
      `Error in getProductReviewsAndStats for product ID: ${id}: ${error.message}`
    );
    handleError(res, error, "Lỗi khi lấy đánh giá sản phẩm");
  }
};

// // --- Quản Lý Danh Mục (Category Management) ---

// /**
//  * @desc Tạo một danh mục mới
//  * @route POST /api/admin/categories
//  * @access Riêng tư (Admin)
//  */
// exports.createCategoryAdmin = async (req, res) => {
//   const { name } = req.body; // Lấy tên danh mục từ request body
//   if (!name) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Tên danh mục là bắt buộc" });
//   }
//   try {
//     // Kiểm tra xem danh mục đã tồn tại chưa (dựa trên trường 'name' là unique)
//     const existingCategory = await Category.findOne({ name });
//     if (existingCategory) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Danh mục với tên này đã tồn tại" });
//     }
//     const category = await Category.create({ name }); // Tạo danh mục mới
//     res.status(201).json({
//       success: true,
//       message: "Tạo danh mục thành công",
//       data: category,
//     });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi tạo danh mục");
//   }
// };

// /**
//  * @desc Lấy tất cả danh mục
//  * @route GET /api/admin/categories
//  * @access Riêng tư (Admin) hoặc Công khai (tùy theo yêu cầu)
//  */
// exports.getCategoriesAdmin = async (req, res) => {
//   try {
//     const categories = await Category.find(); // Lấy tất cả danh mục
//     res
//       .status(200)
//       .json({ success: true, count: categories.length, data: categories });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi lấy danh sách danh mục");
//   }
// };

// /**
//  * @desc Cập nhật một danh mục
//  * @route PUT /api/admin/categories/:categoryId
//  * @access Riêng tư (Admin)
//  */
// exports.updateCategoryAdmin = async (req, res) => {
//   const { categoryId } = req.params; // Lấy ID danh mục
//   const { name } = req.body; // Lấy tên mới
//   if (!name) {
//     return res.status(400).json({
//       success: false,
//       message: "Tên danh mục là bắt buộc để cập nhật",
//     });
//   }
//   try {
//     // Tìm và cập nhật danh mục, trả về bản ghi mới (new: true), chạy validators (runValidators: true)
//     const category = await Category.findByIdAndUpdate(
//       categoryId,
//       { name },
//       { new: true, runValidators: true }
//     );
//     if (!category) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Danh mục không tồn tại" });
//     }
//     res.status(200).json({
//       success: true,
//       message: "Cập nhật danh mục thành công",
//       data: category,
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       // Xử lý lỗi trùng tên
//       return handleError(res, error, "Danh mục với tên này đã tồn tại.", 400);
//     }
//     handleError(res, error, "Lỗi khi cập nhật danh mục");
//   }
// };

// /**
//  * @desc Xóa một danh mục
//  * @route DELETE /api/admin/categories/:categoryId
//  * @access Riêng tư (Admin)
//  */
// exports.deleteCategoryAdmin = async (req, res) => {
//   const { categoryId } = req.params;
//   try {
//     const category = await Category.findById(categoryId);
//     if (!category) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Danh mục không tồn tại" });
//     }
//     // TODO: Cân nhắc điều gì xảy ra với các sản phẩm thuộc danh mục này.
//     // Option 1: Không cho phép xóa nếu có sản phẩm tồn tại. (Đã triển khai)
//     // Option 2: Đặt category của sản phẩm thành null hoặc một danh mục mặc định.
//     // Option 3: Xóa luôn các sản phẩm đó (nguy hiểm).
//     const productsInCategory = await Product.countDocuments({
//       categoryId: categoryId,
//     });
//     if (productsInCategory > 0) {
//       return res.status(400).json({
//         success: false,
//         message: `Không thể xóa danh mục. Có ${productsInCategory} sản phẩm đang liên kết với danh mục này.`,
//       });
//     }

//     await Category.findByIdAndDelete(categoryId); // Xóa danh mục
//     res.status(200).json({ success: true, message: "Xóa danh mục thành công" });
//   } catch (error) {
//     handleError(res, error, "Lỗi khi xóa danh mục");
//   }
// };

exports.getAdminReport = async (req, res) => {
  const { period } = req.query;
  try {
    // Date filter setup
    let dateFilter = {};
    const now = new Date();
    let startDate = null;

    // Get products by category count first
    const productsByCategory = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category._id",
          name: { $first: "$category.name" },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          name: 1,
          count: 1
        }
      }
    ]);

    if (period === "week") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === "month") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "year") {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    if (startDate) {
      dateFilter = { createdAt: { $gte: startDate } };
    }

    // Get active seller/buyer IDs from orders
    const activeBuyerIds = await Order.distinct("buyerId", dateFilter);
    const activeSellerIdsAgg = await OrderItem.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.sellerId",
        },
      },
    ]);

    const activeSellerIds = activeSellerIdsAgg.map((s) => s._id);

    const [
      orderStats,
      totalUsers,
      topSellers,
      totalProducts,
      newProducts,
      totalRevenueStats,
      uniqueCustomersStats,
      productsShippedStats,
      ratingStats,
      topRatedProducts,
      lowStockProducts,
      outOfStockProducts,
      returnRequestsCount,
      disputesCount,
      revenueOverTime,
      orderOverTime,
      revenueByCategory,
      topProducts,
      recentActivity,
      activeSellers,
      activeBuyers,
    ] = await Promise.all([
      // Order status stats
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { status: "$_id", count: 1, _id: 0 } },
      ]),
      User.countDocuments({}),
      // Top sellers by revenue
      Order.aggregate([
        { $match: { ...dateFilter, status: "shipped" } },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.sellerId",
            totalRevenue: { $sum: "$totalPrice" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "seller",
          },
        },
        { $unwind: "$seller" },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            seller: "$seller.username",
            totalRevenue: 1,
            orderCount: 1,
            _id: 0,
          },
        },
      ]),
      Product.countDocuments({}),
      Product.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
      Order.aggregate([
        { $match: { ...dateFilter, status: { $in: ["shipped"] } } },
        { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
      ]),
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$buyerId" } },
        { $count: "uniqueCustomers" },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, status: "shipped" } },
        {
          $lookup: {
            from: "orderitems",
            localField: "_id",
            foreignField: "orderId",
            as: "items",
          },
        },
        { $unwind: "$items" },
        { $group: { _id: null, productsShipped: { $sum: "$items.quantity" } } },
      ]),
      Review.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            averageRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
      Review.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$productId", avgRating: { $avg: "$rating" } } },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $sort: { avgRating: -1 } },
        { $limit: 5 },
        {
          $project: {
            product: "$product.title",
            avgRating: { $toDouble: { $round: ["$avgRating", 1] } },
            _id: 0,
          },
        },
      ]),
      Inventory.aggregate([
        { $match: { quantity: { $lt: 20, $gt: 0 } } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $project: { product: "$product.title", quantity: 1, _id: 0 } },
      ]),
      Inventory.aggregate([
        { $match: { quantity: 0 } },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $project: { product: "$product.title", quantity: 1, _id: 0 } },
      ]),
      ReturnRequest.countDocuments(dateFilter),
      Dispute.countDocuments({ ...dateFilter, status: "open" }),
      Order.aggregate([
        { $match: { ...dateFilter, status: "shipped" } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
            revenue: { $sum: "$totalPrice" },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", revenue: 1, _id: 0 } },
      ]),
      Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$orderDate" } },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", orders: 1, _id: 0 } },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, status: "shipped" } },
        {
          $lookup: {
            from: "orderitems",
            localField: "_id",
            foreignField: "orderId",
            as: "items",
          },
        },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.categoryId",
            value: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        { $project: { name: "$category.name", value: 1, _id: 0 } },
      ]),
      Order.aggregate([
        { $match: { ...dateFilter, status: "shipped" } },
        {
          $lookup: {
            from: "orderitems",
            localField: "_id",
            foreignField: "orderId",
            as: "items",
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            quantity: { $sum: "$items.quantity" },
            revenue: {
              $sum: { $multiply: ["$items.quantity", "$items.unitPrice"] },
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $project: {
            product: "$product.title",
            quantity: 1,
            revenue: 1,
            _id: 0,
          },
        },
      ]),
      Promise.all([
        User.find(dateFilter)
          .select("username createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .then((docs) =>
            docs.map((d) => ({
              type: "New User",
              details: d.username,
              createdAt: d.createdAt,
            }))
          ),
        Order.find(dateFilter)
          .select("totalPrice createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .then((docs) =>
            docs.map((d) => ({
              type: "New Order",
              details: `Total: ${d.totalPrice}`,
              createdAt: d.createdAt,
            }))
          ),
        Product.find(dateFilter)
          .select("title createdAt")
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
          .then((docs) =>
            docs.map((d) => ({
              type: "New Product",
              details: d.title,
              createdAt: d.createdAt,
            }))
          ),
      ]).then((results) =>
        results
          .flat()
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 10)
      ),
      // Đếm active seller và buyer từ danh sách ID
      User.countDocuments({ role: "seller", _id: { $in: activeSellerIds } }),
      User.countDocuments({ role: "buyer", _id: { $in: activeBuyerIds } }),
    ]);

    const orderStatus = {
      pending: 0,
      shipping: 0,
      shipped: 0,
      failedToShip: 0,
      rejected: 0,
    };
    orderStats.forEach((stat) => {
      orderStatus[stat.status] = stat.count;
    });

    const conversionRate = totalUsers
      ? ((activeBuyers / totalUsers) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      summary: {
        totalRevenue: totalRevenueStats[0]?.totalRevenue || 0,
        totalOrders: orderStats.reduce((sum, stat) => sum + stat.count, 0),
        orderStatus,
        uniqueCustomers: uniqueCustomersStats[0]?.uniqueCustomers || 0,
        productsShipped: productsShippedStats[0]?.productsShipped || 0,
        totalUsers,
        activeSellers,
        activeBuyers,
        conversionRate,
        totalProducts,
        newProducts,
      },

      topSellers,
      ratings: {
        averageRating: ratingStats[0]?.averageRating?.toFixed(1) || 0,
        totalReviews: ratingStats[0]?.totalReviews || 0,
        topRatedProducts,
      },
      stock: {
        lowStockProducts,
        outOfStockProducts,
      },
      returns: {
        returnRequestsCount,
        disputesCount,
      },
      trends: {
        revenueOverTime,
        orderOverTime,
      },
      insights: {
        revenueByCategory,
        topProducts,
        productsByCategory,
      },
      activities: {
        recentActivity,
      },
    });
  } catch (error) {
    handleError(res, error, "Lỗi khi lấy báo cáo dashboard");
  }
};

// --- Admin User Management ---
/**
 * @desc Create a new admin user (by super admin only)
 * @route POST /api/admin/create-admin-user
 * @access Private (Admin only)
 */
exports.createAdminUser = async (req, res) => {
  try {
    const { username, email, password, fullname, role } = req.body;
    const bcrypt = require('bcryptjs');

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: "Username, email, và password là bắt buộc" });
    }

    // Check if role is valid admin role
    const validAdminRoles = ['admin', 'monitor', 'support', 'finance'];
    if (!role || !validAdminRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Vai trò phải là một trong: ${validAdminRoles.join(', ')}`
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username hoặc email đã tồn tại" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new admin user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      fullname: fullname || username,
      role: role, // admin, monitor, support, finance
      action: 'unlock', // Default unlocked
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: `Admin user ${role} created successfully`,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      }
    });
  } catch (error) {
    handleError(res, error, "Lỗi tạo admin user", 500);
  }
};

/**
 * @desc Update user role by admin
 * @route PUT /api/admin/users/:userId/role
 * @access Private (Admin only)
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ success: false, message: "Vai trò là bắt buộc" });
    }

    // All valid roles (including new admin roles)
    const validRoles = ['buyer', 'seller', 'admin', 'monitor', 'support', 'finance'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Vai trò phải là một trong: ${validRoles.join(', ')}`
      });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng" });
    }

    res.json({
      success: true,
      message: `Vai trò người dùng đã được cập nhật thành ${role}`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    handleError(res, error, "Lỗi cập nhật vai trò người dùng", 500);
  }
};