import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Chip,
  CircularProgress,
  Button,
  TextField,
  InputAdornment,
  TablePagination,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
  IconButton,
  Grid,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";

import { getAuditLogs } from "./AdminAuditLogService";
import AuditLogDetailDialog from "./AuditLogDetailDialog";

export default function ManageAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- State for Search & Filters ---
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedTargetType, setSelectedTargetType] = useState("ALL");
  const [selectedDateRange, setSelectedDateRange] = useState("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // --- State for Detail Dialog ---
  const [selectedLogForDetail, setSelectedLogForDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // --- State for Pagination ---
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const token = localStorage.getItem("accessToken");

  // Debounce search term (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearchTerm.trim()) params.search = debouncedSearchTerm.trim();
      if (selectedAction !== "ALL") params.action = selectedAction;
      if (selectedStatus !== "ALL") params.status = selectedStatus;
      if (selectedTargetType !== "ALL") params.targetType = selectedTargetType;
      if (selectedDateRange !== "ALL") {
        params.dateRange = selectedDateRange;
        if (selectedDateRange === "custom") {
          if (customStartDate) params.startDate = customStartDate;
          if (customEndDate) params.endDate = customEndDate;
        }
      }

      const res = await getAuditLogs(token, params);

      if (res.data?.success) {
        setLogs(res.data.data || []);
      } else if (Array.isArray(res.data)) {
        setLogs(res.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Load audit logs failed", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearchTerm,
    selectedAction,
    selectedStatus,
    selectedTargetType,
    selectedDateRange,
    customStartDate,
    customEndDate,
  ]);

  // Client-side filtering logic for combining all filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Action Filter
      if (selectedAction !== "ALL" && log.action !== selectedAction) {
        return false;
      }

      // 2. Status Filter
      if (selectedStatus !== "ALL") {
        const logStatus = (log.status || "SUCCESS").toUpperCase();
        if (logStatus !== selectedStatus) return false;
      }

      // 3. Target Type Filter
      if (selectedTargetType !== "ALL") {
        const logTarget = (log.targetType || "").toLowerCase();
        if (logTarget !== selectedTargetType.toLowerCase()) return false;
      }

      // 4. Date Range Filter
      if (selectedDateRange !== "ALL" && log.createdAt) {
        const logDate = new Date(log.createdAt);
        const now = new Date();

        if (selectedDateRange === "today") {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          if (logDate < todayStart) return false;
        } else if (selectedDateRange === "7days") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          if (logDate < sevenDaysAgo) return false;
        } else if (selectedDateRange === "30days") {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (logDate < thirtyDaysAgo) return false;
        } else if (selectedDateRange === "custom") {
          if (customStartDate && logDate < new Date(customStartDate)) return false;
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (logDate > end) return false;
          }
        }
      }

      // 5. Search Keyword Filter
      if (!debouncedSearchTerm.trim()) return true;

      const term = debouncedSearchTerm.toLowerCase();
      const adminName = (log.adminName || log.admin?.username || log.admin?.fullname || "").toLowerCase();
      const adminEmail = (log.adminEmail || log.admin?.email || "").toLowerCase();
      const action = (log.action || "").toLowerCase();
      const targetType = (log.targetType || "").toLowerCase();
      const targetId = String(log.targetId || "").toLowerCase();
      const description = (log.description || "").toLowerCase();
      const ip = (log.ipAddress || log.ip || "").toLowerCase();

      return (
        adminName.includes(term) ||
        adminEmail.includes(term) ||
        action.includes(term) ||
        targetType.includes(term) ||
        targetId.includes(term) ||
        description.includes(term) ||
        ip.includes(term)
      );
    });
  }, [
    logs,
    debouncedSearchTerm,
    selectedAction,
    selectedStatus,
    selectedTargetType,
    selectedDateRange,
    customStartDate,
    customEndDate,
  ]);

  // Action Chip Colors
  const getActionColor = (action = "") => {
    const act = action.toUpperCase();

    // Green
    if (
      act.includes("SUCCESS") ||
      act.includes("UNLOCK") ||
      act.includes("APPROVE") ||
      act.includes("RESTORE")
    ) {
      return "success";
    }

    // Red
    if (
      act.includes("DELETE") ||
      act.includes("LOCK") ||
      act.includes("REJECT") ||
      act.includes("FAILED") ||
      act.includes("CANCEL")
    ) {
      return "error";
    }

    // Orange: Update, Change, Edit, Password Change
    if (
      act.includes("UPDATE") ||
      act.includes("CHANGE") ||
      act.includes("EDIT")
    ) {
      return "warning";
    }

    // Blue: Create, Login, Export, System
    if (
      act.includes("CREATE") ||
      act.includes("LOGIN") ||
      act.includes("EXPORT")
    ) {
      return "info";
    }

    return "primary";
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedAction("ALL");
    setSelectedStatus("ALL");
    setSelectedTargetType("ALL");
    setSelectedDateRange("ALL");
    setCustomStartDate("");
    setCustomEndDate("");
    setPage(0);
  };

  // Pagination Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDetail = (log) => {
    setSelectedLogForDetail(log);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedLogForDetail(null);
  };

  // Paginated data
  const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ p: 1 }}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" fontWeight="bold">
          Audit Logs
        </Typography>

        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
          onClick={loadAuditLogs}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters & Search Panel */}
      <Paper elevation={2} sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search Input */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by Admin, Action, Target, IP, Description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Action Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Action</InputLabel>
              <Select
                value={selectedAction}
                label="Action"
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Actions</MenuItem>
                <MenuItem value="LOGIN_SUCCESS">LOGIN_SUCCESS</MenuItem>
                <MenuItem value="LOGIN_FAILED">LOGIN_FAILED</MenuItem>
                <MenuItem value="PASSWORD_CHANGE">PASSWORD_CHANGE</MenuItem>
                <MenuItem value="USER_CREATE">USER_CREATE</MenuItem>
                <MenuItem value="USER_UPDATE">USER_UPDATE</MenuItem>
                <MenuItem value="USER_DELETE">USER_DELETE</MenuItem>
                <MenuItem value="USER_LOCK">USER_LOCK</MenuItem>
                <MenuItem value="USER_UNLOCK">USER_UNLOCK</MenuItem>
                <MenuItem value="USER_CHANGE_ROLE">USER_CHANGE_ROLE</MenuItem>
                <MenuItem value="PRODUCT_CREATE">PRODUCT_CREATE</MenuItem>
                <MenuItem value="PRODUCT_UPDATE">PRODUCT_UPDATE</MenuItem>
                <MenuItem value="PRODUCT_DELETE">PRODUCT_DELETE</MenuItem>
                <MenuItem value="PRODUCT_APPROVE">PRODUCT_APPROVE</MenuItem>
                <MenuItem value="PRODUCT_REJECT">PRODUCT_REJECT</MenuItem>
                <MenuItem value="STORE_APPROVE">STORE_APPROVE</MenuItem>
                <MenuItem value="STORE_REJECT">STORE_REJECT</MenuItem>
                <MenuItem value="STORE_LOCK">STORE_LOCK</MenuItem>
                <MenuItem value="STORE_UNLOCK">STORE_UNLOCK</MenuItem>
                <MenuItem value="STORE_UPDATE">STORE_UPDATE</MenuItem>
                <MenuItem value="REVIEW_DELETE">REVIEW_DELETE</MenuItem>
                <MenuItem value="COUPON_CREATE">COUPON_CREATE</MenuItem>
                <MenuItem value="COUPON_UPDATE">COUPON_UPDATE</MenuItem>
                <MenuItem value="COUPON_DELETE">COUPON_DELETE</MenuItem>
                <MenuItem value="ORDER_CANCEL">ORDER_CANCEL</MenuItem>
                <MenuItem value="ORDER_STATUS_UPDATE">ORDER_STATUS_UPDATE</MenuItem>
                <MenuItem value="DISPUTE_APPROVE">DISPUTE_APPROVE</MenuItem>
                <MenuItem value="DISPUTE_REJECT">DISPUTE_REJECT</MenuItem>
                <MenuItem value="DISPUTE_CLOSE">DISPUTE_CLOSE</MenuItem>
                <MenuItem value="SYSTEM_EXPORT_REPORT">SYSTEM_EXPORT_REPORT</MenuItem>
                <MenuItem value="SYSTEM_UPDATE_SETTINGS">SYSTEM_UPDATE_SETTINGS</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Status Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="SUCCESS">Success</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Target Type Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Target Type</InputLabel>
              <Select
                value={selectedTargetType}
                label="Target Type"
                onChange={(e) => {
                  setSelectedTargetType(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Targets</MenuItem>
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Shop">Shop</MenuItem>
                <MenuItem value="Product">Product</MenuItem>
                <MenuItem value="Order">Order</MenuItem>
                <MenuItem value="Review">Review</MenuItem>
                <MenuItem value="Voucher">Voucher</MenuItem>
                <MenuItem value="Dispute">Dispute</MenuItem>
                <MenuItem value="System">System</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Date Range Filter */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={selectedDateRange}
                label="Date Range"
                onChange={(e) => {
                  setSelectedDateRange(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="ALL">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Custom Date Pickers (Shown if Custom Range is selected) */}
          {selectedDateRange === "custom" && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Start Date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="End Date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setPage(0);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </>
          )}

          {/* Clear Filters Button */}
          <Grid item xs={12} md={selectedDateRange === "custom" ? 6 : 12} display="flex" justifyContent="flex-end">
            <Button
              startIcon={<ClearAllIcon />}
              variant="outlined"
              size="small"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Table */}
      <Paper elevation={4} sx={{ borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(0, 0, 0, 0.04)" }}>
                    <TableCell><b>Time</b></TableCell>
                    <TableCell><b>Admin</b></TableCell>
                    <TableCell><b>Action</b></TableCell>
                    <TableCell><b>Target</b></TableCell>
                    <TableCell><b>Description</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                    <TableCell><b>IP</b></TableCell>
                    <TableCell align="center"><b>Actions</b></TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedLogs.length === 0 ? (
                    <TableRow>
                      <TableCell align="center" colSpan={8} sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No audit logs found matching your criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedLogs.map((log) => {
                      const adminName =
                        log.adminName ||
                        log.admin?.username ||
                        log.admin?.fullname ||
                        log.adminId?.username ||
                        "-";
                      const adminEmail =
                        log.adminEmail ||
                        log.admin?.email ||
                        log.adminId?.email ||
                        "";
                      const status = (log.status || "SUCCESS").toUpperCase();

                      return (
                        <TableRow hover key={log._id || log.id}>
                          {/* Time */}
                          <TableCell>
                            <Typography fontWeight={600} variant="body2">
                              {log.createdAt
                                ? new Date(log.createdAt).toLocaleDateString()
                                : "-"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {log.createdAt
                                ? new Date(log.createdAt).toLocaleTimeString()
                                : ""}
                            </Typography>
                          </TableCell>

                          {/* Admin */}
                          <TableCell>
                            <Typography fontWeight={600} variant="body2">
                              {adminName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                            >
                              {adminEmail}
                            </Typography>
                          </TableCell>

                          {/* Action */}
                          <TableCell>
                            <Chip
                              label={log.action}
                              color={getActionColor(log.action)}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                borderRadius: 1.5,
                                textTransform: "uppercase",
                              }}
                            />
                          </TableCell>

                          {/* Target */}
                          <TableCell>
                            <Typography fontWeight={600} variant="body2">
                              {log.targetType || "-"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{
                                maxWidth: 120,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {log.targetId || ""}
                            </Typography>
                          </TableCell>

                          {/* Description (Truncated + Tooltip) */}
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Tooltip title={log.description || ""} placement="top" arrow>
                              <Typography
                                variant="body2"
                                sx={{
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  display: "block",
                                  cursor: "pointer",
                                }}
                              >
                                {log.description || "-"}
                              </Typography>
                            </Tooltip>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Chip
                              label={status}
                              color={["SUCCESS", "UNLOCK", "UNLOCKED", "ACTIVE"].includes(status) ? "success" : "error"}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>

                          {/* IP */}
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {log.ipAddress || log.ip || "-"}
                            </Typography>
                          </TableCell>

                          {/* Actions Column (View Detail Icon/Button) */}
                          <TableCell align="center">
                            <Tooltip title="View Detail">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenDetail(log)}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredLogs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Rows per page:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
              }
            />
          </>
        )}
      </Paper>

      {/* Audit Log Detail Dialog */}
      <AuditLogDetailDialog
        open={detailOpen}
        onClose={handleCloseDetail}
        log={selectedLogForDetail}
        getActionColor={getActionColor}
      />
    </Box>
  );
}