import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import { getAuditLogs } from "./AdminAuditLogService";

export default function ManageAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        loadAuditLogs();
    }, []);

    const loadAuditLogs = async () => {
        setLoading(true);

        try {
            const res = await getAuditLogs(token);

            if (res.data.success) {
                setLogs(res.data.data);
            } else {
                setLogs(res.data);
            }
        } catch (err) {
            console.error("Load audit logs failed", err);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            // User
            case "USER_CREATE":
            case "USER_UNLOCK":
            case "USER_APPROVE":
                return "success";

            case "USER_LOCK":
            case "USER_REJECT":
            case "USER_DELETE":
                return "error";

            case "USER_UPDATE":
            case "USER_CHANGE_ROLE":
                return "warning";

            // Store
            case "STORE_APPROVE":
                return "success";

            case "STORE_REJECT":
            case "STORE_DELETE":
                return "error";

            case "STORE_UPDATE":
                return "warning";

            // Product
            case "PRODUCT_CREATE":
                return "success";

            case "PRODUCT_DELETE":
                return "error";

            case "PRODUCT_UPDATE":
            case "PRODUCT_STATUS_CHANGE":
                return "warning";

            // Coupon
            case "COUPON_CREATE":
                return "success";

            case "COUPON_DELETE":
                return "error";

            case "COUPON_UPDATE":
                return "warning";

            // Order
            case "ORDER_CREATE":
                return "success";

            case "ORDER_STATUS_UPDATE":
                return "info";

            case "ORDER_CANCEL":
                return "error";

            // Review
            case "REVIEW_DELETE":
                return "error";

            // Dispute
            case "DISPUTE_UPDATE":
                return "warning";

            case "DISPUTE_CLOSE":
                return "success";

            // Admin
            case "ADMIN_LOGIN":
                return "primary";

            case "ADMIN_LOGOUT":
                return "secondary";

            case "ADMIN_CREATE":
                return "success";

            default:
                return "default";
        }
    };

    return (
        <Box>
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
                            justifyContent: "center",
                            py: 6,
                        }}
                    >
                        <CircularProgress />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table>

                            <TableHead>
                                <TableRow>
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

                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell align="center" colSpan={7}>
                                            No Audit Logs
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow hover key={log._id}>

                                            {/* Time */}
                                            <TableCell>
                                                <Typography fontWeight={600}>
                                                    {new Date(log.createdAt).toLocaleDateString()}
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {new Date(log.createdAt).toLocaleTimeString()}
                                                </Typography>
                                            </TableCell>

                                            {/* Admin */}
                                            <TableCell>
                                                <Typography fontWeight={600}>
                                                    {log.admin?.username || "-"}
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {log.admin?.email || ""}
                                                </Typography>
                                            </TableCell>

                                            {/* Action */}
                                            <TableCell>
                                                <Chip
                                                    label={log.action}
                                                    color={getActionColor(log.action)}
                                                    sx={{
                                                        fontWeight: 700,
                                                        borderRadius: 5,
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Target */}
                                            <TableCell>
                                                <Typography fontWeight={600}>
                                                    {log.targetType}
                                                </Typography>

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {log.targetId}
                                                </Typography>
                                            </TableCell>

                                            {/* Description */}
                                            <TableCell sx={{ maxWidth: 280 }}>
                                                {log.description}
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell>
                                                <Chip
                                                    label="SUCCESS"
                                                    color="success"
                                                    size="small"
                                                />
                                            </TableCell>

                                            {/* IP */}
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {log.ip}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
        </Box>
    );
}