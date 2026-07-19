import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import axios from "axios";
import EditIcon from "@mui/icons-material/Edit";

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

export default function UpdateOrderStatusDialog({
  open,
  onClose,
  order,
  onOrderUpdated,
}) {
  const [status, setStatus] = React.useState(order?.status || "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (open && order) {
      setStatus(order.status || "");
      setError(null);
      setSuccess(false);
    }
  }, [open, order]);

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  const handleUpdate = async () => {
    if (!status || status === order?.status) {
      setError("Vui lòng chọn trạng thái mới khác với trạng thái hiện tại");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const response = await axios.put(
        `http://localhost:9999/api/admin/orders/${order._id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onOrderUpdated();
          onClose();
        }, 1000);
      } else {
        setError(response.data.message || "Cập nhật trạng thái thất bại");
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(
        err.response?.data?.message || "Lỗi khi cập nhật trạng thái đơn hàng"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <EditIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Cập Nhật Trạng Thái Đơn Hàng
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {order && (
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Mã Đơn Hàng:{" "}
              <span style={{ fontFamily: "monospace" }}>
                {order._id.slice(-8).toUpperCase()}
              </span>
            </Typography>
            <Box sx={{ my: 2 }}>
              <Typography variant="body2" gutterBottom>
                Trạng Thái Hiện Tại:
              </Typography>
              <OrderStatusChip status={order.status} />
            </Box>

            <FormControl fullWidth sx={{ mt: 3 }}>
              <InputLabel>Trạng Thái Mới</InputLabel>
              <Select value={status} onChange={handleStatusChange} label="Trạng Thái Mới">
                <MenuItem value="pending">Chờ Xử Lý</MenuItem>
                <MenuItem value="processing">Đang Xử Lý</MenuItem>
                <MenuItem value="shipping">Đang Giao Hàng</MenuItem>
                <MenuItem value="shipped">Đã Giao</MenuItem>
                <MenuItem value="failed to ship">Giao Hàng Thất Bại</MenuItem>
                <MenuItem value="rejected">Từ Chối</MenuItem>
              </Select>
            </FormControl>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Cập nhật trạng thái thành công!
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button
          onClick={handleUpdate}
          variant="contained"
          disabled={loading || !status || status === order?.status}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? "Đang cập nhật..." : "Cập Nhật"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

