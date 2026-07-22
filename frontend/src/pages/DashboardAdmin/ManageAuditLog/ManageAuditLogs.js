import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableCell, TableContainer,
  TableRow, Chip, CircularProgress, Button, TextField, InputAdornment, TablePagination,
  MenuItem, Select, FormControl, InputLabel, Stack, Collapse, IconButton
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

import { getAuditLogs } from "./AdminAuditLogService";

function Row({ log }) {
  const [open, setOpen] = useState(false);

  const getActionColor = (action) => {
    switch (action) {
      case "USER_LOCK":
      case "STORE_REJECT":
      case "PRODUCT_DELETE":
      case "CATEGORY_DELETE": return "error";
      case "USER_UNLOCK":
      case "STORE_APPROVE":
      case "PRODUCT_CREATE":
      case "CATEGORY_CREATE": return "success";
      case "USER_UPDATE":
      case "PRODUCT_UPDATE":
      case "CATEGORY_UPDATE":
      case "STORE_UPDATE": return "warning";
      case "ADMIN_LOGIN": return "primary";
      default: return "default";
    }
  };

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography fontWeight={600} variant="body2">{new Date(log.createdAt).toLocaleDateString()}</Typography>
          <Typography variant="caption" color="text.secondary">{new Date(log.createdAt).toLocaleTimeString()}</Typography>
        </TableCell>
        <TableCell>
          <Typography fontWeight={600} variant="body2">{log.admin?.username || "-"}</Typography>
          <Typography variant="caption" color="text.secondary">{log.admin?.email || ""}</Typography>
        </TableCell>
        <TableCell>
          <Chip label={log.action} color={getActionColor(log.action)} size="small" sx={{ fontWeight: 700 }} />
        </TableCell>
        <TableCell>
          <Typography fontWeight={600} variant="body2">{log.targetType || "-"}</Typography>
          <Typography variant="caption" color="text.secondary">{log.targetId || ""}</Typography>
        </TableCell>
        <TableCell sx={{ maxWidth: 280 }}>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{log.description || "-"}</Typography>
        </TableCell>
        <TableCell>
          <Chip label={log.status || "SUCCESS"} color={log.status === "FAILED" ? "error" : "success"} size="small" variant="outlined" />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom component="div">Chi tiết thay đổi</Typography>
              <Stack direction="row" spacing={4}>
                <Box flex={1}>
                  <Typography variant="subtitle2">Before</Typography>
                  <pre style={{ fontSize: '12px', overflowX: 'auto', background: '#fff', padding: '10px', borderRadius: '4px' }}>
                    {log.before ? JSON.stringify(log.before, null, 2) : "N/A"}
                  </pre>
                </Box>
                <Box flex={1}>
                  <Typography variant="subtitle2">After</Typography>
                  <pre style={{ fontSize: '12px', overflowX: 'auto', background: '#fff', padding: '10px', borderRadius: '4px' }}>
                    {log.after ? JSON.stringify(log.after, null, 2) : "N/A"}
                  </pre>
                </Box>
              </Stack>
              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">IP: {log.ip || "N/A"}</Typography>
                <Typography variant="body2" color="text.secondary">Browser: {log.userAgent || "N/A"}</Typography>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function ManageAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const token = localStorage.getItem("accessToken");

  useEffect(() => {
    loadAuditLogs();
  }, [page, rowsPerPage, selectedAction, targetType, status, startDate, endDate]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        action: selectedAction,
        targetType,
        status,
        startDate,
        endDate
      };
      
      const res = await getAuditLogs(token, params);
      if (res.data?.success) {
        setLogs(res.data.data);
        setTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error("Load audit logs failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(0);
    loadAuditLogs();
  };

  const exportCSV = () => {
    const ws = XLSX.utils.json_to_sheet(logs.map(l => ({
      Time: new Date(l.createdAt).toLocaleString(),
      Admin: l.admin?.username,
      Action: l.action,
      TargetType: l.targetType,
      TargetId: l.targetId,
      Description: l.description,
      Status: l.status,
      IP: l.ip
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AuditLogs");
    XLSX.writeFile(wb, "AuditLogs.csv");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(logs.map(l => ({
      Time: new Date(l.createdAt).toLocaleString(),
      Admin: l.admin?.username,
      Action: l.action,
      TargetType: l.targetType,
      TargetId: l.targetId,
      Description: l.description,
      Status: l.status,
      IP: l.ip
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AuditLogs");
    XLSX.writeFile(wb, "AuditLogs.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Audit Logs Report", 14, 15);
    const tableData = logs.map(l => [
      new Date(l.createdAt).toLocaleString(),
      l.admin?.username,
      l.action,
      l.targetType,
      l.status
    ]);
    doc.autoTable({
      head: [["Time", "Admin", "Action", "Target", "Status"]],
      body: tableData,
      startY: 20
    });
    doc.save("AuditLogs.pdf");
  };

  return (
    <Box sx={{ p: 1 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Audit Logs</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={exportCSV} startIcon={<DownloadIcon />}>CSV</Button>
          <Button variant="outlined" onClick={exportExcel} startIcon={<DownloadIcon />}>Excel</Button>
          <Button variant="outlined" onClick={exportPDF} startIcon={<DownloadIcon />}>PDF</Button>
          <Button variant="contained" startIcon={<RefreshIcon />} onClick={loadAuditLogs}>Refresh</Button>
        </Stack>
      </Box>

      <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <TextField fullWidth size="small" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
            />
            <Button variant="contained" onClick={handleSearch}>Search</Button>
          </Stack>
          
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Action</InputLabel>
              <Select value={selectedAction} label="Action" onChange={e => { setSelectedAction(e.target.value); setPage(0); }}>
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="USER_UPDATE">USER_UPDATE</MenuItem>
                <MenuItem value="USER_LOCK">USER_LOCK</MenuItem>
                <MenuItem value="USER_UNLOCK">USER_UNLOCK</MenuItem>
                <MenuItem value="STORE_UPDATE">STORE_UPDATE</MenuItem>
                <MenuItem value="PRODUCT_UPDATE">PRODUCT_UPDATE</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Target Type</InputLabel>
              <Select value={targetType} label="Target Type" onChange={e => { setTargetType(e.target.value); setPage(0); }}>
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Store">Store</MenuItem>
                <MenuItem value="Product">Product</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={e => { setStatus(e.target.value); setPage(0); }}>
                <MenuItem value="">Tất cả</MenuItem>
                <MenuItem value="SUCCESS">SUCCESS</MenuItem>
                <MenuItem value="FAILED">FAILED</MenuItem>
              </Select>
            </FormControl>

            <TextField size="small" type="date" label="Start Date" InputLabelProps={{ shrink: true }} value={startDate} onChange={e => { setStartDate(e.target.value); setPage(0); }} />
            <TextField size="small" type="date" label="End Date" InputLabelProps={{ shrink: true }} value={endDate} onChange={e => { setEndDate(e.target.value); setPage(0); }} />
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={4} sx={{ borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "rgba(0, 0, 0, 0.03)" }}>
                    <TableCell />
                    <TableCell><b>Time</b></TableCell>
                    <TableCell><b>Admin</b></TableCell>
                    <TableCell><b>Action</b></TableCell>
                    <TableCell><b>Target</b></TableCell>
                    <TableCell><b>Description</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow><TableCell align="center" colSpan={7} sx={{ py: 4 }}><Typography color="text.secondary">Không tìm thấy nhật ký Audit Log nào.</Typography></TableCell></TableRow>
                  ) : (
                    logs.map((log) => <Row key={log._id} log={log} />)
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}