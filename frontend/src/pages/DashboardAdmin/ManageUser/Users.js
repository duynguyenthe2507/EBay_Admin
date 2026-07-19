import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Tooltip from "@mui/material/Tooltip";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  TableContainer,
  TextField,
  Typography,
  Grid,
  Avatar,
  Chip,
  InputAdornment,
  Card,
  CardContent,
  Divider,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
} from "@mui/material";
import axios from "axios";
import UpdateUser from "./UpdateUser";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import StorefrontIcon from "@mui/icons-material/Storefront";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LockPersonIcon from "@mui/icons-material/LockPerson";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import BlockIcon from "@mui/icons-material/Block";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import Title from "../Title";

// Component to display user status
const UserStatusChip = ({ status }) => {
  let color = "default";
  let label = status || "Unknown";

  switch (status) {
    case "active":
      color = "success";
      break;
    case "pending":
      color = "warning";
      break;
    case "lock":
      color = "error";
      break;
    case "unlock":
      color = "primary";
      break;
    default:
      color = "default";
  }

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 500, textTransform: 'capitalize' }}
    />
  );
};

// Component cho Role Icon
const RoleIcon = ({ role }) => {
  switch (role) {
    case "admin":
      return <AdminPanelSettingsIcon color="primary" />;
    case "seller":
      return <StorefrontIcon color="secondary" />;
    default:
      return <PersonIcon color="action" />;
  }
};

export default function Users({
  users: initialUsers,
  onUserUpdated,
  currentPage = 1,
  totalPages = 1,
  totalUsers = 0,
  onPageChange,
  filters = { search: '', role: '', action: 'all', newUsers: false },
  onFiltersChange
}) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [deletingUser, setDeletingUser] = React.useState(null);
  const [editingUser, setEditingUser] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    msg: "",
    severity: "success",
  });
  const [keywords, setKeywords] = React.useState(filters.search || "");
  const [selectedRole, setSelectedRole] = React.useState(filters.role || 'all');
  const [actionFilter, setActionFilter] = React.useState(filters.action || 'all');
  const [newUsersFilter, setNewUsersFilter] = React.useState(filters.newUsers || false);
  const [loading, setLoading] = React.useState(false);

  // For actions menu
  const [actionMenuAnchor, setActionMenuAnchor] = React.useState(null);
  const [selectedUser, setSelectedUser] = React.useState(null);

  // For rejection dialog
  const [rejectionDialog, setRejectionDialog] = React.useState({
    open: false,
    user: null,
    reason: '',
  });

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      const response = await axios.delete(
        `http://localhost:9999/api/admin/users/${deletingUser._id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken") || ""
              }`,
          },
          params: { skipAuth: true }, // Chỉ dùng nếu backend xử lý skipAuth
        }
      );

      if (response.status === 200) {
        setSnackbar({
          open: true,
          msg: "User deleted successfully!",
          severity: "success",
        });
        setDeletingUser(null);
        onUserUpdated(currentPage); // Reload current page
      } else {
        throw new Error("Unexpected response status");
      }
    } catch (error) {
      console.error("Delete error:", error.response || error);
      setSnackbar({
        open: true,
        msg: `Error deleting user! ${error.response?.data?.message || error.message
          }`,
        severity: "error",
      });
      setDeletingUser(null);
    }
  };

  // Compute unique roles from users (exclude admin)
  const roles = React.useMemo(() => {
    const roleSet = new Set(['buyer', 'seller']);
    initialUsers.forEach((user) => {
      if (user.role && user.role !== 'admin') roleSet.add(user.role);
    });
    return Array.from(roleSet);
  }, [initialUsers]);

  // Check if user is new (created within 2 weeks / 14 days)
  const isNewUser = (user) => {
    if (!user.createdAt) return false;
    const createdAt = new Date(user.createdAt);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return createdAt >= twoWeeksAgo;
  };

  // Handle search with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onFiltersChange) {
        onFiltersChange({
          search: keywords,
          role: selectedRole,
          action: actionFilter,
          newUsers: newUsersFilter
        });
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywords]);

  // Handle filter changes
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        role: role,
        action: actionFilter,
        newUsers: newUsersFilter
      });
    }
  };

  const handleActionFilterChange = (action) => {
    setActionFilter(action);
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        role: selectedRole,
        action: action,
        newUsers: newUsersFilter
      });
    }
  };

  const handleNewUsersFilterChange = (checked) => {
    setNewUsersFilter(checked);
    if (onFiltersChange) {
      onFiltersChange({
        ...filters,
        role: selectedRole,
        action: actionFilter,
        newUsers: checked
      });
    }
  };

  const handleClearFilters = () => {
    setKeywords("");
    setSelectedRole('all');
    setActionFilter('all');
    setNewUsersFilter(false);
    if (onFiltersChange) {
      onFiltersChange({
        search: '',
        role: '',
        action: 'all',
        newUsers: false
      });
    }
  };

  // Action menu handlers
  const handleOpenActionMenu = (event, user) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedUser(user);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
  };

  const handleUserAction = (action) => {
    if (action === 'edit' && selectedUser) {
      setEditingUser(selectedUser);
    } else if (action === 'delete' && selectedUser) {
      setDeletingUser(selectedUser);
    } else if (action === 'lock' && selectedUser) {
      handleLockUnlock(selectedUser, 'lock');
    } else if (action === 'unlock' && selectedUser) {
      handleLockUnlock(selectedUser, 'unlock');
    }
    handleCloseActionMenu();
  };

  // Quick lock/unlock function
  const handleLockUnlock = async (user, action) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `http://localhost:9999/api/admin/users/${user._id}`,
        { action: action },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.status === 200) {
        setSnackbar({
          open: true,
          msg: `User ${action === 'lock' ? 'locked' : 'unlocked'} successfully!`,
          severity: "success",
        });
        onUserUpdated(currentPage); // Reload user list
      }
    } catch (error) {
      console.error("Lock/Unlock error:", error);
      setSnackbar({
        open: true,
        msg: `Error ${action === 'lock' ? 'locking' : 'unlocking'} user! ${error.response?.data?.message || error.message
          }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Approve user account function
  const handleApproveUser = async (user, approved, rejectionReason = '') => {
    try {
      setLoading(true);
      const response = await axios.put(
        `http://localhost:9999/api/admin/users/${user._id}/approve`,
        { approved: approved, rejectionReason: rejectionReason || undefined },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.status === 200) {
        setSnackbar({
          open: true,
          msg: approved ? 'Tài khoản đã được duyệt thành công!' : 'Tài khoản đã bị từ chối thành công!',
          severity: "success",
        });
        onUserUpdated(currentPage); // Reload user list
        setRejectionDialog({ open: false, user: null, reason: '' }); // Close dialog
      }
    } catch (error) {
      console.error("Approve error:", error);
      setSnackbar({
        open: true,
        msg: `Lỗi khi ${approved ? 'duyệt' : 'từ chối'} tài khoản! ${error.response?.data?.message || error.message
          }`,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle reject button click - show dialog
  const handleRejectClick = (user) => {
    setRejectionDialog({ open: true, user, reason: '' });
    setActionMenuAnchor(null); // Close menu
  };

  // Handle approve button click - directly approve
  const handleApproveClick = (user) => {
    handleApproveUser(user, true);
    setActionMenuAnchor(null); // Close menu
  };

  // Handle confirm rejection
  const handleConfirmRejection = () => {
    if (rejectionDialog.user) {
      handleApproveUser(rejectionDialog.user, false, rejectionDialog.reason);
    }
  };

  return (
    <React.Fragment>
      <Dialog
        open={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <DeleteIcon color="error" sx={{ mr: 1 }} />
            Confirm User Deletion
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user{" "}
            <b>{deletingUser?.username || deletingUser?.email}</b>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletingUser(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog
        open={rejectionDialog.open}
        onClose={() => setRejectionDialog({ open: false, user: null, reason: '' })}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 400 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <BlockIcon color="error" sx={{ mr: 1 }} />
            Từ Chối Tài Khoản
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn từ chối tài khoản của <b>{rejectionDialog.user?.username || rejectionDialog.user?.email}</b>?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Lý do từ chối (tùy chọn)"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={rejectionDialog.reason}
            onChange={(e) => setRejectionDialog({ ...rejectionDialog, reason: e.target.value })}
            placeholder="Nhập lý do từ chối tài khoản này..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setRejectionDialog({ open: false, user: null, reason: '' })}
            color="inherit"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirmRejection}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Xác Nhận Từ Chối'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>

      {editingUser && (
        <UpdateUser
          user={editingUser}
          open={Boolean(editingUser)}
          onClose={() => setEditingUser(null)}
          onUpdated={(success) => {
            setEditingUser(null);
            if (success) {
              setSnackbar({
                open: true,
                msg: "User updated successfully!",
                severity: "success",
              });
              onUserUpdated(currentPage);
            }
          }}
        />
      )}

      <Box mb={4}>
        <Title highlight={true}>User Management</Title>

        <Box mb={3}>
          <Typography variant="body2" color="text.secondary">
            Manage all users in the system, including admins, sellers, and buyers.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              mb: 3,
            }}
          >
            <CardContent>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                color="primary"
                sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
              >
                <FilterAltIcon sx={{ mr: 1 }} fontSize="small" />
                Filters
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Search
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Name or email..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Role
                </Typography>
                <RadioGroup
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  <FormControlLabel
                    value="all"
                    control={<Radio size="small" color="primary" />}
                    label="All Roles"
                  />
                  {roles.map((role) => (
                    <FormControlLabel
                      key={role}
                      value={role}
                      control={<Radio size="small" color="primary" />}
                      label={
                        <Box display="flex" alignItems="center">
                          <RoleIcon role={role} />
                          <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                            {role}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </RadioGroup>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Status
                </Typography>
                <RadioGroup
                  value={actionFilter}
                  onChange={(e) => handleActionFilterChange(e.target.value)}
                >
                  <FormControlLabel
                    value="all"
                    control={<Radio size="small" color="primary" />}
                    label="All"
                  />
                  <FormControlLabel
                    value="unlock"
                    control={<Radio size="small" color="primary" />}
                    label={
                      <Box display="flex" alignItems="center">
                        <LockOpenIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                        <Typography variant="body2">Active</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="lock"
                    control={<Radio size="small" color="primary" />}
                    label={
                      <Box display="flex" alignItems="center">
                        <LockPersonIcon fontSize="small" color="error" sx={{ mr: 1 }} />
                        <Typography variant="body2">Locked</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </Box>

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newUsersFilter}
                      onChange={(e) => handleNewUsersFilterChange(e.target.checked)}
                      size="small"
                      color="primary"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center">
                      <Badge badgeContent="NEW" color="error" sx={{ mr: 1 }}>
                        <PersonIcon fontSize="small" />
                      </Badge>
                      <Typography variant="body2">New Users (2 weeks)</Typography>
                    </Box>
                  }
                />
              </Box>

              <Button
                startIcon={<ClearAllIcon />}
                variant="outlined"
                size="small"
                fullWidth
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                  Statistics
                </Typography>
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Total Users:</Typography>
                  <Typography variant="body2" fontWeight="bold">{totalUsers}</Typography>
                </Box>

                {roles.map(role => {
                  // Note: This count is approximate based on current page data
                  const count = initialUsers.filter(u => u.role === role).length;
                  return (
                    <Box key={role} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {role}:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">{count}</Typography>
                    </Box>
                  );
                })}

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">Locked:</Typography>
                  <Typography variant="body2" fontWeight="bold" color="error.main">
                    {initialUsers.filter(u => u.action === "lock").length}
                  </Typography>
                </Box>

                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">New (2 weeks):</Typography>
                  <Typography variant="body2" fontWeight="bold" color="info.main">
                    {initialUsers.filter(u => isNewUser(u)).length}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  <Badge
                    badgeContent={totalUsers}
                    color="primary"
                    sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem', height: '18px', minWidth: '18px' } }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" mr={1}>
                      User List
                    </Typography>
                  </Badge>
                </Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <Table sx={{ minWidth: 650 }} size="small" aria-label="user table">
                  <TableHead sx={{ bgcolor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>User Information</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Role</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Created</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {initialUsers.length > 0 ? (
                      initialUsers.map((user) => (
                        <TableRow
                          key={user._id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' } }}
                        >
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Badge
                                badgeContent={isNewUser(user) ? "NEW" : ""}
                                color="error"
                                invisible={!isNewUser(user)}
                                sx={{
                                  '& .MuiBadge-badge': {
                                    fontSize: '0.6rem',
                                    height: '16px',
                                    minWidth: '32px',
                                    borderRadius: '8px'
                                  }
                                }}
                              >
                                <Avatar
                                  src={user.avatarURL}
                                  alt={user.username || user.email}
                                  sx={{ width: 36, height: 36, mr: 1.5 }}
                                />
                              </Badge>
                              <Box>
                                <Typography variant="body2" fontWeight="bold" component="div">
                                  {user.username || "N/A"}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontSize="small">
                                  {user.email || "No email"}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <RoleIcon role={user.role} />
                              <Typography variant="body2" sx={{ ml: 1, textTransform: 'capitalize' }}>
                                {user.role || "User"}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <UserStatusChip status={user.action || "unlock"} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontSize="small" color="text.secondary">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              {user.action === 'unlock' ? (
                                <Tooltip title="Lock Account">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleLockUnlock(user, 'lock')}
                                    disabled={loading}
                                  >
                                    <LockPersonIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Unlock Account">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleLockUnlock(user, 'unlock')}
                                    disabled={loading}
                                  >
                                    <LockOpenIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <IconButton
                                size="small"
                                aria-label="more actions"
                                onClick={(e) => handleOpenActionMenu(e, user)}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1" color="text.secondary">
                            No users found matching your criteria.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" justifyContent="center">
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(e, page) => onPageChange && onPageChange(page)}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Actions menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
        PaperProps={{
          sx: { minWidth: 180, boxShadow: '0px 2px 10px rgba(0,0,0,0.1)', borderRadius: 2 }
        }}
      >
        <MenuItem onClick={() => handleUserAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleUserAction('view')}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        {(selectedUser?.accountStatus === 'pending' || !selectedUser?.accountStatus) && (
          <MenuItem onClick={() => handleApproveClick(selectedUser)}>
            <ListItemIcon>
              <CheckCircleIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Duyệt Tài Khoản</ListItemText>
          </MenuItem>
        )}
        {(selectedUser?.accountStatus === 'approved' || selectedUser?.accountStatus === 'pending' || !selectedUser?.accountStatus) && (
          <MenuItem onClick={() => handleRejectClick(selectedUser)}>
            <ListItemIcon>
              <BlockIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Từ Chối Tài Khoản</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => handleUserAction('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete User</ListItemText>
        </MenuItem>
        {selectedUser?.action === 'unlock' && (
          <MenuItem onClick={() => handleUserAction('lock')}>
            <ListItemIcon>
              <LockPersonIcon fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Lock Account</ListItemText>
          </MenuItem>
        )}
        {selectedUser?.action === 'lock' && (
          <MenuItem onClick={() => handleUserAction('unlock')}>
            <ListItemIcon>
              <LockOpenIcon fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Unlock Account</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </React.Fragment>
  );
}
