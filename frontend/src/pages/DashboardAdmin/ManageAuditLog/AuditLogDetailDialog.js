import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  IconButton,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TerminalOutlinedIcon from "@mui/icons-material/TerminalOutlined";
import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";

export default function AuditLogDetailDialog({ open, onClose, log, getActionColor }) {
  if (!log) return null;

  const hasChanges =
    (log.oldValue !== null && log.oldValue !== undefined) ||
    (log.newValue !== null && log.newValue !== undefined);

  const adminName =
    log.adminName ||
    log.admin?.username ||
    log.admin?.fullname ||
    log.adminId?.username ||
    "N/A";
  const adminEmail = log.adminEmail || log.admin?.email || log.adminId?.email || "N/A";
  const status = log.status ? log.status.toUpperCase() : "SUCCESS";
  const statusColor = status === "SUCCESS" ? "success" : "error";
  const actionColor = getActionColor ? getActionColor(log.action) : "default";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "primary.main",
          color: "white",
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Typography variant="h6" fontWeight="bold" component="span">
            Audit Log Detail
          </Typography>
          <Chip
            label={log.action}
            color={actionColor}
            size="small"
            sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: "uppercase" }}
          />
          <Chip
            label={status}
            color={statusColor}
            variant="outlined"
            size="small"
            sx={{ fontWeight: 700, borderColor: "white", color: "white" }}
          />
        </Box>
        <IconButton aria-label="close" onClick={onClose} sx={{ color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        {/* Section 1: General Information */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <InfoOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              General Information
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Action
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {log.action || "-"}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Time
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {log.createdAt
                  ? `${new Date(log.createdAt).toLocaleDateString()} ${new Date(log.createdAt).toLocaleTimeString()}`
                  : "-"}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Admin Name
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {adminName}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Admin Email
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {adminEmail}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Target Type
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {log.targetType || "-"}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Target ID
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-all" }}>
                {log.targetId || "-"}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" display="block">
                Description
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {log.description || "-"}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                Status
              </Typography>
              <Chip
                label={status}
                color={statusColor}
                variant="outlined"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" display="block">
                IP Address
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {log.ipAddress || log.ip || "-"}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 2.5 }} />

        {/* Section 2: Technical Information */}
        <Box mb={hasChanges ? 3 : 0}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <TerminalOutlinedIcon color="primary" fontSize="small" />
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              Technical Information
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Typography variant="caption" color="text.secondary" display="block">
                Endpoint URL
              </Typography>
              <Typography variant="body2" fontWeight={600} sx={{ wordBreak: "break-all" }}>
                {log.endpoint || "-"}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                HTTP Method
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {log.httpMethod ? (
                  <Chip
                    label={log.httpMethod}
                    size="small"
                    color={
                      log.httpMethod === "DELETE"
                        ? "error"
                        : log.httpMethod === "POST" || log.httpMethod === "PUT"
                          ? "warning"
                          : "info"
                    }
                    sx={{ fontWeight: 700 }}
                  />
                ) : (
                  "-"
                )}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                Browser
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {log.browser || "Unknown"}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                Operating System
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {log.operatingSystem || "Unknown"}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Typography variant="caption" color="text.secondary" display="block">
                Device
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {log.device || "Desktop"}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary" display="block">
                User Agent
              </Typography>
              <Paper
                variant="outlined"
                sx={{ p: 1.5, bgcolor: "grey.50", borderRadius: 1.5, wordBreak: "break-all" }}
              >
                <Typography variant="caption" fontFamily="monospace">
                  {log.userAgent || "-"}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Section 3: Change Information (only if old/new value exists) */}
        {hasChanges && (
          <>
            <Divider sx={{ my: 2.5 }} />
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <CompareArrowsOutlinedIcon color="primary" fontSize="small" />
                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                  Change Information
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {log.oldValue !== null && log.oldValue !== undefined && (
                  <Grid item xs={12} md={log.newValue !== null && log.newValue !== undefined ? 6 : 12}>
                    <Typography variant="caption" color="error.main" fontWeight="bold" display="block" mb={0.5}>
                      Old Value
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        bgcolor: "#fff5f5",
                        borderColor: "#feb2b2",
                        borderRadius: 1.5,
                        maxHeight: 250,
                        overflow: "auto",
                      }}
                    >
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          fontSize: "0.775rem",
                          fontFamily: "Consolas, monospace",
                          color: "#9b2c2c",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {typeof log.oldValue === "object"
                          ? JSON.stringify(log.oldValue, null, 2)
                          : String(log.oldValue)}
                      </Box>
                    </Paper>
                  </Grid>
                )}

                {log.newValue !== null && log.newValue !== undefined && (
                  <Grid item xs={12} md={log.oldValue !== null && log.oldValue !== undefined ? 6 : 12}>
                    <Typography variant="caption" color="success.main" fontWeight="bold" display="block" mb={0.5}>
                      New Value
                    </Typography>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        bgcolor: "#f0fff4",
                        borderColor: "#9ae6b4",
                        borderRadius: 1.5,
                        maxHeight: 250,
                        overflow: "auto",
                      }}
                    >
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          fontSize: "0.775rem",
                          fontFamily: "Consolas, monospace",
                          color: "#22543d",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-all",
                        }}
                      >
                        {typeof log.newValue === "object"
                          ? JSON.stringify(log.newValue, null, 2)
                          : String(log.newValue)}
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
