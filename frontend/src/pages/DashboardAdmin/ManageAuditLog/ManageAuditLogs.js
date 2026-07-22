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
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";

import { getAuditLogs } from "./AdminAuditLogService";

export default function ManageAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- State cho Search & Filter ---
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAction, setSelectedAction] = useState("ALL");

    // --- State cho Phân trang (Pagination) ---
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        loadAuditLogs();
    }, []);

    const loadAuditLogs = async () => {
        setLoading(true);

        try {
            const res = await getAuditLogs(token);

            if (res.data?.success) {
                setLogs(res.data.data);
            } else if (Array.isArray(res.data)) {
                setLogs(res.data);
            } else {
                setLogs([]);
            }
        } catch (err) {
            console.error("Load audit logs failed", err);
        } finally {
            setLoading(false);
        }
    };

    // --- Logic Lọc danh sách theo Search & Action ---
    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            // Lọc theo Action Dropdown
            if (selectedAction !== "ALL" && log.action !== selectedAction) {
                return false;
            }

            // Lọc theo Từ khóa tìm kiếm
            if (!searchTerm.trim()) return true;

            const term = searchTerm.toLowerCase();
            const username = log.admin?.username?.toLowerCase() || "";
            const email = log.admin?.email?.toLowerCase() || "";
            const action = log.action?.toLowerCase() || "";
            const targetType = log.targetType?.toLowerCase() || "";
            const targetId = log.targetId?.toLowerCase() || "";
            const description = log.description?.toLowerCase() || "";
            const ip = log.ip?.toLowerCase() || "";

            return (
                username.includes(term) ||
                email.includes(term) ||
                action.includes(term) ||
                targetType.includes(term) ||
                targetId.includes(term) ||
                description.includes(term) ||
                ip.includes(term)
            );
        });
    }, [logs, searchTerm, selectedAction]);

    // --- Handling Phân trang ---
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0); // Reset về trang đầu tiên
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(0); // Reset về trang đầu tiên khi tìm kiếm
    };

    const handleActionFilterChange = (e) => {
        setSelectedAction(e.target.value);
        setPage(0); // Reset về trang đầu tiên khi chọn filter
    };

    // --- Màu sắc theo loại Action ---
    const getActionColor = (action) => {
        switch (action) {
            case "USER_LOCK":
            case "SHOP_REJECT":
            case "PRODUCT_DELETE":
            case "CATEGORY_DELETE":
                return "error";
            case "USER_UNLOCK":
            case "SHOP_APPROVE":
            case "PRODUCT_CREATE":
            case "CATEGORY_CREATE":
                return "success";
            case "USER_UPDATE":
            case "PRODUCT_UPDATE":
            case "CATEGORY_UPDATE":
                return "warning";
            case "ADMIN_LOGIN":
                return "primary";
            default:
                return "default";
        }
    };

    // Cắt danh sách log theo trang hiện tại
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
                    startIcon={<RefreshIcon />}
                    onClick={loadAuditLogs}
                >
                    Refresh
                </Button>
            </Box>

            {/* Thanh Search & Lọc */}
            <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems="center"
                >
                    {/* Ô nhập tìm kiếm */}
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Tìm kiếm theo Admin, Action, Target, IP, Mô tả..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                    />

                    {/* Filter theo Action */}
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Loại Hành Động</InputLabel>
                        <Select
                            value={selectedAction}
                            label="Loại Hành Động"
                            onChange={handleActionFilterChange}
                        >
                            <MenuItem value="ALL">Tất cả hành động</MenuItem>
                            <MenuItem value="ADMIN_LOGIN">ADMIN_LOGIN</MenuItem>
                            <MenuItem value="USER_LOCK">USER_LOCK</MenuItem>
                            <MenuItem value="USER_UNLOCK">USER_UNLOCK</MenuItem>
                            <MenuItem value="STORE_UPDATE">STORE_UPDATE</MenuItem>
                            <MenuItem value="STORE_APPROVE">STORE_APPROVE</MenuItem>
                            <MenuItem value="STORE_REJECT">STORE_REJECT</MenuItem>
                            <MenuItem value="SHOP_REJECT">SHOP_REJECT</MenuItem>
                            <MenuItem value="PRODUCT_CREATE">PRODUCT_CREATE</MenuItem>
                            <MenuItem value="PRODUCT_UPDATE">PRODUCT_UPDATE</MenuItem>
                            <MenuItem value="PRODUCT_DELETE">PRODUCT_DELETE</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Paper>

            {/* Bảng Dữ Liệu */}
            <Paper
                elevation={4}
                sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                }}
            >
                {loading ? (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent:"center",
                            py: 6,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}>
                                        <TableCell><b>Time</b></TableCell>
                                        <TableCell><b>Admin</b></TableCell>
                                        <TableCell><b>Action</b></TableCell>
                                        <TableCell><b>Target</b></TableCell>
                                        <TableCell><b>Description</b></TableCell>
                                        <TableCell><b>Status</b></TableCell>
                                        <TableCell><b>IP</b></TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {paginatedLogs.length === 0 ? (
                                        <TableRow>
                                            <TableCell align="center" colSpan={7} sx={{ py: 4 }}>
                                                <Typography color="text.secondary">
                                                    Không tìm thấy nhật ký Audit Log nào.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedLogs.map((log) => (
                                            <TableRow hover key={log._id || log.id}>
                                                {/* Time */}
                                                <TableCell>
                                                    <Typography fontWeight={600} variant="body2">
                                                        {new Date(log.createdAt).toLocaleDateString()}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        display="block"
                                                    >
                                                        {new Date(log.createdAt).toLocaleTimeString()}
                                                    </Typography>
                                                </TableCell>

                                                {/* Admin */}
                                                <TableCell>
                                                    <Typography fontWeight={600} variant="body2">
                                                        {log.admin?.username || "-"}
                                                    </Typography>
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        display="block"
                                                    >
                                                        {log.admin?.email || ""}
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
                                                    >
                                                        {log.targetId || ""}
                                                    </Typography>
                                                </TableCell>

                                                {/* Description */}
                                                <TableCell sx={{ maxWidth: 280 }}>
                                                    <Typography variant="body2" noWrap title={log.description}>
                                                        {log.description || "-"}
                                                    </Typography>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell>
                                                    <Chip
                                                        label="SUCCESS"
                                                        color="success"
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                </TableCell>

                                                {/* IP */}
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {log.ip || "-"}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* Thanh Phân Trang (Pagination) */}
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            component="div"
                            count={filteredLogs.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="Số dòng mỗi trang:"
                            labelDisplayedRows={({ from, to, count }) =>
                                `${from}–${to} trong tổng số ${count !== -1 ? count : `hơn ${to}`}`
                            }
                        />
                    </>
                )}
            </Paper>
        </Box>
    );
}