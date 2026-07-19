import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";

// Component to display order status
const OrderStatusChip = ({ status }) => {
  const statusMap = {
    pending: { color: "warning", label: "Chờ Xử Lý" },
    processing: { color: "info", label: "Đang Xử Lý" },
    shipping: { color: "primary", label: "Đang Giao Hàng" },
    shipped: { color: "success", label: "Đã Giao" },
    "failed to ship": { color: "error", label: "Giao Hàng Thất Bại" },
    rejected: { color: "error", label: "Từ Chối" },
  };

  const statusInfo = statusMap[status] || { color: "default", label: status };

  return (
    <Chip
      label={statusInfo.label}
      color={statusInfo.color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 500 }}
    />
  );
};

export default function OrderDetailDialog({ open, onClose, orderId }) {
  const [order, setOrder] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails();
    } else {
      setOrder(null);
      setError(null);
    }
  }, [open, orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `http://localhost:9999/api/admin/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setError("Không thể tải chi tiết đơn hàng");
      }
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError(
        err.response?.data?.message || "Lỗi khi tải chi tiết đơn hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            Chi Tiết Đơn Hàng
          </Typography>
          <Button onClick={onClose} size="small" sx={{ minWidth: "auto" }}>
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : order ? (
          <Box>
            {/* Order Info */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Thông Tin Đơn Hàng
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Mã Đơn Hàng:</strong>{" "}
                        <span style={{ fontFamily: "monospace" }}>
                          {order._id}
                        </span>
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Ngày Đặt:</strong> {formatDate(order.orderDate || order.createdAt)}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Trạng Thái:</strong>{" "}
                        <OrderStatusChip status={order.status} />
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Tổng Tiền:</strong>{" "}
                        <span style={{ color: "#1976d2", fontWeight: "bold" }}>
                          {formatCurrency(order.totalPrice || 0)}
                        </span>
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Thông Tin Người Mua
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Tên:</strong>{" "}
                        {order.buyerId?.username || order.buyerId?.fullname || "N/A"}
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Email:</strong> {order.buyerId?.email || "N/A"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {order.addressId && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Địa Chỉ Giao Hàng
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          {order.addressId.street && `${order.addressId.street}, `}
                          {order.addressId.ward && `${order.addressId.ward}, `}
                          {order.addressId.district && `${order.addressId.district}, `}
                          {order.addressId.city && `${order.addressId.city}`}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {order.payment && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Thông Tin Thanh Toán
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Phương Thức:</strong> {order.payment.method || "N/A"}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Trạng Thái:</strong>{" "}
                          <Chip
                            label={order.payment.status || "N/A"}
                            size="small"
                            color={order.payment.status === "paid" ? "success" : "warning"}
                          />
                        </Typography>
                        {order.payment.transactionId && (
                          <Typography variant="body2" gutterBottom>
                            <strong>Mã Giao Dịch:</strong>{" "}
                            <span style={{ fontFamily: "monospace" }}>
                              {order.payment.transactionId}
                            </span>
                          </Typography>
                        )}
                        {order.payment.paidAt && (
                          <Typography variant="body2" gutterBottom>
                            <strong>Ngày Thanh Toán:</strong>{" "}
                            {formatDate(order.payment.paidAt)}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Sản Phẩm Trong Đơn Hàng
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            Sản Phẩm
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            Người Bán
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight="bold">
                            Đơn Giá
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight="bold">
                            Số Lượng
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight="bold">
                            Thành Tiền
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            Trạng Thái Vận Chuyển
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item._id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={2}>
                              {item.productId?.image && (
                                <img
                                  src={item.productId.image}
                                  alt={item.productId?.title}
                                  style={{
                                    width: 50,
                                    height: 50,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                  }}
                                />
                              )}
                              <Typography variant="body2">
                                {item.productId?.title || "N/A"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {item.productId?.sellerId?.username ||
                                item.productId?.sellerId?.email ||
                                "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatCurrency(item.unitPrice || 0)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">{item.quantity || 0}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="medium">
                              {formatCurrency((item.unitPrice || 0) * (item.quantity || 0))}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {item.shippingInfo ? (
                              <Chip
                                label={item.shippingInfo.status || "N/A"}
                                size="small"
                                color={
                                  item.shippingInfo.status === "delivered"
                                    ? "success"
                                    : item.shippingInfo.status === "shipping"
                                    ? "primary"
                                    : "default"
                                }
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Chưa có thông tin
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
}

