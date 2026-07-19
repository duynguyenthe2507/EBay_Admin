import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TableContainer,
  TextField,
  Typography,
  Card,
  CardContent,
  Divider,
  useTheme,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import axios from "axios";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import Title from "../Title";
import OrderDetailDialog from "./OrderDetailDialog";
import UpdateOrderStatusDialog from "./UpdateOrderStatusDialog";

// Component to display order status
const OrderStatusChipComponent = ({ status }) => {
  let color = "default";
  let label = status || "Unknown";

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

export default function Orders({
  orders: initialOrders,
  onOrderUpdated,
  currentPage = 1,
  totalPages = 1,
  totalOrders = 0,
  onPageChange,
  filters = { search: "", status: "all" },
  onFiltersChange,
}) {
  const theme = useTheme();
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [keywords, setKeywords] = React.useState(filters.search || "");
  const [statusFilter, setStatusFilter] = React.useState(filters.status || "all");
  const [loading, setLoading] = React.useState(false);

  // For actions menu
  const [actionMenuAnchor, setActionMenuAnchor] = React.useState(null);
  const [selectedOrder, setSelectedOrder] = React.useState(null);

  // For dialogs
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);

  // Handle search
  const handleSearch = () => {
    onFiltersChange({ ...filters, search: keywords });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setKeywords("");
    setStatusFilter("all");
    onFiltersChange({ search: "", status: "all" });
  };

  // Handle status filter change
  const handleStatusFilterChange = (event) => {
    const newStatus = event.target.value;
    setStatusFilter(newStatus);
    onFiltersChange({ ...filters, status: newStatus });
  };

  // Handle menu open
  const handleMenuOpen = (event, order) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedOrder(order);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedOrder(null);
  };

  // Handle view details
  const handleViewDetails = () => {
    setDetailDialogOpen(true);
    handleMenuClose();
  };

  // Handle update status
  const handleUpdateStatus = () => {
    setStatusDialogOpen(true);
    handleMenuClose();
  };

  // Handle order updated
  const handleOrderUpdated = () => {
    onOrderUpdated();
    setDetailDialogOpen(false);
    setStatusDialogOpen(false);
  };

  // Format date
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <React.Fragment>
      {/* Filters Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              placeholder="Tìm kiếm theo ID đơn hàng, tên người mua, email..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 300 }}
              size="small"
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
            >
              Tìm Kiếm
            </Button>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                displayEmpty
              >
                <MenuItem value="all">Tất Cả Trạng Thái</MenuItem>
                <MenuItem value="pending">Chờ Xử Lý</MenuItem>
                <MenuItem value="processing">Đang Xử Lý</MenuItem>
                <MenuItem value="shipping">Đang Giao Hàng</MenuItem>
                <MenuItem value="shipped">Đã Giao</MenuItem>
                <MenuItem value="failed to ship">Giao Hàng Thất Bại</MenuItem>
                <MenuItem value="rejected">Từ Chối</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<ClearAllIcon />}
              onClick={handleClearFilters}
              disabled={loading}
            >
              Xóa Bộ Lọc
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Mã Đơn Hàng
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Người Mua
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Ngày Đặt
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Tổng Tiền
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Trạng Thái
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  Phương Thức Thanh Toán
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="subtitle2" fontWeight="bold">
                  Thao Tác
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : initialOrders && initialOrders.length > 0 ? (
              initialOrders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {order._id.slice(-8).toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {order.buyerId?.username || order.buyerId?.fullname || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.buyerId?.email || ""}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(order.orderDate || order.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium" color="primary">
                      {formatCurrency(order.totalPrice || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <OrderStatusChipComponent status={order.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.payment?.method || "N/A"}
                    </Typography>
                    {order.payment?.status && (
                      <Chip
                        label={order.payment.status}
                        size="small"
                        color={order.payment.status === "paid" ? "success" : "warning"}
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Thao tác">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, order)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    Không tìm thấy đơn hàng nào
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(event, value) => onPageChange(value)}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          Xem Chi Tiết
        </MenuItem>
        <MenuItem onClick={handleUpdateStatus}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Cập Nhật Trạng Thái
        </MenuItem>
      </Menu>

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <OrderDetailDialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          orderId={selectedOrder._id}
        />
      )}

      {/* Update Status Dialog */}
      {selectedOrder && (
        <UpdateOrderStatusDialog
          open={statusDialogOpen}
          onClose={() => setStatusDialogOpen(false)}
          order={selectedOrder}
          onOrderUpdated={handleOrderUpdated}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ width: "100%" }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
}

